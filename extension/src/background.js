// Background service worker. Receives "start" from popup, scrapes
// X's internal Bookmarks GraphQL endpoint using the user's session
// cookies + a sniffed query ID, batches results, and POSTs them to
// the user's Bookmarx server.

import { fetchAllBookmarks } from "./xapi.js";
import { transformBookmark } from "./transform.js";
import { installSniffer, captureNow, getCapturedConfig } from "./sniff.js";

installSniffer();

// Rewrite Origin/Referer on our own GraphQL requests so X doesn't silently
// throttle (empty pages) based on the chrome-extension:// origin. Scoped to
// extension-initiated requests via initiatorDomains; idempotent via
// removeRuleIds so repeated boots don't stack rules.
chrome.declarativeNetRequest
  .updateDynamicRules({
    removeRuleIds: [1],
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            { header: "Origin", operation: "set", value: "https://x.com" },
            { header: "Referer", operation: "set", value: "https://x.com/" },
          ],
        },
        condition: {
          urlFilter: "https://x.com/i/api/graphql/*",
          resourceTypes: ["xmlhttprequest"],
          initiatorDomains: [chrome.runtime.id],
        },
      },
    ],
  })
  .catch((err) => console.error("DNR rule registration failed:", err));

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "sync") return;
  const send = makeSafeSender(port);
  port.onMessage.addListener(async (msg) => {
    if (msg.type !== "start") return;
    try {
      await runSync(send);
    } catch (err) {
      send({ type: "error", text: String(err?.message ?? err) });
    }
  });
});

// Closing the popup disconnects the port; any subsequent postMessage
// throws "Attempting to use a disconnected port object" and — because
// the caller is inside a generator — takes down the whole sync.
// Swallow that specific failure mode: progress updates are best-effort.
function makeSafeSender(port) {
  let connected = true;
  port.onDisconnect.addListener(() => {
    connected = false;
  });
  return (msg) => {
    if (!connected) return;
    try {
      port.postMessage(msg);
    } catch {
      connected = false;
    }
  };
}

async function runSync(send) {
  // Bookmarx assumes the server runs on localhost. If you start `next
  // dev` on a different port, change this constant.
  const serverUrl = "http://localhost:3000";

  const hasSession = await hasXSession();
  if (!hasSession) {
    throw new Error(
      "Couldn't find x.com auth cookies. Sign in to X in another tab.",
    );
  }

  send({ type: "progress", text: "Capturing X API config..." });
  let config = await getCapturedConfig();
  if (!config) {
    config = await captureNow();
  }

  let totalSeen = 0;
  let totalInserted = 0;
  let totalUpdated = 0;

  const BATCH_SIZE = 50;
  let batch = [];

  const onLog = (text) => send({ type: "progress", text });

  for await (const raw of fetchAllBookmarks(config, { onLog })) {
    const transformed = transformBookmark(raw);
    if (!transformed) continue;
    batch.push(transformed);
    if (batch.length >= BATCH_SIZE) {
      const r = await upload(serverUrl, batch, onLog);
      totalSeen += r.seen;
      totalInserted += r.inserted;
      totalUpdated += r.updated;
      send({
        type: "progress",
        text: `Synced ${totalSeen} so far (${totalInserted} new)...`,
      });
      batch = [];
    }
  }

  if (batch.length > 0) {
    const r = await upload(serverUrl, batch, onLog);
    totalSeen += r.seen;
    totalInserted += r.inserted;
    totalUpdated += r.updated;
  }

  send({
    type: "done",
    seen: totalSeen,
    inserted: totalInserted,
    updated: totalUpdated,
  });
}

async function upload(serverUrl, bookmarks, onLog) {
  const MAX_ATTEMPTS = 5;
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${serverUrl}/api/ingest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookmarks }),
      });
      if (res.status >= 400 && res.status < 500 && res.status !== 408) {
        // Auth failures and validation errors won't get better with retry.
        const text = await res.text().catch(() => "");
        throw new Error(`Ingest failed: ${res.status} ${text.slice(0, 200)}`);
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Ingest ${res.status}: ${text.slice(0, 200)}`);
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_ATTEMPTS) break;
      // Don't retry on hard client errors (thrown with "Ingest failed:" prefix).
      if (String(err?.message ?? "").startsWith("Ingest failed:")) throw err;
      const delay = 1000 * Math.pow(2, attempt - 1) + Math.random() * 500;
      onLog?.(
        `Upload failed (${attempt}/${MAX_ATTEMPTS}): ${err?.message ?? err}. Retrying in ${(delay / 1000).toFixed(1)}s...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error("Upload failed");
}

async function hasXSession() {
  const [auth, ct0] = await Promise.all([
    chrome.cookies.get({ url: "https://x.com", name: "auth_token" }),
    chrome.cookies.get({ url: "https://x.com", name: "ct0" }),
  ]);
  return Boolean(auth && ct0);
}

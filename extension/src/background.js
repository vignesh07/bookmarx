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
  port.onMessage.addListener(async (msg) => {
    if (msg.type !== "start") return;
    try {
      await runSync(port);
    } catch (err) {
      port.postMessage({ type: "error", text: String(err?.message ?? err) });
    }
  });
});

async function runSync(port) {
  const { serverUrl, token } = await chrome.storage.local.get([
    "serverUrl",
    "token",
  ]);
  if (!serverUrl || !token) {
    throw new Error("Configure server URL and token first.");
  }

  const hasSession = await hasXSession();
  if (!hasSession) {
    throw new Error(
      "Couldn't find x.com auth cookies. Sign in to X in another tab.",
    );
  }

  port.postMessage({ type: "progress", text: "Capturing X API config..." });
  let config = await getCapturedConfig();
  if (!config) {
    config = await captureNow();
  }

  let totalSeen = 0;
  let totalInserted = 0;
  let totalUpdated = 0;

  const BATCH_SIZE = 50;
  let batch = [];

  const onLog = (text) => port.postMessage({ type: "progress", text });

  for await (const raw of fetchAllBookmarks(config, { onLog })) {
    const transformed = transformBookmark(raw);
    if (!transformed) continue;
    batch.push(transformed);
    if (batch.length >= BATCH_SIZE) {
      const r = await upload(serverUrl, token, batch);
      totalSeen += r.seen;
      totalInserted += r.inserted;
      totalUpdated += r.updated;
      port.postMessage({
        type: "progress",
        text: `Synced ${totalSeen} so far (${totalInserted} new)...`,
      });
      batch = [];
    }
  }

  if (batch.length > 0) {
    const r = await upload(serverUrl, token, batch);
    totalSeen += r.seen;
    totalInserted += r.inserted;
    totalUpdated += r.updated;
  }

  port.postMessage({
    type: "done",
    seen: totalSeen,
    inserted: totalInserted,
    updated: totalUpdated,
  });
}

async function upload(serverUrl, token, bookmarks) {
  const res = await fetch(`${serverUrl}/api/ingest`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookmarks }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ingest failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function hasXSession() {
  const [auth, ct0] = await Promise.all([
    chrome.cookies.get({ url: "https://x.com", name: "auth_token" }),
    chrome.cookies.get({ url: "https://x.com", name: "ct0" }),
  ]);
  return Boolean(auth && ct0);
}

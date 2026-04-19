// Background service worker. Receives "start" from popup or fires on a
// chrome.alarms tick, scrapes X's internal Bookmarks GraphQL endpoint
// using the user's session cookies + a sniffed query ID, batches results,
// and POSTs them to the local Bookmarx server.

import { fetchAllBookmarks } from "./xapi.js";
import { transformBookmark } from "./transform.js";
import { installSniffer, captureNow, getCapturedConfig } from "./sniff.js";

// Bookmarx assumes the server runs on localhost. If you start `next dev`
// on a different port, change this constant.
const SERVER_URL = "http://localhost:3000";

// Items per ingest POST. Smaller batches mean faster shift updates on
// the server (each batch issues one UPDATE over rows >= offset).
const BATCH_SIZE = 50;

// Stop the crawl after we see this many already-known tweets in a row.
// 100 = one full GraphQL page of all-known means everything below is
// also known (X returns bookmarks in save order, newest first).
const EARLY_EXIT_THRESHOLD = 100;

// Periodic background sync interval. 6h is a reasonable default — long
// enough to be polite to X's API, short enough that new bookmarks show
// up the same day.
const ALARM_PERIOD_MINUTES = 360;
const ALARM_NAME = "scheduled-sync";

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

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: ALARM_PERIOD_MINUTES });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  try {
    await runSync(noopSend);
  } catch (err) {
    console.warn("Scheduled sync skipped:", err?.message ?? err);
  }
});

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

const noopSend = () => {};

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

// Manual + scheduled syncs share state — block one if the other is live
// so we don't double-shift save_index on the server.
let syncInProgress = false;

async function runSync(send) {
  if (syncInProgress) {
    send({ type: "error", text: "A sync is already in progress." });
    return;
  }
  syncInProgress = true;
  try {
    await runSyncInner(send);
  } finally {
    syncInProgress = false;
  }
}

async function runSyncInner(send) {
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

  send({ type: "progress", text: "Checking what's already synced..." });
  const knownIds = await fetchKnownIds();
  const isFirstSync = knownIds.size === 0;

  let totalSeen = 0;
  let totalInserted = 0;
  let totalUpdated = 0;

  let crawlPosition = 0;
  let consecutiveKnown = 0;
  let batch = [];
  let batchStartIndex = 0;
  let earlyExited = false;

  const onLog = (text) => send({ type: "progress", text });

  const flush = async () => {
    if (batch.length === 0) return;
    const r = await upload(batch, batchStartIndex, onLog);
    totalSeen += r.seen;
    totalInserted += r.inserted;
    totalUpdated += r.updated;
    send({
      type: "progress",
      text: `Synced ${totalSeen} so far (${totalInserted} new)...`,
    });
    batch = [];
  };

  for await (const raw of fetchAllBookmarks(config, { onLog })) {
    const transformed = transformBookmark(raw, crawlPosition);
    if (!transformed) continue;

    if (batch.length === 0) batchStartIndex = crawlPosition;
    batch.push(transformed);
    crawlPosition += 1;

    if (!isFirstSync) {
      if (knownIds.has(transformed.id)) {
        consecutiveKnown += 1;
      } else {
        consecutiveKnown = 0;
      }
    }

    if (batch.length >= BATCH_SIZE) {
      await flush();
    }

    if (!isFirstSync && consecutiveKnown >= EARLY_EXIT_THRESHOLD) {
      onLog(`Early exit: ${EARLY_EXIT_THRESHOLD} known bookmarks in a row.`);
      earlyExited = true;
      break;
    }
  }

  await flush();

  send({
    type: "done",
    seen: totalSeen,
    inserted: totalInserted,
    updated: totalUpdated,
    earlyExited,
  });
}

async function fetchKnownIds() {
  try {
    const res = await fetch(`${SERVER_URL}/api/known-ids`);
    if (!res.ok) return new Set();
    const data = await res.json();
    return new Set(data.ids ?? []);
  } catch {
    // Server unreachable — fall back to full crawl. Don't block sync on this.
    return new Set();
  }
}

async function upload(bookmarks, offset, onLog) {
  const MAX_ATTEMPTS = 5;
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${SERVER_URL}/api/ingest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookmarks, offset }),
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

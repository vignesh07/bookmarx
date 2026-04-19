// Passively sniffs the live Bookmarks GraphQL request whenever the
// user visits x.com/i/bookmarks, then caches the query ID and
// feature flags. This lets the extension self-update when X rotates
// these values — no manual DevTools dance.

const URL_PATTERN = /\/i\/api\/graphql\/([^/]+)\/Bookmarks(?:\b|\/|\?)/;

export function installSniffer() {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const m = details.url.match(URL_PATTERN);
      if (!m) return;
      try {
        const u = new URL(details.url);
        const features = u.searchParams.get("features");
        if (!features) return;
        chrome.storage.local.set({
          bookmarksQueryId: m[1],
          bookmarksFeatures: features,
          bookmarksCapturedAt: Date.now(),
        });
      } catch {
        // ignore malformed URLs
      }
    },
    { urls: ["https://x.com/i/api/graphql/*/Bookmarks*"] },
  );
}

export async function getCapturedConfig() {
  const { bookmarksQueryId, bookmarksFeatures } =
    await chrome.storage.local.get([
      "bookmarksQueryId",
      "bookmarksFeatures",
    ]);
  if (!bookmarksQueryId || !bookmarksFeatures) return null;
  return { queryId: bookmarksQueryId, features: bookmarksFeatures };
}

// Opens x.com/i/bookmarks in a background tab and waits until the
// sniffer captures the GraphQL config, then closes the tab. Used on
// first sync when nothing's been captured yet.
export async function captureNow({ timeoutMs = 15000 } = {}) {
  const existing = await getCapturedConfig();
  if (existing) return existing;

  const before = Date.now();
  const tab = await chrome.tabs.create({
    url: "https://x.com/i/bookmarks",
    active: false,
  });

  try {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 500));
      const { bookmarksCapturedAt } = await chrome.storage.local.get([
        "bookmarksCapturedAt",
      ]);
      if (bookmarksCapturedAt && bookmarksCapturedAt >= before) {
        return await getCapturedConfig();
      }
    }
    throw new Error(
      "Couldn't capture X's GraphQL config. Are you signed in to x.com?",
    );
  } finally {
    if (tab.id != null) {
      try {
        await chrome.tabs.remove(tab.id);
      } catch {
        // tab may already be closed
      }
    }
  }
}

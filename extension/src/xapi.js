// Wrapper around X's internal Bookmarks GraphQL endpoint. The query
// ID and feature flags are sniffed from the user's own browser by
// sniff.js — no need to hand-update them when X rotates values.

const BOOKMARKS_OP = "Bookmarks";

export async function* fetchAllBookmarks({ csrfToken }, config) {
  const { queryId, features } = config;
  let cursor = null;
  let pageCount = 0;
  const PAGE_SIZE = 100;
  const MAX_EMPTY_PAGES = 2;
  let emptyStreak = 0;

  while (true) {
    const variables = {
      count: PAGE_SIZE,
      includePromotedContent: false,
      ...(cursor ? { cursor } : {}),
    };

    const url = new URL(
      `https://x.com/i/api/graphql/${queryId}/${BOOKMARKS_OP}`,
    );
    url.searchParams.set("variables", JSON.stringify(variables));
    url.searchParams.set("features", features);

    const res = await fetch(url.toString(), {
      method: "GET",
      credentials: "include",
      headers: {
        authorization:
          "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
        "content-type": "application/json",
        "x-csrf-token": csrfToken,
        "x-twitter-active-user": "yes",
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-client-language": "en",
      },
    });

    if (!res.ok) {
      throw new Error(
        `X API ${res.status}: ${(await res.text()).slice(0, 200)}`,
      );
    }

    const json = await res.json();
    const { entries, nextCursor } = extractEntries(json);

    if (entries.length === 0) {
      emptyStreak += 1;
      if (emptyStreak >= MAX_EMPTY_PAGES || !nextCursor) return;
    } else {
      emptyStreak = 0;
    }

    for (const e of entries) yield e;

    if (!nextCursor) return;
    cursor = nextCursor;
    pageCount += 1;

    // Be polite — small delay between pages to avoid rate limits.
    await new Promise((r) => setTimeout(r, 600));
    if (pageCount > 200) {
      throw new Error("Aborting: 200 pages reached without end.");
    }
  }
}

function extractEntries(json) {
  const instructions =
    json?.data?.bookmark_timeline_v2?.timeline?.instructions ??
    json?.data?.bookmark_timeline?.timeline?.instructions ??
    [];
  const tweets = [];
  let nextCursor = null;
  for (const inst of instructions) {
    if (inst.type === "TimelineAddEntries") {
      for (const entry of inst.entries ?? []) {
        const content = entry.content;
        if (content?.entryType === "TimelineTimelineItem") {
          const result =
            content.itemContent?.tweet_results?.result ??
            content.itemContent?.tweet_results;
          if (result) tweets.push(result);
        } else if (content?.entryType === "TimelineTimelineCursor") {
          if (content.cursorType === "Bottom") nextCursor = content.value;
        }
      }
    }
  }
  return { entries: tweets, nextCursor };
}

// Wrapper around X's internal Bookmarks GraphQL endpoint. The
// endpoint ID and feature flags rotate occasionally — when a sync
// starts returning empty results, refresh these by opening
// x.com/i/bookmarks, watching the network tab, and copying the
// latest values from the Bookmarks request.

const BOOKMARKS_QUERY_ID = "qFE_qSO_TX0vDCSmgLWb1g";
const BOOKMARKS_OP = "Bookmarks";

const FEATURES = {
  graphql_timeline_v2_bookmark_timeline: true,
  rweb_lists_timeline_redesign_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  tweetypie_unmention_optimization_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_enhance_cards_enabled: false,
};

export async function* fetchAllBookmarks({ csrfToken }) {
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
      `https://x.com/i/api/graphql/${BOOKMARKS_QUERY_ID}/${BOOKMARKS_OP}`,
    );
    url.searchParams.set("variables", JSON.stringify(variables));
    url.searchParams.set("features", JSON.stringify(FEATURES));

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
    json?.data?.bookmark_timeline_v2?.timeline?.instructions ?? [];
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

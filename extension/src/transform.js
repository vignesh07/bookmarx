// Translates X's GraphQL tweet shape into the Bookmarx ingest shape.
// X's payload is deeply nested and inconsistently shaped (note tweets,
// retweets, "TweetWithVisibilityResults" wrappers, etc) — unwrap once
// here so the rest of the codebase only sees the flat shape.

export function transformBookmark(raw, saveIndex) {
  const tweet = unwrap(raw);
  if (!tweet) return null;

  const legacy = tweet.legacy ?? {};
  const userResult = tweet.core?.user_results?.result;
  const userLegacy = userResult?.legacy ?? {};
  // X moved screen_name/name out of `legacy` into `core` in 2024 — read
  // from there first and fall back to legacy for older payloads.
  const userCore = userResult?.core ?? {};
  const screenName = userCore.screen_name ?? userLegacy.screen_name ?? null;
  const displayName = userCore.name ?? userLegacy.name ?? screenName;
  const avatarUrl =
    userResult?.avatar?.image_url ?? userLegacy.profile_image_url_https ?? null;
  const userId = userResult?.rest_id ?? legacy.user_id_str;
  if (!userId) return null;

  const tweetId = tweet.rest_id ?? legacy.id_str;
  if (!tweetId) return null;

  const noteText = tweet.note_tweet?.note_tweet_results?.result?.text;
  const text = noteText ?? legacy.full_text ?? legacy.text ?? "";

  const entities = legacy.entities ?? {};
  const mediaList = (legacy.extended_entities?.media ?? []).map((m, i) => ({
    id: m.id_str ?? `${tweetId}-m${i}`,
    kind: kindFor(m.type),
    url: m.media_url_https ?? m.media_url,
    previewUrl: m.media_url_https ?? null,
    width: m.original_info?.width ?? null,
    height: m.original_info?.height ?? null,
    altText: m.ext_alt_text ?? null,
    position: i,
    videoUrl: pickBestVideoVariant(m.video_info?.variants),
    durationMs: m.video_info?.duration_millis ?? null,
  }));

  const links = (entities.urls ?? []).map((u) => ({
    url: u.url,
    expandedUrl: u.expanded_url,
    title: null,
    description: null,
    siteName: u.display_url?.split("/")[0] ?? null,
    imageUrl: null,
  }));

  const card = tweet.card?.legacy?.binding_values;
  if (card && links.length > 0) {
    const get = (k) =>
      card.find((b) => b.key === k)?.value?.string_value ?? null;
    const title = get("title");
    const description = get("description");
    const imageUrl =
      card.find((b) => b.key === "thumbnail_image_large")?.value?.image_value
        ?.url ?? get("thumbnail_image_original");
    if (title) links[0].title = title;
    if (description) links[0].description = description;
    if (imageUrl) links[0].imageUrl = imageUrl;
  }

  return {
    id: tweetId,
    author: {
      id: userId,
      handle: screenName ?? "unknown",
      displayName: displayName ?? "Unknown",
      avatarUrl,
      verified: Boolean(userLegacy.verified || userResult?.is_blue_verified),
    },
    text,
    lang: legacy.lang ?? null,
    postedAt: legacy.created_at
      ? new Date(legacy.created_at).toISOString()
      : new Date().toISOString(),
    bookmarkedAt: new Date().toISOString(),
    sourceUrl: `https://x.com/${screenName ?? "i/web"}/status/${tweetId}`,
    threadRootId: legacy.conversation_id_str ?? null,
    threadPosition:
      legacy.conversation_id_str === tweetId ? 0 : null,
    replyCount: legacy.reply_count ?? 0,
    repostCount: legacy.retweet_count ?? 0,
    likeCount: legacy.favorite_count ?? 0,
    saveIndex,
    media: mediaList,
    links,
    raw,
  };
}

function unwrap(result) {
  if (!result) return null;
  if (result.__typename === "TweetWithVisibilityResults") {
    return result.tweet ?? null;
  }
  if (result.__typename === "TweetTombstone") return null;
  return result;
}

function kindFor(t) {
  if (t === "video") return "video";
  if (t === "animated_gif") return "animated_gif";
  return "photo";
}

// X returns multiple MP4 variants at different bitrates plus an HLS
// stream (.m3u8). We prefer the highest-bitrate MP4 for direct <video>
// playback — browsers play MP4 natively without hls.js.
function pickBestVideoVariant(variants) {
  if (!variants?.length) return null;
  const mp4s = variants.filter((v) => v.content_type === "video/mp4");
  if (mp4s.length === 0) return null;
  return mp4s.reduce((a, b) => ((a.bitrate ?? 0) > (b.bitrate ?? 0) ? a : b))
    .url;
}

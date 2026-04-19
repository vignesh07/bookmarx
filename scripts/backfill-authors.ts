import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { bookmarks, authors } from "@/db/schema";

config();

type AnyRecord = Record<string, unknown>;

function unwrapTweet(raw: unknown): AnyRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as AnyRecord;
  if (r.__typename === "TweetWithVisibilityResults") {
    return (r.tweet as AnyRecord) ?? null;
  }
  return r;
}

function extractAuthor(raw: unknown) {
  const tweet = unwrapTweet(raw);
  if (!tweet) return null;
  const userResult = (tweet.core as AnyRecord | undefined)?.user_results as
    | { result?: AnyRecord }
    | undefined;
  const result = userResult?.result;
  if (!result) return null;
  const id = result.rest_id as string | undefined;
  const userCore = result.core as AnyRecord | undefined;
  const userLegacy = result.legacy as AnyRecord | undefined;
  const screenName =
    (userCore?.screen_name as string | undefined) ??
    (userLegacy?.screen_name as string | undefined) ??
    null;
  const displayName =
    (userCore?.name as string | undefined) ??
    (userLegacy?.name as string | undefined) ??
    screenName;
  const avatar =
    ((result.avatar as AnyRecord | undefined)?.image_url as string | undefined) ??
    (userLegacy?.profile_image_url_https as string | undefined) ??
    null;
  if (!id || !screenName) return null;
  return {
    id,
    handle: screenName,
    displayName: displayName ?? screenName,
    avatarUrl: avatar,
  };
}

async function main() {
  const rows = await db.select({ raw: bookmarks.raw }).from(bookmarks);
  console.log(`Scanning ${rows.length} bookmarks for author info...`);

  const byId = new Map<
    string,
    { handle: string; displayName: string; avatarUrl: string | null }
  >();
  for (const row of rows) {
    const a = extractAuthor(row.raw);
    if (!a) continue;
    byId.set(a.id, {
      handle: a.handle,
      displayName: a.displayName,
      avatarUrl: a.avatarUrl,
    });
  }
  console.log(`Found ${byId.size} unique authors with usable handle/name.`);

  let updated = 0;
  for (const [id, a] of byId) {
    const res = await db
      .update(authors)
      .set({
        handle: a.handle,
        displayName: a.displayName,
        avatarUrl: a.avatarUrl,
      })
      .where(sql`${authors.id} = ${id}`);
    // drizzle-postgres returns rowCount via .rowCount on Result; simpler: count attempts
    if (res) updated += 1;
  }
  console.log(`Updated ${updated} author rows.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

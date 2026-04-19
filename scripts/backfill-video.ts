import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { bookmarks, media } from "@/db/schema";

config();

type VideoVariant = {
  url: string;
  content_type?: string;
  bitrate?: number;
};

type RawMedia = {
  type?: string;
  video_info?: {
    variants?: VideoVariant[];
    duration_millis?: number;
  };
};

function pickBestMp4(variants: VideoVariant[] | undefined) {
  if (!variants?.length) return null;
  const mp4s = variants.filter((v) => v.content_type === "video/mp4");
  if (mp4s.length === 0) return null;
  return mp4s.reduce((a, b) => ((a.bitrate ?? 0) > (b.bitrate ?? 0) ? a : b))
    .url;
}

function unwrapRaw(raw: unknown): {
  extendedMedia: RawMedia[];
} | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const tweet =
    (r as { __typename?: string }).__typename === "TweetWithVisibilityResults"
      ? ((r as { tweet?: unknown }).tweet as Record<string, unknown>)
      : r;
  if (!tweet) return null;
  const legacy = (tweet as { legacy?: Record<string, unknown> }).legacy;
  const extendedEntities =
    (legacy as { extended_entities?: Record<string, unknown> } | undefined)
      ?.extended_entities;
  const mediaArr = (
    extendedEntities as { media?: unknown[] } | undefined
  )?.media;
  if (!Array.isArray(mediaArr)) return null;
  return { extendedMedia: mediaArr as RawMedia[] };
}

async function main() {
  const rows = await db
    .select({ id: bookmarks.id, raw: bookmarks.raw })
    .from(bookmarks);

  console.log(`Scanning ${rows.length} bookmarks for video variants...`);

  let updated = 0;
  let scanned = 0;

  for (const row of rows) {
    scanned += 1;
    const parsed = unwrapRaw(row.raw);
    if (!parsed) continue;

    for (let i = 0; i < parsed.extendedMedia.length; i++) {
      const m = parsed.extendedMedia[i];
      const videoUrl = pickBestMp4(m.video_info?.variants);
      const durationMs = m.video_info?.duration_millis ?? null;
      if (!videoUrl && durationMs === null) continue;

      await db
        .update(media)
        .set({ videoUrl, durationMs })
        .where(sql`${media.id} = ${`${row.id}:m${i}`}`);
      updated += 1;
    }

    if (scanned % 500 === 0) {
      console.log(`  scanned ${scanned}/${rows.length}, updated ${updated}`);
    }
  }

  console.log(`Done. Scanned ${scanned} bookmarks, updated ${updated} media rows.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

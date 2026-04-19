import { z } from "zod";
import { and, gte, notInArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { authors, bookmarks, links, media } from "@/db/schema";

export const IngestAuthor = z.object({
  id: z.string(),
  handle: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().url().optional().nullable(),
  verified: z.boolean().optional().default(false),
});

export const IngestMedia = z.object({
  id: z.string(),
  kind: z.enum(["photo", "video", "animated_gif"]),
  url: z.string().url(),
  previewUrl: z.string().url().optional().nullable(),
  width: z.number().int().optional().nullable(),
  height: z.number().int().optional().nullable(),
  altText: z.string().optional().nullable(),
  position: z.number().int().default(0),
  videoUrl: z.string().url().optional().nullable(),
  durationMs: z.number().int().optional().nullable(),
});

export const IngestLink = z.object({
  url: z.string().url(),
  expandedUrl: z.string().url().optional().nullable(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  siteName: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export const IngestBookmark = z.object({
  id: z.string(),
  author: IngestAuthor,
  text: z.string(),
  lang: z.string().optional().nullable(),
  postedAt: z.string().datetime(),
  bookmarkedAt: z.string().datetime(),
  sourceUrl: z.string().url(),
  threadRootId: z.string().optional().nullable(),
  threadPosition: z.number().int().optional().nullable(),
  replyCount: z.number().int().default(0),
  repostCount: z.number().int().default(0),
  likeCount: z.number().int().default(0),
  // Crawl-position rank assigned by the extension. 0 = top of the user's
  // X bookmark list. The server uses this to maintain global save order.
  saveIndex: z.number().int().nonnegative(),
  media: z.array(IngestMedia).default([]),
  links: z.array(IngestLink).default([]),
  raw: z.unknown(),
});

export const IngestPayload = z.object({
  bookmarks: z.array(IngestBookmark),
  // Lowest saveIndex in this batch — the global crawl position of the
  // first item. Items at save_index >= offset that aren't in this batch
  // get shifted by batch.length to make room for the new positions.
  offset: z.number().int().nonnegative(),
});

export type IngestBookmarkInput = z.infer<typeof IngestBookmark>;

export async function ingestBookmarks(
  items: IngestBookmarkInput[],
  offset: number,
) {
  if (items.length === 0) {
    return { seen: 0, inserted: 0, updated: 0 };
  }

  const uniqueAuthors = new Map<string, IngestBookmarkInput["author"]>();
  for (const b of items) uniqueAuthors.set(b.author.id, b.author);

  await db
    .insert(authors)
    .values(
      [...uniqueAuthors.values()].map((a) => ({
        id: a.id,
        handle: a.handle,
        displayName: a.displayName,
        avatarUrl: a.avatarUrl ?? null,
        verified: a.verified,
      })),
    )
    .onConflictDoUpdate({
      target: authors.id,
      set: {
        handle: sql`excluded.handle`,
        displayName: sql`excluded.display_name`,
        avatarUrl: sql`excluded.avatar_url`,
        verified: sql`excluded.verified`,
      },
    });

  // Make room for this batch's saveIndex range. Existing rows whose
  // current save_index falls in or after `offset` get pushed down by
  // `K = items.length`, except rows that are themselves in this batch
  // (we'll set those explicitly via the upsert below).
  const K = items.length;
  const payloadIds = items.map((b) => b.id);
  await db
    .update(bookmarks)
    .set({ saveIndex: sql`${bookmarks.saveIndex} + ${K}` })
    .where(
      and(
        gte(bookmarks.saveIndex, offset),
        notInArray(bookmarks.id, payloadIds),
      ),
    );

  let inserted = 0;
  let updated = 0;

  for (const b of items) {
    const result = await db
      .insert(bookmarks)
      .values({
        id: b.id,
        authorId: b.author.id,
        text: b.text,
        lang: b.lang ?? null,
        postedAt: new Date(b.postedAt),
        bookmarkedAt: new Date(b.bookmarkedAt),
        sourceUrl: b.sourceUrl,
        threadRootId: b.threadRootId ?? null,
        threadPosition: b.threadPosition ?? null,
        replyCount: b.replyCount,
        repostCount: b.repostCount,
        likeCount: b.likeCount,
        saveIndex: b.saveIndex,
        raw: b.raw,
      })
      .onConflictDoUpdate({
        target: bookmarks.id,
        set: {
          text: sql`excluded.text`,
          replyCount: sql`excluded.reply_count`,
          repostCount: sql`excluded.repost_count`,
          likeCount: sql`excluded.like_count`,
          saveIndex: sql`excluded.save_index`,
          raw: sql`excluded.raw`,
        },
      })
      .returning({
        id: bookmarks.id,
        wasInsert: sql<boolean>`(xmax = 0)`,
      });

    if (result[0]?.wasInsert) inserted += 1;
    else updated += 1;

    await db.delete(media).where(sql`${media.bookmarkId} = ${b.id}`);
    if (b.media.length > 0) {
      // Bookmark-scope the PK: X's media id_str is shared across tweets
      // (quote-retweet of a tweet with the same photo attached), so using
      // it directly causes primary-key collisions between bookmarks.
      await db.insert(media).values(
        b.media.map((m, i) => ({
          id: `${b.id}:m${i}`,
          bookmarkId: b.id,
          kind: m.kind,
          url: m.url,
          previewUrl: m.previewUrl ?? null,
          width: m.width ?? null,
          height: m.height ?? null,
          altText: m.altText ?? null,
          position: m.position,
          videoUrl: m.videoUrl ?? null,
          durationMs: m.durationMs ?? null,
        })),
      );
    }

    await db.delete(links).where(sql`${links.bookmarkId} = ${b.id}`);
    if (b.links.length > 0) {
      await db.insert(links).values(
        b.links.map((l, i) => ({
          id: `${b.id}:${i}`,
          bookmarkId: b.id,
          url: l.url,
          expandedUrl: l.expandedUrl ?? null,
          title: l.title ?? null,
          description: l.description ?? null,
          siteName: l.siteName ?? null,
          imageUrl: l.imageUrl ?? null,
        })),
      );
    }
  }

  return { seen: items.length, inserted, updated };
}

import { db } from "@/db/client";
import {
  bookmarks,
  authors,
  collections,
  bookmarkCollections,
  media,
  links,
  syncRuns,
} from "@/db/schema";
import { asc, desc, eq, sql, and, isNull, inArray } from "drizzle-orm";

export type LibrarySort = "newest" | "oldest" | "top";

export type LibraryFilter = {
  collectionId?: string;
  unreadOnly?: boolean;
  favoritesOnly?: boolean;
  type?: "thread" | "media" | "links" | "long";
  sort?: LibrarySort;
};

export const PAGE_SIZE = 50;

export async function getLibraryRows(
  filter: LibraryFilter = {},
  { limit = PAGE_SIZE, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  const where = [isNull(bookmarks.deletedAt)];
  if (filter.unreadOnly) where.push(eq(bookmarks.isRead, false));
  if (filter.favoritesOnly) where.push(eq(bookmarks.isFavorite, true));

  if (filter.collectionId) {
    const rows = await db
      .select({ id: bookmarkCollections.bookmarkId })
      .from(bookmarkCollections)
      .where(eq(bookmarkCollections.collectionId, filter.collectionId));
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return { rows: [], total: 0 };
    where.push(inArray(bookmarks.id, ids));
  }

  if (filter.type === "thread") {
    where.push(sql`${bookmarks.threadRootId} is not null`);
  } else if (filter.type === "media") {
    where.push(
      sql`exists (select 1 from ${media} where ${media.bookmarkId} = ${bookmarks.id})`,
    );
  } else if (filter.type === "links") {
    where.push(
      sql`exists (select 1 from ${links} where ${links.bookmarkId} = ${bookmarks.id})`,
    );
  } else if (filter.type === "long") {
    where.push(
      sql`(
        ${bookmarks.threadRootId} is not null
        or exists (
          select 1 from ${links}
          where ${links.bookmarkId} = ${bookmarks.id}
            and ${links.articleWordCount} > 500
        )
      )`,
    );
  }

  const [totalRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookmarks)
    .where(and(...where));

  // save_index is the X-bookmark-save-order rank (0 = newest saved). It
  // replaces bookmarked_at for ordering since X doesn't expose a real
  // saved-at timestamp; bookmarked_at on rows from v0.1 was just the
  // sync wall-clock time, so it didn't sort meaningfully within a batch.
  const orderBy =
    filter.sort === "oldest"
      ? desc(bookmarks.saveIndex)
      : filter.sort === "top"
        ? desc(bookmarks.likeCount)
        : asc(bookmarks.saveIndex);

  const rows = await db
    .select({
      bookmark: bookmarks,
      author: authors,
    })
    .from(bookmarks)
    .innerJoin(authors, eq(bookmarks.authorId, authors.id))
    .where(and(...where))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  if (rows.length === 0) return { rows: [], total: totalRow?.n ?? 0 };

  const ids = rows.map((r) => r.bookmark.id);
  const [mediaRows, linkRows, collectionRows] = await Promise.all([
    db.select().from(media).where(inArray(media.bookmarkId, ids)),
    db.select().from(links).where(inArray(links.bookmarkId, ids)),
    db
      .select({
        bookmarkId: bookmarkCollections.bookmarkId,
        collection: collections,
      })
      .from(bookmarkCollections)
      .innerJoin(
        collections,
        eq(collections.id, bookmarkCollections.collectionId),
      )
      .where(inArray(bookmarkCollections.bookmarkId, ids)),
  ]);

  return {
    rows: rows.map((r) => ({
      ...r.bookmark,
      author: r.author,
      media: mediaRows
        .filter((m) => m.bookmarkId === r.bookmark.id)
        .sort((a, b) => a.position - b.position),
      links: linkRows.filter((l) => l.bookmarkId === r.bookmark.id),
      collections: collectionRows
        .filter((c) => c.bookmarkId === r.bookmark.id)
        .map((c) => c.collection),
    })),
    total: totalRow?.n ?? 0,
  };
}

export type LibraryRow = Awaited<
  ReturnType<typeof getLibraryRows>
>["rows"][number];

export async function getCollections() {
  return db
    .select({
      id: collections.id,
      name: collections.name,
      color: collections.color,
      position: collections.position,
      count: sql<number>`count(${bookmarkCollections.bookmarkId})::int`,
    })
    .from(collections)
    .leftJoin(
      bookmarkCollections,
      eq(bookmarkCollections.collectionId, collections.id),
    )
    .groupBy(collections.id)
    .orderBy(collections.position);
}

export async function getLibraryStats() {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      unread: sql<number>`sum(case when ${bookmarks.isRead} = false then 1 else 0 end)::int`,
    })
    .from(bookmarks)
    .where(isNull(bookmarks.deletedAt));

  const [lastSync] = await db
    .select()
    .from(syncRuns)
    .orderBy(desc(syncRuns.finishedAt))
    .limit(1);

  return {
    total: stats?.total ?? 0,
    unread: stats?.unread ?? 0,
    lastSyncAt: lastSync?.finishedAt ?? null,
  };
}

export async function getBookmarkById(id: string) {
  const [row] = await db
    .select({ bookmark: bookmarks, author: authors })
    .from(bookmarks)
    .innerJoin(authors, eq(bookmarks.authorId, authors.id))
    .where(and(eq(bookmarks.id, id), isNull(bookmarks.deletedAt)))
    .limit(1);

  if (!row) return null;

  const [mediaRows, linkRows, collectionRows, threadRows] = await Promise.all([
    db.select().from(media).where(eq(media.bookmarkId, id)),
    db.select().from(links).where(eq(links.bookmarkId, id)),
    db
      .select({ collection: collections })
      .from(bookmarkCollections)
      .innerJoin(
        collections,
        eq(collections.id, bookmarkCollections.collectionId),
      )
      .where(eq(bookmarkCollections.bookmarkId, id)),
    row.bookmark.threadRootId
      ? db
          .select({ bookmark: bookmarks, author: authors })
          .from(bookmarks)
          .innerJoin(authors, eq(bookmarks.authorId, authors.id))
          .where(eq(bookmarks.threadRootId, row.bookmark.threadRootId))
          .orderBy(bookmarks.threadPosition)
      : Promise.resolve([]),
  ]);

  return {
    ...row.bookmark,
    author: row.author,
    media: mediaRows.sort((a, b) => a.position - b.position),
    links: linkRows,
    collections: collectionRows.map((c) => c.collection),
    thread: threadRows.map((t) => ({ ...t.bookmark, author: t.author })),
  };
}

export type BookmarkDetail = NonNullable<
  Awaited<ReturnType<typeof getBookmarkById>>
>;

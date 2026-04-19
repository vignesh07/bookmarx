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
import { desc, eq, sql, and, isNull, inArray } from "drizzle-orm";

export type LibraryFilter = {
  collectionId?: string;
  unreadOnly?: boolean;
  favoritesOnly?: boolean;
  type?: "thread" | "media" | "links" | "long";
};

export async function getLibraryRows(filter: LibraryFilter = {}, limit = 50) {
  const where = [isNull(bookmarks.deletedAt)];
  if (filter.unreadOnly) where.push(eq(bookmarks.isRead, false));
  if (filter.favoritesOnly) where.push(eq(bookmarks.isFavorite, true));

  let bookmarkIds: string[] | undefined;
  if (filter.collectionId) {
    const rows = await db
      .select({ id: bookmarkCollections.bookmarkId })
      .from(bookmarkCollections)
      .where(eq(bookmarkCollections.collectionId, filter.collectionId));
    bookmarkIds = rows.map((r) => r.id);
    if (bookmarkIds.length === 0) return [];
    where.push(inArray(bookmarks.id, bookmarkIds));
  }

  const rows = await db
    .select({
      bookmark: bookmarks,
      author: authors,
    })
    .from(bookmarks)
    .innerJoin(authors, eq(bookmarks.authorId, authors.id))
    .where(and(...where))
    .orderBy(desc(bookmarks.bookmarkedAt))
    .limit(limit);

  if (rows.length === 0) return [];

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

  return rows.map((r) => ({
    ...r.bookmark,
    author: r.author,
    media: mediaRows
      .filter((m) => m.bookmarkId === r.bookmark.id)
      .sort((a, b) => a.position - b.position),
    links: linkRows.filter((l) => l.bookmarkId === r.bookmark.id),
    collections: collectionRows
      .filter((c) => c.bookmarkId === r.bookmark.id)
      .map((c) => c.collection),
  }));
}

export type LibraryRow = Awaited<ReturnType<typeof getLibraryRows>>[number];

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

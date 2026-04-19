import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

export const authors = pgTable("authors", {
  id: text("id").primaryKey(),
  handle: text("handle").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  verified: boolean("verified").default(false).notNull(),
});

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    lang: text("lang"),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull(),
    bookmarkedAt: timestamp("bookmarked_at", { withTimezone: true }).notNull(),
    sourceUrl: text("source_url").notNull(),
    threadRootId: text("thread_root_id"),
    threadPosition: integer("thread_position"),
    replyCount: integer("reply_count").default(0).notNull(),
    repostCount: integer("repost_count").default(0).notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    raw: jsonb("raw").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    isFavorite: boolean("is_favorite").default(false).notNull(),
    note: text("note"),
    // Crawl-position rank from the most recent sync. 0 = top of the user's
    // X bookmark list (newest saved). The library orders by this ascending.
    // Indices may have gaps after incremental syncs — that's fine, only
    // relative order matters.
    saveIndex: integer("save_index").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("bookmarks_save_index_idx").on(t.saveIndex),
    index("bookmarks_bookmarked_at_idx").on(t.bookmarkedAt.desc()),
    index("bookmarks_author_idx").on(t.authorId),
    index("bookmarks_thread_idx").on(t.threadRootId),
  ],
);

export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey(),
    bookmarkId: text("bookmark_id")
      .notNull()
      .references(() => bookmarks.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    url: text("url").notNull(),
    previewUrl: text("preview_url"),
    width: integer("width"),
    height: integer("height"),
    altText: text("alt_text"),
    position: integer("position").default(0).notNull(),
    videoUrl: text("video_url"),
    durationMs: integer("duration_ms"),
  },
  (t) => [index("media_bookmark_idx").on(t.bookmarkId)],
);

export const links = pgTable(
  "links",
  {
    id: text("id").primaryKey(),
    bookmarkId: text("bookmark_id")
      .notNull()
      .references(() => bookmarks.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    expandedUrl: text("expanded_url"),
    title: text("title"),
    description: text("description"),
    siteName: text("site_name"),
    imageUrl: text("image_url"),
    articleHtml: text("article_html"),
    articleText: text("article_text"),
    articleByline: text("article_byline"),
    articleExcerpt: text("article_excerpt"),
    articleLeadImage: text("article_lead_image"),
    articleWordCount: integer("article_word_count"),
    articleFetchedAt: timestamp("article_fetched_at", { withTimezone: true }),
    articleError: text("article_error"),
  },
  (t) => [index("links_bookmark_idx").on(t.bookmarkId)],
);

export const collections = pgTable("collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const bookmarkCollections = pgTable(
  "bookmark_collections",
  {
    bookmarkId: text("bookmark_id")
      .notNull()
      .references(() => bookmarks.id, { onDelete: "cascade" }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.bookmarkId, t.collectionId] }),
    index("bc_collection_idx").on(t.collectionId),
  ],
);

export const syncRuns = pgTable("sync_runs", {
  id: text("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  bookmarksSeen: integer("bookmarks_seen").default(0).notNull(),
  bookmarksNew: integer("bookmarks_new").default(0).notNull(),
  bookmarksUpdated: integer("bookmarks_updated").default(0).notNull(),
  source: text("source").notNull(),
  error: text("error"),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type Author = typeof authors.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Link = typeof links.$inferSelect;
export type Collection = typeof collections.$inferSelect;

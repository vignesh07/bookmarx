CREATE TABLE "authors" (
	"id" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmark_collections" (
	"bookmark_id" text NOT NULL,
	"collection_id" text NOT NULL,
	CONSTRAINT "bookmark_collections_bookmark_id_collection_id_pk" PRIMARY KEY("bookmark_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"text" text NOT NULL,
	"lang" text,
	"posted_at" timestamp with time zone NOT NULL,
	"bookmarked_at" timestamp with time zone NOT NULL,
	"source_url" text NOT NULL,
	"thread_root_id" text,
	"thread_position" integer,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"repost_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"raw" jsonb NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" text PRIMARY KEY NOT NULL,
	"bookmark_id" text NOT NULL,
	"url" text NOT NULL,
	"expanded_url" text,
	"title" text,
	"description" text,
	"site_name" text,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"bookmark_id" text NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"preview_url" text,
	"width" integer,
	"height" integer,
	"alt_text" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"bookmarks_seen" integer DEFAULT 0 NOT NULL,
	"bookmarks_new" integer DEFAULT 0 NOT NULL,
	"bookmarks_updated" integer DEFAULT 0 NOT NULL,
	"source" text NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "bookmark_collections" ADD CONSTRAINT "bookmark_collections_bookmark_id_bookmarks_id_fk" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_collections" ADD CONSTRAINT "bookmark_collections_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_bookmark_id_bookmarks_id_fk" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_bookmark_id_bookmarks_id_fk" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bc_collection_idx" ON "bookmark_collections" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "bookmarks_bookmarked_at_idx" ON "bookmarks" USING btree ("bookmarked_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "bookmarks_author_idx" ON "bookmarks" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "bookmarks_thread_idx" ON "bookmarks" USING btree ("thread_root_id");--> statement-breakpoint
CREATE INDEX "links_bookmark_idx" ON "links" USING btree ("bookmark_id");--> statement-breakpoint
CREATE INDEX "media_bookmark_idx" ON "media" USING btree ("bookmark_id");
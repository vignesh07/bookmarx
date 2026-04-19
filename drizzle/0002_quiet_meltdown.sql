ALTER TABLE "bookmarks" ADD COLUMN "save_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Backfill from current visual order so upgrading users don't see their
-- library reshuffle. Tie-break by id (Snowflake → newer-posted first)
-- since most existing rows share a near-identical bookmarked_at from the
-- v0.1 sync-time-as-bookmarked-time approximation.
UPDATE "bookmarks" SET "save_index" = sub.rn - 1
FROM (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "bookmarked_at" DESC, "id" DESC) AS rn
  FROM "bookmarks"
) sub
WHERE "bookmarks"."id" = sub."id";--> statement-breakpoint
CREATE INDEX "bookmarks_save_index_idx" ON "bookmarks" USING btree ("save_index");
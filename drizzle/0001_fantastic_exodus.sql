ALTER TABLE "links" ADD COLUMN "article_html" text;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "article_text" text;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "article_byline" text;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "article_excerpt" text;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "article_lead_image" text;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "article_word_count" integer;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "article_fetched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "article_error" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "duration_ms" integer;
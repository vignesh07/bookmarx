import Link from "next/link";
import {
  MessageCircle,
  Clock,
  Link2,
  Image as ImageIcon,
  Star,
  Check,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { relativeTime, readingTimeMinutes, cleanTweetText } from "@/lib/format";
import type { LibraryRow } from "@/lib/queries";

export function BookmarkCard({
  row,
  layout = "list",
}: {
  row: LibraryRow;
  layout?: "list" | "grid";
}) {
  const bodyText = cleanTweetText(row.text);
  const minutes = readingTimeMinutes(bodyText || row.text);
  const primaryLink = row.links[0];
  const primaryMedia = row.media[0];
  const collection = row.collections[0];

  if (layout === "grid") {
    return (
      <article className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-4">
        <header className="flex items-center gap-2">
          <Avatar handle={row.author.handle} />
          <a
            href={`https://x.com/${row.author.handle}`}
            target="_blank"
            rel="noreferrer noopener"
            className="truncate text-[12.5px] font-semibold text-ink hover:underline"
          >
            {row.author.displayName}
          </a>
          <time className="ml-auto shrink-0 text-[11.5px] text-subtle">
            {relativeTime(row.bookmarkedAt)}
          </time>
        </header>
        {bodyText && (
          <Link href={`/b/${row.id}`} className="group">
            <p className="line-clamp-4 font-serif text-[15.5px] leading-[1.4] text-ink group-hover:text-ink/85">
              {bodyText}
            </p>
          </Link>
        )}
        {primaryLink && (
          <LinkPreview
            linkId={primaryLink.id}
            url={primaryLink.expandedUrl ?? primaryLink.url}
            title={primaryLink.title}
            description={primaryLink.description}
            siteName={primaryLink.siteName}
            imageUrl={primaryLink.imageUrl}
            hasArticle={Boolean(primaryLink.articleHtml)}
            compact
          />
        )}
        {primaryMedia && !primaryLink && (primaryMedia.previewUrl ?? primaryMedia.url) && (
          <Link
            href={`/b/${row.id}`}
            className="overflow-hidden rounded-md bg-gradient-to-br from-[#2A2520] to-[#4A3F35]"
            style={{ aspectRatio: "16 / 9" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={primaryMedia.previewUrl ?? primaryMedia.url ?? undefined}
              alt={primaryMedia.altText ?? ""}
              className="size-full object-cover"
            />
          </Link>
        )}
        <footer className="mt-auto flex items-center gap-3 pt-1 text-[11.5px] text-subtle">
          <Meta icon={<Clock className="size-3" strokeWidth={1.8} />}>
            {minutes} min
          </Meta>
          {row.links.length > 0 && (
            <Meta icon={<Link2 className="size-3" strokeWidth={1.8} />}>
              {row.links.length}
            </Meta>
          )}
          {row.media.length > 0 && (
            <Meta icon={<ImageIcon className="size-3" strokeWidth={1.8} />}>
              {row.media.length}
            </Meta>
          )}
          {collection && (
            <span
              className="ml-auto truncate rounded px-2 py-[2px] text-[10.5px] font-medium"
              style={{
                color: collection.color,
                backgroundColor: `${collection.color}1a`,
              }}
            >
              {collection.name}
            </span>
          )}
        </footer>
      </article>
    );
  }

  return (
    <article className="flex gap-6 border-t border-hairline px-1 py-6">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="flex items-center gap-2.5">
          <Avatar handle={row.author.handle} />
          <a
            href={`https://x.com/${row.author.handle}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[13.5px] font-semibold text-ink hover:underline"
          >
            {row.author.displayName}
          </a>
          <a
            href={`https://x.com/${row.author.handle}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[13px] text-subtle hover:text-ink"
          >
            @{row.author.handle}
          </a>
          <span className="size-[3px] rounded-full bg-[#C5BCA6]" />
          <time className="text-[13px] text-subtle">
            {relativeTime(row.bookmarkedAt)}
          </time>
          {collection && (
            <span
              className="ml-auto flex items-center gap-1.5 rounded px-2 py-[3px] text-[11px] font-medium"
              style={{
                color: collection.color,
                backgroundColor: `${collection.color}1a`,
              }}
            >
              <span
                className="size-1.5 rounded-sm"
                style={{ backgroundColor: collection.color }}
              />
              {collection.name}
            </span>
          )}
        </header>

        {bodyText && (
          <Link href={`/b/${row.id}`} className="group">
            <p className="max-w-[680px] font-serif text-[23px] leading-[1.35] tracking-[-0.005em] text-ink group-hover:text-ink/85">
              {bodyText}
            </p>
          </Link>
        )}

        {primaryLink && (
          <LinkPreview
            linkId={primaryLink.id}
            url={primaryLink.expandedUrl ?? primaryLink.url}
            title={primaryLink.title}
            description={primaryLink.description}
            siteName={primaryLink.siteName}
            imageUrl={primaryLink.imageUrl}
            hasArticle={Boolean(primaryLink.articleHtml)}
          />
        )}

        <footer className="flex items-center gap-4 pt-1">
          {row.threadPosition !== null && (
            <Meta icon={<MessageCircle className="size-3" strokeWidth={1.8} />}>
              Thread
            </Meta>
          )}
          <Meta icon={<Clock className="size-3" strokeWidth={1.8} />}>
            {minutes} min read
          </Meta>
          {row.links.length > 0 && (
            <Meta icon={<Link2 className="size-3" strokeWidth={1.8} />}>
              {row.links.length} link{row.links.length === 1 ? "" : "s"}
            </Meta>
          )}
          {row.media.length > 0 && (
            <Meta icon={<ImageIcon className="size-3" strokeWidth={1.8} />}>
              {row.media.length} {row.media.length === 1 ? "image" : "images"}
            </Meta>
          )}
          <div className="ml-auto flex items-center gap-2.5 text-subtle">
            <button
              type="button"
              aria-label="Favorite"
              className="hover:text-ink"
            >
              <Star
                className="size-3.5"
                strokeWidth={1.7}
                fill={row.isFavorite ? "currentColor" : "none"}
              />
            </button>
            <button
              type="button"
              aria-label={row.isRead ? "Mark unread" : "Mark read"}
              className={row.isRead ? "text-accent-green" : "hover:text-ink"}
            >
              <Check className="size-3.5" strokeWidth={1.7} />
            </button>
            <button type="button" aria-label="More" className="hover:text-ink">
              <MoreHorizontal className="size-3.5" strokeWidth={1.7} />
            </button>
          </div>
        </footer>
      </div>

      {primaryMedia && !primaryLink && (
        <Link
          href={`/b/${row.id}`}
          className="size-[140px] shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-[#2A2520] to-[#4A3F35]"
        >
          {primaryMedia.previewUrl ?? primaryMedia.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryMedia.previewUrl ?? primaryMedia.url}
              alt={primaryMedia.altText ?? ""}
              className="size-full object-cover"
            />
          ) : null}
        </Link>
      )}
    </article>
  );
}

function Avatar({ handle }: { handle: string }) {
  const hue = [...handle].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="size-7 shrink-0 rounded-full"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 50% 45%), hsl(${(hue + 40) % 360} 60% 25%))`,
      }}
    />
  );
}

function Meta({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-subtle">
      {icon}
      {children}
    </span>
  );
}

function LinkPreview({
  linkId,
  url,
  title,
  description,
  siteName,
  imageUrl,
  hasArticle,
  compact = false,
}: {
  linkId: string;
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageUrl: string | null;
  hasArticle: boolean;
  compact?: boolean;
}) {
  let host = siteName;
  if (!host) {
    try {
      host = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      host = url;
    }
  }
  return (
    <div className={`group relative ${compact ? "" : "max-w-[680px]"}`}>
      <Link
        href={`/a/${encodeURIComponent(linkId)}`}
        className={`flex gap-3 rounded-lg border border-hairline bg-paper-light transition hover:border-hairline-strong ${
          compact ? "p-2.5" : "bg-surface p-3.5 gap-3.5"
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.06em] text-subtle">
            <span className="truncate">{host}</span>
            {hasArticle && (
              <>
                <span className="size-[3px] rounded-full bg-[#C5BCA6]" />
                <span className="text-accent-rust">Reader ready</span>
              </>
            )}
            {!hasArticle && title && !compact && (
              <>
                <span className="size-[3px] rounded-full bg-[#C5BCA6]" />
                <span>Article</span>
              </>
            )}
          </div>
          {title && (
            <div
              className={`font-serif leading-[1.25] tracking-[-0.01em] text-ink ${
                compact ? "line-clamp-2 text-[13.5px]" : "text-[18px]"
              }`}
            >
              {title}
            </div>
          )}
          {description && !compact && (
            <p className="line-clamp-3 text-[12.5px] leading-[1.5] text-muted">
              {description}
            </p>
          )}
        </div>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className={`shrink-0 rounded-md object-cover ${
              compact ? "size-12" : "size-[120px]"
            }`}
          />
        )}
      </Link>
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Open original"
        className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md text-subtle opacity-0 transition hover:bg-paper hover:text-ink group-hover:opacity-100"
      >
        <ExternalLink className="size-3.5" strokeWidth={1.8} />
      </a>
    </div>
  );
}

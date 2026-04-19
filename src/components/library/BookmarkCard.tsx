import Link from "next/link";
import {
  MessageCircle,
  Clock,
  Link2,
  Image as ImageIcon,
  Star,
  Check,
  MoreHorizontal,
} from "lucide-react";
import { relativeTime, readingTimeMinutes } from "@/lib/format";
import type { LibraryRow } from "@/lib/queries";

export function BookmarkCard({ row }: { row: LibraryRow }) {
  const minutes = readingTimeMinutes(row.text);
  const primaryLink = row.links[0];
  const primaryMedia = row.media[0];
  const collection = row.collections[0];

  return (
    <article className="flex gap-6 border-t border-hairline px-1 py-6">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="flex items-center gap-2.5">
          <Avatar handle={row.author.handle} />
          <Link
            href={`/b/${row.id}`}
            className="text-[13.5px] font-semibold text-ink hover:underline"
          >
            {row.author.displayName}
          </Link>
          <span className="text-[13px] text-subtle">@{row.author.handle}</span>
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

        <Link href={`/b/${row.id}`} className="group">
          <p className="max-w-[680px] font-serif text-[23px] leading-[1.35] tracking-[-0.005em] text-ink group-hover:text-ink/85">
            {row.text}
          </p>
        </Link>

        {primaryLink && (
          <LinkPreview
            url={primaryLink.expandedUrl ?? primaryLink.url}
            title={primaryLink.title}
            description={primaryLink.description}
            siteName={primaryLink.siteName}
            imageUrl={primaryLink.imageUrl}
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
  url,
  title,
  description,
  siteName,
  imageUrl,
}: {
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageUrl: string | null;
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
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="flex max-w-[680px] gap-3.5 rounded-lg border border-hairline bg-surface p-3.5 hover:border-hairline-strong"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="text-[11px] uppercase tracking-[0.06em] text-subtle">
          {host}
          {title ? " · Article" : ""}
        </div>
        {title && (
          <div className="font-serif text-[18px] leading-[1.25] tracking-[-0.01em] text-ink">
            {title}
          </div>
        )}
        {description && (
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
          className="size-[120px] shrink-0 rounded-md object-cover"
        />
      )}
    </a>
  );
}

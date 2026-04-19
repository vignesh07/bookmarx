import Link from "next/link";
import { ArrowLeft, ExternalLink, Star, Check } from "lucide-react";
import { formatDate } from "@/lib/format";
import { HeaderShareButton } from "./HeaderShareButton";

type Props = {
  postedAt: Date;
  sourceUrl: string;
  isFavorite: boolean;
  isRead: boolean;
  shareTitle?: string | null;
};

export function ReaderHeader({
  postedAt,
  sourceUrl,
  isFavorite,
  isRead,
  shareTitle,
}: Props) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-hairline bg-paper/85 px-6 backdrop-blur">
      <Link
        href="/"
        className="flex items-center gap-2 text-[13px] text-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.8} />
        Library
      </Link>
      <span className="text-[12px] text-subtle">{formatDate(postedAt)}</span>
      <div className="flex items-center gap-2 text-subtle">
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex h-7 items-center gap-1.5 rounded-md border border-hairline-strong px-2.5 text-[12px] text-ink hover:bg-surface"
        >
          <ExternalLink className="size-3" strokeWidth={1.8} />
          Open on X
        </a>
        <IconButton aria-label="Favorite" active={isFavorite}>
          <Star
            className="size-3.5"
            strokeWidth={1.7}
            fill={isFavorite ? "currentColor" : "none"}
          />
        </IconButton>
        <IconButton aria-label={isRead ? "Mark unread" : "Mark read"} active={isRead}>
          <Check className="size-3.5" strokeWidth={1.7} />
        </IconButton>
        <HeaderShareButton url={sourceUrl} title={shareTitle} />
      </div>
    </header>
  );
}

function IconButton({
  children,
  active,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={`flex size-7 items-center justify-center rounded-md hover:bg-surface ${
        active ? "text-ink" : ""
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

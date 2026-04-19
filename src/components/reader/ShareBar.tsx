"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Share as ShareIcon,
  ExternalLink,
} from "lucide-react";

type Props = {
  url: string;
  title?: string | null;
  byline?: string | null;
  openLabel?: string;
};

export function ShareBar({
  url,
  title,
  byline,
  openLabel = "Open original",
}: Props) {
  const [copied, setCopied] = useState(false);
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can fail over http — fall back to legacy selection trick
      // only if we actually encounter it. For now, silent fail is fine.
    }
  };

  const onShare = async () => {
    if (!canShare) return;
    try {
      await navigator.share({
        url,
        title: title ?? undefined,
        text: byline ? `${title ?? ""} — ${byline}` : title ?? undefined,
      });
    } catch {
      // User cancelled or the browser denied — silent is the correct UX.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onCopy}
        className="flex h-8 items-center gap-1.5 rounded-md border border-hairline-strong px-3 text-[12.5px] text-ink transition hover:bg-surface"
      >
        {copied ? (
          <>
            <Check className="size-3.5" strokeWidth={1.8} />
            Copied
          </>
        ) : (
          <>
            <Copy className="size-3.5" strokeWidth={1.8} />
            Copy link
          </>
        )}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={onShare}
          className="flex h-8 items-center gap-1.5 rounded-md border border-hairline-strong px-3 text-[12.5px] text-ink transition hover:bg-surface"
        >
          <ShareIcon className="size-3.5" strokeWidth={1.8} />
          Share
        </button>
      )}
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="flex h-8 items-center gap-1.5 rounded-md border border-hairline-strong px-3 text-[12.5px] text-ink transition hover:bg-surface"
      >
        <ExternalLink className="size-3.5" strokeWidth={1.8} />
        {openLabel}
      </a>
    </div>
  );
}

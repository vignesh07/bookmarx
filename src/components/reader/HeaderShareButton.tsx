"use client";

import { useState } from "react";
import { Check, Share } from "lucide-react";

type Props = {
  url: string;
  title?: string | null;
};

export function HeaderShareButton({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ url, title: title ?? undefined });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked — no useful fallback worth building
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? "Link copied" : "Share"}
      className="flex size-7 items-center justify-center rounded-md text-subtle hover:bg-surface hover:text-ink"
    >
      {copied ? (
        <Check className="size-3.5" strokeWidth={1.8} />
      ) : (
        <Share className="size-3.5" strokeWidth={1.7} />
      )}
    </button>
  );
}

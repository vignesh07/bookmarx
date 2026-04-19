import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-hairline bg-paper/85 px-6 backdrop-blur">
        <Link
          href="/"
          className="flex items-center gap-2 text-[13px] text-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.8} />
          Library
        </Link>
        <span className="flex items-center gap-2 text-[12px] text-subtle">
          <Loader2 className="size-3.5 animate-spin" strokeWidth={1.8} />
          Fetching article…
        </span>
        <span className="w-[100px]" />
      </header>

      <article className="mx-auto max-w-[720px] px-8 pt-14 pb-24">
        <div className="flex flex-col gap-3 pb-10">
          <Bar className="h-3 w-32" />
          <Bar className="h-10 w-full" />
          <Bar className="h-10 w-3/4" />
        </div>
        <Bar className="mb-10 aspect-[16/9] w-full" />
        <div className="flex flex-col gap-4">
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-[95%]" />
          <Bar className="h-4 w-[88%]" />
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-[92%]" />
          <Bar className="h-4 w-1/2" />
        </div>
      </article>
    </div>
  );
}

function Bar({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-hairline/70 ${className ?? ""}`}
    />
  );
}

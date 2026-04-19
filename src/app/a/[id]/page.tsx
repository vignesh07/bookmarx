import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink, RefreshCcw } from "lucide-react";
import { db } from "@/db/client";
import { bookmarks, links, authors } from "@/db/schema";
import { fetchArticle } from "./actions";
import { ShareBar } from "@/components/reader/ShareBar";

async function getLinkWithBookmark(id: string) {
  const [row] = await db
    .select({ link: links, bookmark: bookmarks, author: authors })
    .from(links)
    .innerJoin(bookmarks, eq(bookmarks.id, links.bookmarkId))
    .innerJoin(authors, eq(authors.id, bookmarks.authorId))
    .where(eq(links.id, id))
    .limit(1);
  return row ?? null;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getLinkWithBookmark(id);
  if (!row) notFound();

  const { link, bookmark, author } = row;
  const canonicalUrl = link.expandedUrl ?? link.url;

  if (link.articleError && !link.articleHtml) {
    return (
      <FailurePage
        linkId={link.id}
        url={canonicalUrl}
        bookmarkId={bookmark.id}
        error={link.articleError}
      />
    );
  }

  if (!link.articleHtml) {
    return <LoadingPage linkId={link.id} url={canonicalUrl} bookmarkId={bookmark.id} />;
  }

  const minutes = Math.max(1, Math.round((link.articleWordCount ?? 0) / 230));

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-hairline bg-paper/85 px-6 backdrop-blur">
        <Link
          href={`/b/${bookmark.id}`}
          className="flex items-center gap-2 text-[13px] text-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.8} />
          Bookmark
        </Link>
        <span className="truncate text-[12px] text-subtle">
          {link.siteName ?? hostFor(canonicalUrl)}
        </span>
        <a
          href={canonicalUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex h-7 items-center gap-1.5 rounded-md border border-hairline-strong px-2.5 text-[12px] text-ink hover:bg-surface"
        >
          <ExternalLink className="size-3" strokeWidth={1.8} />
          Original
        </a>
      </header>

      <article className="mx-auto max-w-[720px] px-8 pt-14 pb-24">
        <div className="flex flex-col gap-3 pb-10">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.08em] text-subtle">
            <span>{link.siteName ?? hostFor(canonicalUrl)}</span>
            <span className="size-[3px] rounded-full bg-[#C5BCA6]" />
            <span>{minutes} min read</span>
          </div>
          <h1 className="font-serif text-[44px] leading-[1.1] tracking-[-0.015em] text-ink">
            {link.title ?? "Untitled"}
          </h1>
          {link.articleByline && (
            <div className="pt-2 text-[13px] text-muted">
              By {link.articleByline}
            </div>
          )}
        </div>

        {link.articleLeadImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={link.articleLeadImage}
            alt=""
            className="mb-10 w-full rounded-md object-cover"
            style={{ aspectRatio: "16 / 9" }}
          />
        )}

        <div
          className="article-prose"
          dangerouslySetInnerHTML={{ __html: link.articleHtml }}
        />

        <footer className="mt-16 flex flex-col gap-6 border-t border-hairline pt-8">
          <ShareBar
            url={canonicalUrl}
            title={link.title ?? "Untitled"}
            byline={link.articleByline}
          />
          <div className="text-[12.5px] text-subtle">
            Bookmarked from{" "}
            <Link
              href={`/b/${bookmark.id}`}
              className="text-muted hover:text-ink"
            >
              @{author.handle}&apos;s post
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}

function LoadingPage({
  linkId,
  url,
  bookmarkId,
}: {
  linkId: string;
  url: string;
  bookmarkId: string;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-hairline bg-paper/85 px-6 backdrop-blur">
        <Link
          href={`/b/${bookmarkId}`}
          className="flex items-center gap-2 text-[13px] text-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.8} />
          Bookmark
        </Link>
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="flex h-7 items-center gap-1.5 rounded-md border border-hairline-strong px-2.5 text-[12px] text-ink hover:bg-surface"
        >
          <ExternalLink className="size-3" strokeWidth={1.8} />
          Original
        </a>
      </header>
      <div className="mx-auto max-w-[560px] px-8 pt-24 text-center">
        <div className="font-serif text-[28px] leading-tight tracking-[-0.01em] text-ink">
          Fetch this article?
        </div>
        <p className="mx-auto mt-4 max-w-[420px] text-[14px] leading-relaxed text-muted">
          Bookmarx will fetch {hostFor(url)} and run it through a reader
          extractor, then store the cleaned article here.
        </p>
        <form
          action={fetchArticle.bind(null, linkId)}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <button
            type="submit"
            className="rounded-md bg-ink px-4 py-2 text-[13px] font-medium text-paper hover:bg-[#2a221a]"
          >
            Fetch and read
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-md border border-hairline-strong px-4 py-2 text-[13px] text-ink hover:bg-surface"
          >
            Open original
          </a>
        </form>
      </div>
    </div>
  );
}

function FailurePage({
  linkId,
  url,
  bookmarkId,
  error,
}: {
  linkId: string;
  url: string;
  bookmarkId: string;
  error: string;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-hairline bg-paper/85 px-6 backdrop-blur">
        <Link
          href={`/b/${bookmarkId}`}
          className="flex items-center gap-2 text-[13px] text-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.8} />
          Bookmark
        </Link>
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="flex h-7 items-center gap-1.5 rounded-md border border-hairline-strong px-2.5 text-[12px] text-ink hover:bg-surface"
        >
          <ExternalLink className="size-3" strokeWidth={1.8} />
          Original
        </a>
      </header>
      <div className="mx-auto max-w-[520px] px-8 pt-24 text-center">
        <div className="font-serif text-[24px] leading-tight tracking-[-0.01em] text-ink">
          Couldn&apos;t extract the article
        </div>
        <p className="mx-auto mt-4 text-[13px] leading-relaxed text-muted">
          {error}
        </p>
        <form
          action={fetchArticle.bind(null, linkId)}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md border border-hairline-strong px-4 py-2 text-[13px] text-ink hover:bg-surface"
          >
            <RefreshCcw className="size-3" strokeWidth={1.8} />
            Retry
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-md bg-ink px-4 py-2 text-[13px] font-medium text-paper hover:bg-[#2a221a]"
          >
            Open original
          </a>
        </form>
      </div>
    </div>
  );
}

function hostFor(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

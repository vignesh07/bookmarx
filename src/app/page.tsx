import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TopNav } from "@/components/library/TopNav";
import { Sidebar } from "@/components/library/Sidebar";
import { PageHeader } from "@/components/library/FilterChips";
import { BookmarkCard } from "@/components/library/BookmarkCard";
import {
  PAGE_SIZE,
  getCollections,
  getLibraryRows,
  getLibraryStats,
  type LibraryFilter,
} from "@/lib/queries";

type SearchParams = {
  view?: "unread" | "favorites" | "recent";
  collection?: string;
  type?: "thread" | "media" | "links" | "long";
  page?: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const filter: LibraryFilter = {
    unreadOnly: sp.view === "unread",
    favoritesOnly: sp.view === "favorites",
    collectionId: sp.collection,
    type: sp.type,
  };

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [{ rows, total }, collections, stats] = await Promise.all([
    getLibraryRows(filter, { limit: PAGE_SIZE, offset }),
    getCollections(),
    getLibraryStats(),
  ]);

  const activeView = sp.collection ? "collection" : sp.view ?? "all";
  const headerCopy = headerCopyFor(activeView, sp.collection, collections);

  const chipHref = (typeId: string) => {
    const params = new URLSearchParams();
    if (sp.view) params.set("view", sp.view);
    if (sp.collection) params.set("collection", sp.collection);
    if (typeId !== "all") params.set("type", typeId);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (sp.view) params.set("view", sp.view);
    if (sp.collection) params.set("collection", sp.collection);
    if (sp.type) params.set("type", sp.type);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex h-dvh flex-col bg-paper">
      <TopNav lastSyncAt={stats.lastSyncAt} />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          collections={collections}
          totalCount={stats.total}
          unreadCount={stats.unread}
          activeCollectionId={sp.collection}
          activeView={activeView}
        />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <PageHeader
            title={headerCopy.title}
            subtitle={headerCopy.subtitle}
            active={sp.type ?? "all"}
            chips={[
              { id: "all", label: "All", count: total, href: chipHref("all") },
              { id: "thread", label: "Threads", href: chipHref("thread") },
              { id: "media", label: "Media", href: chipHref("media") },
              { id: "links", label: "Links", href: chipHref("links") },
              { id: "long", label: "Long reads", href: chipHref("long") },
            ]}
          />
          <Suspense>
            <div className="px-12 pb-16">
              {rows.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  {rows.map((row) => (
                    <BookmarkCard key={row.id} row={row} />
                  ))}
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    hrefFor={pageHref}
                  />
                </>
              )}
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (n: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-10 flex items-center justify-between text-[12.5px] text-muted">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="flex items-center gap-1.5 rounded-md border border-hairline-strong bg-surface px-3 py-1.5 text-ink hover:border-ink"
        >
          <ChevronLeft className="size-3.5" strokeWidth={1.8} />
          Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-subtle">
        Page {page} of {totalPages.toLocaleString()}
      </span>
      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className="flex items-center gap-1.5 rounded-md border border-hairline-strong bg-surface px-3 py-1.5 text-ink hover:border-ink"
        >
          Older
          <ChevronRight className="size-3.5" strokeWidth={1.8} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

function headerCopyFor(
  view: string,
  collectionId: string | undefined,
  collections: Array<{ id: string; name: string; count: number }>,
) {
  if (collectionId) {
    const c = collections.find((x) => x.id === collectionId);
    return {
      title: c?.name ?? "Collection",
      subtitle: c ? `${c.count} bookmark${c.count === 1 ? "" : "s"}` : "",
    };
  }
  if (view === "unread") {
    return { title: "Unread", subtitle: "Things you haven't read yet" };
  }
  if (view === "favorites") {
    return { title: "Favorites", subtitle: "Bookmarks you've starred" };
  }
  if (view === "recent") {
    return { title: "Recently saved", subtitle: "Fresh from your timeline" };
  }
  return {
    title: "Library",
    subtitle: "Every bookmark you've ever saved on X",
  };
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
      <p className="font-serif text-[28px] leading-tight text-ink">
        Nothing here yet.
      </p>
      <p className="max-w-md text-[13.5px] leading-relaxed text-muted">
        Install the Bookmarx browser extension and sign in to X to pull your
        bookmarks. They&rsquo;ll appear here as soon as the first sync finishes.
      </p>
    </div>
  );
}

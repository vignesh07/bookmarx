import { Suspense } from "react";
import { TopNav } from "@/components/library/TopNav";
import { Sidebar } from "@/components/library/Sidebar";
import { PageHeader } from "@/components/library/FilterChips";
import { BookmarkCard } from "@/components/library/BookmarkCard";
import {
  getCollections,
  getLibraryRows,
  getLibraryStats,
  type LibraryFilter,
} from "@/lib/queries";

type SearchParams = {
  view?: "unread" | "favorites" | "recent";
  collection?: string;
  type?: "thread" | "media" | "links" | "long";
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

  const [rows, collections, stats] = await Promise.all([
    getLibraryRows(filter),
    getCollections(),
    getLibraryStats(),
  ]);

  const activeView = sp.collection
    ? "collection"
    : sp.view ?? "all";

  const headerCopy = headerCopyFor(activeView, sp.collection, collections);

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
              { id: "all", label: "All", count: rows.length },
              { id: "thread", label: "Threads" },
              { id: "media", label: "Media" },
              { id: "links", label: "Links" },
              { id: "long", label: "Long reads" },
            ]}
          />
          <Suspense>
            <div className="px-12 pb-16">
              {rows.length === 0 ? (
                <EmptyState />
              ) : (
                rows.map((row) => <BookmarkCard key={row.id} row={row} />)
              )}
            </div>
          </Suspense>
        </main>
      </div>
    </div>
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

import Link from "next/link";
import {
  BookOpen,
  Clock,
  ListChecks,
  Star,
  Plus,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { Collection } from "@/db/schema";

type Props = {
  collections: Array<Pick<Collection, "id" | "name" | "color"> & { count: number }>;
  totalCount: number;
  unreadCount: number;
  activeCollectionId?: string;
  activeView: "all" | "unread" | "favorites" | "recent" | "collection";
};

export function Sidebar({
  collections,
  totalCount,
  unreadCount,
  activeCollectionId,
  activeView,
}: Props) {
  return (
    <aside className="flex w-[248px] shrink-0 flex-col gap-7 border-r border-hairline bg-sidebar pl-6 pr-4 pt-7 pb-6">
      <nav className="flex flex-col gap-1.5">
        <SectionLabel>Library</SectionLabel>
        <NavItem
          href="/"
          active={activeView === "all"}
          icon={<BookOpen className="size-3.5" strokeWidth={1.7} />}
          label="All bookmarks"
          count={totalCount}
        />
        <NavItem
          href="/?view=recent"
          active={activeView === "recent"}
          icon={<Clock className="size-3.5" strokeWidth={1.7} />}
          label="Recently saved"
        />
        <NavItem
          href="/?view=unread"
          active={activeView === "unread"}
          icon={<ListChecks className="size-3.5" strokeWidth={1.7} />}
          label="Unread"
          count={unreadCount}
        />
        <NavItem
          href="/?view=favorites"
          active={activeView === "favorites"}
          icon={<Star className="size-3.5" strokeWidth={1.7} />}
          label="Favorites"
        />
      </nav>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between px-2.5 pb-2">
          <SectionLabel>Collections</SectionLabel>
          <button
            type="button"
            className="text-subtle hover:text-ink"
            aria-label="New collection"
          >
            <Plus className="size-3.5" strokeWidth={1.7} />
          </button>
        </div>
        {collections.map((c) => (
          <Link
            key={c.id}
            href={`/?collection=${c.id}`}
            className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13.5px] text-ink hover:bg-hairline/40 ${
              activeCollectionId === c.id ? "bg-hairline/60" : ""
            }`}
          >
            <span
              className="size-2 rounded-sm"
              style={{ backgroundColor: c.color }}
            />
            <span className="truncate">{c.name}</span>
            <span className="ml-auto text-[11px] text-subtle">
              {formatNumber(c.count)}
            </span>
          </Link>
        ))}
        {collections.length === 0 && (
          <p className="px-2.5 py-2 text-[12px] leading-relaxed text-subtle">
            No collections yet. Bookmarks will appear here once your extension
            syncs.
          </p>
        )}
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
      {children}
    </div>
  );
}

function NavItem({
  href,
  active,
  icon,
  label,
  count,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] ${
        active
          ? "bg-ink text-paper"
          : "text-ink hover:bg-hairline/40"
      }`}
    >
      <span className={active ? "text-paper" : "text-ink"}>{icon}</span>
      <span className={active ? "font-medium" : ""}>{label}</span>
      {count !== undefined && (
        <span
          className={`ml-auto text-[11px] ${
            active ? "text-paper/60" : "text-subtle"
          }`}
        >
          {formatNumber(count)}
        </span>
      )}
    </Link>
  );
}

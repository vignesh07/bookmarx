import Link from "next/link";
import { ListFilter, Rows3, LayoutGrid, Check } from "lucide-react";

type Chip = { id: string; label: string; count?: number; href: string };

type Props = {
  active: string;
  chips: Chip[];
};

type SortId = "newest" | "oldest" | "top";
type LayoutId = "list" | "grid";

const SORT_LABELS: Record<SortId, string> = {
  newest: "Newest",
  oldest: "Oldest",
  top: "Most liked",
};

export function PageHeader({
  title,
  subtitle,
  active,
  chips,
  sort,
  sortHref,
  layout,
  layoutHref,
}: Props & {
  title: string;
  subtitle: string;
  sort: SortId;
  sortHref: (s: SortId) => string;
  layout: LayoutId;
  layoutHref: (l: LayoutId) => string;
}) {
  return (
    <div className="flex flex-col gap-5 px-12 pt-9 pb-5">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-serif text-[44px] leading-[1.05] tracking-[-0.015em] text-ink">
            {title}
          </h1>
          <p className="text-[13px] text-muted">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <SortMenu sort={sort} sortHref={sortHref} />
          <div className="flex h-8 items-center rounded-md border border-hairline-strong bg-surface px-1">
            <Link
              href={layoutHref("list")}
              aria-label="List view"
              className={`flex h-6 w-7 items-center justify-center rounded ${
                layout === "list"
                  ? "bg-ink text-paper"
                  : "text-ink hover:bg-hairline/40"
              }`}
            >
              <Rows3 className="size-3" strokeWidth={2} />
            </Link>
            <Link
              href={layoutHref("grid")}
              aria-label="Grid view"
              className={`flex h-6 w-7 items-center justify-center rounded ${
                layout === "grid"
                  ? "bg-ink text-paper"
                  : "text-ink hover:bg-hairline/40"
              }`}
            >
              <LayoutGrid className="size-3" strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </div>
      <FilterChips active={active} chips={chips} />
    </div>
  );
}

function SortMenu({
  sort,
  sortHref,
}: {
  sort: SortId;
  sortHref: (s: SortId) => string;
}) {
  const options: SortId[] = ["newest", "oldest", "top"];
  return (
    <details className="group relative">
      <summary className="flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-md border border-hairline-strong bg-surface px-3 text-[12.5px] text-ink hover:border-ink [&::-webkit-details-marker]:hidden">
        <ListFilter className="size-3.5" strokeWidth={1.8} />
        Sort: {SORT_LABELS[sort]}
      </summary>
      <div className="absolute right-0 z-30 mt-1.5 flex w-44 flex-col rounded-md border border-hairline-strong bg-surface p-1 shadow-sm">
        {options.map((opt) => (
          <Link
            key={opt}
            href={sortHref(opt)}
            className="flex items-center justify-between rounded-sm px-2.5 py-1.5 text-[12.5px] text-ink hover:bg-hairline/50"
          >
            <span>{SORT_LABELS[opt]}</span>
            {sort === opt && (
              <Check className="size-3.5" strokeWidth={1.8} />
            )}
          </Link>
        ))}
      </div>
    </details>
  );
}

export function FilterChips({ active, chips }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      {chips.map((chip) => {
        const isActive = chip.id === active;
        return (
          <Link
            key={chip.id}
            href={chip.href}
            className={`flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[12px] transition ${
              isActive
                ? "bg-ink text-paper font-medium"
                : "border border-hairline-strong text-ink hover:border-ink"
            }`}
          >
            <span>{chip.label}</span>
            {chip.count !== undefined && (
              <span
                className={isActive ? "text-paper/60" : "text-subtle text-[11px]"}
              >
                {chip.count.toLocaleString()}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

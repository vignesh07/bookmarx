import Link from "next/link";
import { ListFilter, Rows3, LayoutGrid } from "lucide-react";

type Chip = { id: string; label: string; count?: number; href: string };

type Props = {
  active: string;
  chips: Chip[];
};

export function PageHeader({
  title,
  subtitle,
  active,
  chips,
}: Props & { title: string; subtitle: string }) {
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
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-md border border-hairline-strong bg-surface px-3 text-[12.5px] text-ink"
          >
            <ListFilter className="size-3.5" strokeWidth={1.8} />
            Sort: Newest
          </button>
          <div className="flex h-8 items-center rounded-md border border-hairline-strong bg-surface px-1">
            <button
              type="button"
              aria-label="List view"
              className="flex h-6 w-7 items-center justify-center rounded bg-ink text-paper"
            >
              <Rows3 className="size-3" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              className="flex h-6 w-7 items-center justify-center rounded text-ink"
            >
              <LayoutGrid className="size-3" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
      <FilterChips active={active} chips={chips} />
    </div>
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

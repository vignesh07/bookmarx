import { Search } from "lucide-react";
import { relativeTime } from "@/lib/format";

type Props = {
  lastSyncAt: Date | null;
};

export function TopNav({ lastSyncAt }: Props) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-hairline bg-paper px-8">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink font-serif text-xl leading-none text-paper">
          b
        </div>
        <div className="font-serif text-[22px] tracking-tight text-ink">
          Bookmarx
        </div>
      </div>

      <div className="flex h-9 w-[420px] items-center gap-2 rounded-lg border border-hairline-strong bg-[#EDE7D8] px-3.5">
        <Search className="size-3.5 text-subtle" strokeWidth={2} />
        <input
          type="text"
          placeholder="Search bookmarks, authors, links…"
          className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-subtle focus:outline-none"
        />
        <div className="ml-auto flex items-center gap-1 text-[11px] text-subtle">
          <kbd className="rounded border border-hairline-strong bg-paper px-1.5 py-0.5 font-mono">
            ⌘
          </kbd>
          <kbd className="rounded border border-hairline-strong bg-paper px-1.5 py-0.5 font-mono">
            K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <span className="text-[13px] text-muted">
          {lastSyncAt ? `Synced ${relativeTime(lastSyncAt)}` : "Not yet synced"}
        </span>
        <span
          className={`size-2 rounded-full ${lastSyncAt ? "bg-accent-green" : "bg-subtle"}`}
        />
        <div className="size-8 rounded-full bg-gradient-to-br from-[#C4845E] to-[#8B5A3C]" />
      </div>
    </header>
  );
}

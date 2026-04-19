import type { Media as MediaRow } from "@/db/schema";

type Props = {
  items: MediaRow[];
};

export function Media({ items }: Props) {
  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <div className="mt-10">
        <MediaItem item={items[0]} priority />
      </div>
    );
  }

  if (items.length === 2) {
    return (
      <div className="mt-10 grid grid-cols-2 gap-1">
        {items.map((m) => (
          <MediaItem key={m.id} item={m} aspect="4/5" />
        ))}
      </div>
    );
  }

  if (items.length === 3) {
    return (
      <div className="mt-10 grid grid-cols-2 gap-1">
        <div className="row-span-2">
          <MediaItem item={items[0]} aspect="1/1" />
        </div>
        <MediaItem item={items[1]} aspect="1/1" />
        <MediaItem item={items[2]} aspect="1/1" />
      </div>
    );
  }

  return (
    <div className="mt-10 grid grid-cols-2 gap-1">
      {items.slice(0, 4).map((m) => (
        <MediaItem key={m.id} item={m} aspect="1/1" />
      ))}
    </div>
  );
}

type ItemProps = {
  item: MediaRow;
  priority?: boolean;
  aspect?: "1/1" | "4/5";
};

function MediaItem({ item, priority, aspect }: ItemProps) {
  const ratio = naturalAspect(item);
  const style = aspect
    ? { aspectRatio: aspect }
    : ratio
      ? { aspectRatio: ratio }
      : undefined;

  if (item.kind === "video" && item.videoUrl) {
    return (
      <div
        className="relative overflow-hidden rounded-md bg-[#1a1612]"
        style={style}
      >
        <video
          className="h-full w-full object-cover"
          src={item.videoUrl}
          poster={item.previewUrl ?? undefined}
          controls
          preload={priority ? "metadata" : "none"}
          playsInline
        />
        {item.durationMs && (
          <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {formatDuration(item.durationMs)}
          </span>
        )}
      </div>
    );
  }

  if (item.kind === "animated_gif" && item.videoUrl) {
    return (
      <div
        className="relative overflow-hidden rounded-md bg-[#1a1612]"
        style={style}
      >
        <video
          className="h-full w-full object-cover"
          src={item.videoUrl}
          poster={item.previewUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
        />
        <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          GIF
        </span>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-md bg-[#f0ead9]"
      style={style}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.previewUrl ?? item.url}
        alt={item.altText ?? ""}
        className="h-full w-full object-cover"
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
}

function naturalAspect(m: MediaRow): string | undefined {
  if (!m.width || !m.height) return undefined;
  return `${m.width} / ${m.height}`;
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

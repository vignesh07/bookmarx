import Link from "next/link";
import { Heart, Repeat2, MessageCircle, BookOpen, ExternalLink } from "lucide-react";
import {
  cleanTweetText,
  compactNumber,
  formatDate,
  readingTimeMinutes,
} from "@/lib/format";
import type { BookmarkDetail } from "@/lib/queries";
import { Media } from "./Media";

export function ReaderBody({ bookmark }: { bookmark: BookmarkDetail }) {
  const bodyText = cleanTweetText(bookmark.text);
  const minutes = readingTimeMinutes(bodyText);
  const hasThread = bookmark.thread.length > 1;

  return (
    <article className="mx-auto max-w-[680px] px-8 pt-12 pb-24">
      <header className="flex flex-col gap-5 pb-8">
        <AuthorRow bookmark={bookmark} />
        <div className="flex items-center gap-3 text-[12px] text-subtle">
          <span>{minutes} min read</span>
          {hasThread && (
            <>
              <Dot />
              <span>{bookmark.thread.length}-tweet thread</span>
            </>
          )}
          {bookmark.collections.length > 0 && (
            <>
              <Dot />
              <span className="flex items-center gap-1.5">
                {bookmark.collections.map((c) => (
                  <span
                    key={c.id}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5"
                    style={{
                      color: c.color,
                      backgroundColor: `${c.color}1a`,
                    }}
                  >
                    <span
                      className="size-1.5 rounded-sm"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </span>
                ))}
              </span>
            </>
          )}
        </div>
      </header>

      {hasThread ? (
        <div className="flex flex-col gap-9">
          {bookmark.thread.map((post, i) => (
            <ThreadPost
              key={post.id}
              text={cleanTweetText(post.text)}
              postedAt={post.postedAt}
              position={i + 1}
              total={bookmark.thread.length}
            />
          ))}
        </div>
      ) : (
        <div className="font-serif text-[20px] leading-[1.55] tracking-[-0.003em] text-ink whitespace-pre-wrap">
          {bodyText}
        </div>
      )}

      <Media items={bookmark.media} />

      {bookmark.links.length > 0 && (
        <section className="mt-12 flex flex-col gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
            Links
          </h2>
          {bookmark.links.map((l) => {
            const href = l.expandedUrl ?? l.url;
            const readable = Boolean(l.articleHtml) || Boolean(l.title);
            return (
              <div
                key={l.id}
                className="group relative overflow-hidden rounded-lg border border-hairline bg-surface transition hover:border-hairline-strong"
              >
                <Link
                  href={`/a/${l.id}`}
                  className="flex items-start gap-3 p-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.06em] text-subtle">
                      <span>{l.siteName ?? hostFor(href)}</span>
                      {l.articleHtml && (
                        <>
                          <span className="size-[3px] rounded-full bg-[#C5BCA6]" />
                          <span className="text-accent-rust">
                            {Math.max(
                              1,
                              Math.round((l.articleWordCount ?? 0) / 230),
                            )}{" "}
                            min read
                          </span>
                        </>
                      )}
                    </div>
                    {l.title && (
                      <div className="font-serif text-[16px] leading-tight text-ink">
                        {l.title}
                      </div>
                    )}
                    {l.description && (
                      <p className="line-clamp-2 text-[12.5px] leading-[1.5] text-muted">
                        {l.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-muted">
                      <BookOpen className="size-3" strokeWidth={1.8} />
                      {l.articleHtml
                        ? "Read article"
                        : readable
                          ? "Open reader"
                          : "Open link"}
                    </div>
                  </div>
                  {l.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.imageUrl}
                      alt=""
                      className="size-20 shrink-0 rounded-md object-cover"
                    />
                  )}
                </Link>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open original"
                  className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md text-subtle opacity-0 transition hover:bg-paper hover:text-ink group-hover:opacity-100"
                >
                  <ExternalLink className="size-3.5" strokeWidth={1.8} />
                </a>
              </div>
            );
          })}
        </section>
      )}

      <footer className="mt-12 flex items-center justify-between border-t border-hairline pt-6 text-[12.5px] text-subtle">
        <span>Posted {formatDate(bookmark.postedAt)}</span>
        <div className="flex items-center gap-4">
          <Stat
            icon={<MessageCircle className="size-3.5" strokeWidth={1.8} />}
            value={bookmark.replyCount}
          />
          <Stat
            icon={<Repeat2 className="size-3.5" strokeWidth={1.8} />}
            value={bookmark.repostCount}
          />
          <Stat
            icon={<Heart className="size-3.5" strokeWidth={1.8} />}
            value={bookmark.likeCount}
          />
        </div>
      </footer>
    </article>
  );
}

function ThreadPost({
  text,
  postedAt,
  position,
  total,
}: {
  text: string;
  postedAt: Date;
  position: number;
  total: number;
}) {
  return (
    <div className="border-l border-hairline-strong pl-5">
      <div className="pb-2 text-[11px] uppercase tracking-[0.08em] text-subtle">
        {position} / {total} · {formatDate(postedAt)}
      </div>
      <p className="font-serif text-[19px] leading-[1.55] tracking-[-0.003em] text-ink whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
}

function AuthorRow({ bookmark }: { bookmark: BookmarkDetail }) {
  const hue =
    [...bookmark.author.handle].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-10 shrink-0 rounded-full"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 50% 45%), hsl(${(hue + 40) % 360} 60% 25%))`,
        }}
      />
      <div className="flex flex-col">
        <Link
          href={`/?author=${bookmark.author.handle}`}
          className="font-serif text-[18px] leading-tight text-ink hover:underline"
        >
          {bookmark.author.displayName}
        </Link>
        <span className="text-[12.5px] text-subtle">
          @{bookmark.author.handle}
        </span>
      </div>
    </div>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <span className="flex items-center gap-1.5">
      {icon}
      {compactNumber(value)}
    </span>
  );
}

function Dot() {
  return <span className="size-[3px] rounded-full bg-[#C5BCA6]" />;
}

function hostFor(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

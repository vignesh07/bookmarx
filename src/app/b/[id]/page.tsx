import { notFound } from "next/navigation";
import { ReaderHeader } from "@/components/reader/ReaderHeader";
import { ReaderBody } from "@/components/reader/ReaderBody";
import { ReadingProgress } from "@/components/reader/ReadingProgress";
import { getBookmarkById } from "@/lib/queries";

export default async function BookmarkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookmark = await getBookmarkById(id);
  if (!bookmark) notFound();

  const shareTitle = bookmark.text
    ? `${bookmark.author.displayName} (@${bookmark.author.handle})`
    : null;

  return (
    <div className="min-h-dvh bg-paper">
      <ReadingProgress />
      <ReaderHeader
        postedAt={bookmark.postedAt}
        sourceUrl={bookmark.sourceUrl}
        isFavorite={bookmark.isFavorite}
        isRead={bookmark.isRead}
        shareTitle={shareTitle}
      />
      <ReaderBody bookmark={bookmark} />
    </div>
  );
}

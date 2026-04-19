import { notFound } from "next/navigation";
import { ReaderHeader } from "@/components/reader/ReaderHeader";
import { ReaderBody } from "@/components/reader/ReaderBody";
import { getBookmarkById } from "@/lib/queries";

export default async function BookmarkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookmark = await getBookmarkById(id);
  if (!bookmark) notFound();

  return (
    <div className="min-h-dvh bg-paper">
      <ReaderHeader
        postedAt={bookmark.postedAt}
        sourceUrl={bookmark.sourceUrl}
        isFavorite={bookmark.isFavorite}
        isRead={bookmark.isRead}
      />
      <ReaderBody bookmark={bookmark} />
    </div>
  );
}

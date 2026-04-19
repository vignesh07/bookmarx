import "dotenv/config";
import { randomUUID } from "node:crypto";
import { db } from "../src/db/client";
import {
  authors,
  bookmarks,
  collections,
  bookmarkCollections,
  links,
  media,
  syncRuns,
} from "../src/db/schema";

const COLLECTIONS = [
  { name: "AI & ML", color: "#b8472a", position: 0 },
  { name: "Engineering", color: "#3d6b8a", position: 1 },
  { name: "Design", color: "#8a4a6b", position: 2 },
  { name: "Reading list", color: "#7a6a3f", position: 3 },
];

type SeedAuthor = {
  handle: string;
  displayName: string;
  verified?: boolean;
};

const AUTHORS: SeedAuthor[] = [
  { handle: "karpathy", displayName: "Andrej Karpathy", verified: true },
  { handle: "patio11", displayName: "Patrick McKenzie" },
  { handle: "swyx", displayName: "swyx" },
  { handle: "dhh", displayName: "DHH", verified: true },
  { handle: "natfriedman", displayName: "Nat Friedman" },
  { handle: "shl", displayName: "Sahil Lavingia" },
  { handle: "tobi", displayName: "Tobi Lutke", verified: true },
  { handle: "vgr", displayName: "Venkatesh Rao" },
];

type SeedBookmark = {
  authorHandle: string;
  text: string;
  postedDaysAgo: number;
  bookmarkedDaysAgo: number;
  collection?: string;
  isFavorite?: boolean;
  isRead?: boolean;
  link?: {
    url: string;
    title: string;
    description: string;
    siteName: string;
    imageUrl?: string;
  };
  thread?: string[];
};

const BOOKMARKS: SeedBookmark[] = [
  {
    authorHandle: "karpathy",
    text: "The hottest new programming language is English. The compiler is the LLM. The IDE is the chat window. The bugs are hallucinations. The unit tests are vibes.",
    postedDaysAgo: 1,
    bookmarkedDaysAgo: 1,
    collection: "AI & ML",
    isFavorite: true,
  },
  {
    authorHandle: "patio11",
    text: "A thread on why pricing pages are the most under-invested artifact at most B2B SaaS companies, and how a single afternoon of work routinely produces 7-figure ARR lifts.",
    postedDaysAgo: 3,
    bookmarkedDaysAgo: 2,
    collection: "Engineering",
    thread: [
      "A thread on why pricing pages are the most under-invested artifact at most B2B SaaS companies, and how a single afternoon of work routinely produces 7-figure ARR lifts.",
      "Most pricing pages are written by an exec, designed by a designer who has never spoken to a customer, and reviewed by approximately nobody. They reflect what the company wants to be true, not what is true.",
      "The fix is not radical. Talk to ten customers. Find out what tier they would have bought if you'd asked the right way. Adjust copy to mirror their language. Ship in an afternoon. Measure for two weeks.",
      "I have done this exercise probably forty times. The median lift is in the high single digit percent of MRR. The top decile is closer to 30%. The downside, in every single case, has been zero.",
    ],
  },
  {
    authorHandle: "swyx",
    text: "Reading Anthropic's new paper on circuit tracing. The mechanistic interpretability work coming out of frontier labs is genuinely the most exciting thing in AI right now — way more so than the next 10% benchmark gain.",
    postedDaysAgo: 4,
    bookmarkedDaysAgo: 3,
    collection: "AI & ML",
    link: {
      url: "https://transformer-circuits.pub/",
      title: "Transformer Circuits Thread",
      description:
        "Reverse engineering transformer language models into human-understandable computer programs.",
      siteName: "transformer-circuits.pub",
    },
  },
  {
    authorHandle: "dhh",
    text: "The frontend industrial complex spent a decade convincing everyone they needed React Native, Webpack, GraphQL, and a CDN to ship a CRUD app. Turns out you mostly just needed Rails and a server.",
    postedDaysAgo: 6,
    bookmarkedDaysAgo: 5,
    collection: "Engineering",
    isFavorite: true,
  },
  {
    authorHandle: "natfriedman",
    text: "Spent the weekend reading every paper Vesuvius Challenge winners published. We are a year, maybe eighteen months, away from being able to read whole scrolls. The implications for ancient history are enormous.",
    postedDaysAgo: 8,
    bookmarkedDaysAgo: 7,
    link: {
      url: "https://scrollprize.org/",
      title: "Vesuvius Challenge — Read the Herculaneum Papyri",
      description:
        "$1M+ in prizes for reading the Herculaneum papyri from the eruption of Mount Vesuvius in 79 AD.",
      siteName: "scrollprize.org",
    },
  },
  {
    authorHandle: "shl",
    text: "The hardest part of running a small company isn't the work. It's that nobody around you understands what you're doing or why. The loneliness compounds.",
    postedDaysAgo: 11,
    bookmarkedDaysAgo: 10,
    isRead: true,
  },
  {
    authorHandle: "tobi",
    text: "Reread Christopher Alexander's A Pattern Language for the third time this year. The first 100 pages are the best writing about cities ever produced. The next 800 are the best writing about software architecture, even though they are nominally about buildings.",
    postedDaysAgo: 14,
    bookmarkedDaysAgo: 12,
    collection: "Design",
    isFavorite: true,
  },
  {
    authorHandle: "vgr",
    text: "There is a specific and identifiable kind of person who, when handed a working system, immediately wants to rewrite it. They are not bad engineers. They are not even wrong, usually. But they are expensive, and they cluster.",
    postedDaysAgo: 18,
    bookmarkedDaysAgo: 15,
    collection: "Engineering",
  },
  {
    authorHandle: "karpathy",
    text: "Tiny detail I love about modern LLMs: the way they will sometimes hedge with 'I think' or 'I believe' for facts they're uncertain about. Nobody trained them to do that explicitly. It emerged.",
    postedDaysAgo: 21,
    bookmarkedDaysAgo: 19,
    collection: "AI & ML",
  },
  {
    authorHandle: "patio11",
    text: "Friendly reminder that the IRS Free File program exists, that you almost certainly qualify, and that paying TurboTax to do something the federal government will do for you for free is a small but real victory for late-stage capitalism.",
    postedDaysAgo: 30,
    bookmarkedDaysAgo: 28,
    isRead: true,
  },
  {
    authorHandle: "swyx",
    text: "Building in public is a strategy, not a personality. Some of the most successful indie devs I know never tweet about their work. Some of the loudest builders make nothing. Don't confuse the marketing channel for the product.",
    postedDaysAgo: 45,
    bookmarkedDaysAgo: 40,
    collection: "Reading list",
  },
  {
    authorHandle: "dhh",
    text: "Just finished the Linda Holliday biography of Ray Dalio. Verdict: even the people closest to him cannot tell you what made him good. Which is, I suspect, the actual answer.",
    postedDaysAgo: 60,
    bookmarkedDaysAgo: 55,
    collection: "Reading list",
  },
];

function nowMinus(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

async function main() {
  console.log("Clearing existing data...");
  await db.delete(bookmarkCollections);
  await db.delete(media);
  await db.delete(links);
  await db.delete(bookmarks);
  await db.delete(collections);
  await db.delete(authors);
  await db.delete(syncRuns);

  console.log("Inserting authors...");
  const authorIdByHandle = new Map<string, string>();
  for (const a of AUTHORS) {
    const id = randomUUID();
    authorIdByHandle.set(a.handle, id);
    await db.insert(authors).values({
      id,
      handle: a.handle,
      displayName: a.displayName,
      verified: a.verified ?? false,
    });
  }

  console.log("Inserting collections...");
  const collectionIdByName = new Map<string, string>();
  for (const c of COLLECTIONS) {
    const id = randomUUID();
    collectionIdByName.set(c.name, id);
    await db.insert(collections).values({
      id,
      name: c.name,
      color: c.color,
      position: c.position,
    });
  }

  console.log("Inserting bookmarks...");
  let saveIndex = 0;
  for (const b of BOOKMARKS) {
    const authorId = authorIdByHandle.get(b.authorHandle);
    if (!authorId) throw new Error(`unknown handle ${b.authorHandle}`);

    const threadRootId = b.thread ? randomUUID() : null;

    if (b.thread) {
      for (let i = 0; i < b.thread.length; i++) {
        const id = i === 0 ? threadRootId! : randomUUID();
        const isHead = i === 0;
        await db.insert(bookmarks).values({
          id,
          authorId,
          text: b.thread[i],
          lang: "en",
          postedAt: nowMinus(b.postedDaysAgo - i * 0.001),
          bookmarkedAt: nowMinus(b.bookmarkedDaysAgo),
          sourceUrl: `https://x.com/${b.authorHandle}/status/${id}`,
          threadRootId: threadRootId!,
          threadPosition: i,
          replyCount: isHead ? 84 : 0,
          repostCount: isHead ? 312 : 0,
          likeCount: isHead ? 2400 : 0,
          saveIndex: saveIndex++,
          raw: { seed: true },
          isRead: b.isRead ?? false,
          isFavorite: isHead ? (b.isFavorite ?? false) : false,
        });
        if (isHead && b.collection) {
          await db.insert(bookmarkCollections).values({
            bookmarkId: id,
            collectionId: collectionIdByName.get(b.collection)!,
          });
        }
      }
    } else {
      const id = randomUUID();
      await db.insert(bookmarks).values({
        id,
        authorId,
        text: b.text,
        lang: "en",
        postedAt: nowMinus(b.postedDaysAgo),
        bookmarkedAt: nowMinus(b.bookmarkedDaysAgo),
        sourceUrl: `https://x.com/${b.authorHandle}/status/${id}`,
        replyCount: Math.floor(Math.random() * 200),
        repostCount: Math.floor(Math.random() * 800),
        likeCount: Math.floor(Math.random() * 5000),
        saveIndex: saveIndex++,
        raw: { seed: true },
        isRead: b.isRead ?? false,
        isFavorite: b.isFavorite ?? false,
      });
      if (b.collection) {
        await db.insert(bookmarkCollections).values({
          bookmarkId: id,
          collectionId: collectionIdByName.get(b.collection)!,
        });
      }
      if (b.link) {
        await db.insert(links).values({
          id: randomUUID(),
          bookmarkId: id,
          url: b.link.url,
          expandedUrl: b.link.url,
          title: b.link.title,
          description: b.link.description,
          siteName: b.link.siteName,
          imageUrl: b.link.imageUrl ?? null,
        });
      }
    }
  }

  console.log("Recording sync run...");
  await db.insert(syncRuns).values({
    id: randomUUID(),
    startedAt: new Date(Date.now() - 1000 * 60 * 5),
    finishedAt: new Date(Date.now() - 1000 * 60 * 4),
    bookmarksSeen: BOOKMARKS.length,
    bookmarksNew: BOOKMARKS.length,
    bookmarksUpdated: 0,
    source: "seed",
  });

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

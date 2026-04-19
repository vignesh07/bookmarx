# Bookmarx

> Your X bookmarks, finally readable.

A self-hosted organizer, viewer, and reader for your X (Twitter) bookmarks.
One database, one user, one deploy. No SaaS, no subscriptions, no scraping
of your data into someone else's product.

- **Editorial reader** — serif body text, threads rendered as a connected
  sequence, no chrome.
- **Collections** — color-coded, manually managed.
- **Filters** — unread, favorites, threads, media, links, long reads.
- **Browser extension** — pulls every bookmark you've ever saved
  (including the >800 the official API can't reach) using your own
  session cookies.
- **Single tenant by design** — there's no auth, because you're the only
  one with the URL.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4 (CSS-first `@theme` config)
- Drizzle ORM + Postgres (`postgres-js` driver)
- Zod for input validation
- Chrome MV3 extension for sync

## Quick start (local)

```bash
# 1. Install deps
pnpm install

# 2. Copy env template, set DATABASE_URL and INGEST_TOKEN
cp .env.example .env
# generate a token:
openssl rand -hex 32

# 3. Push the schema to your database
pnpm db:push

# 4. (optional) Seed sample data so the UI has something to show
pnpm seed

# 5. Run the dev server
pnpm dev
```

Open <http://localhost:3000>.

## Deploy

Bookmarx is a stock Next.js app plus a Postgres database. Anywhere you
can run `pnpm build && pnpm start` works — Vercel, Fly, Render, a
Docker host, a VPS. The recipe is the same:

1. Provision a Postgres database and copy its connection string into
   `DATABASE_URL`.
2. Set `INGEST_TOKEN` to a long random string
   (`openssl rand -hex 32`). The browser extension uses this to
   authenticate sync requests.
3. Run `pnpm db:migrate` once against the database (locally or as a
   release/predeploy step).
4. Build and start the app: `pnpm build && pnpm start`.
5. Open your deploy URL — empty library is expected.
6. Install the [browser extension](./extension), point it at the URL
   with the same `INGEST_TOKEN`, and hit **Sync now**.

There is no auth in the app itself — keep the URL private, and rely on
`INGEST_TOKEN` to gate the write endpoint. If you want a stronger seal,
put it behind your hosting provider's basic-auth or a Cloudflare
Access policy.

## Browser extension

See [`extension/README.md`](./extension/README.md) for install instructions
and how to refresh the X GraphQL endpoint when it rotates.

## Project layout

```
src/
  app/
    page.tsx              Library
    b/[id]/page.tsx       Reader
    api/ingest/route.ts   POST endpoint for the extension
  components/
    library/              TopNav, Sidebar, FilterChips, BookmarkCard
    reader/               ReaderHeader, ReaderBody
  db/                     Drizzle schema + client
  lib/                    queries, format, ingest
extension/
  src/                    background, popup, xapi, transform
  manifest.json
scripts/
  seed.ts                 Sample data
```

## Development

```bash
pnpm dev          # next dev
pnpm lint         # eslint
pnpm db:studio    # drizzle studio
pnpm db:generate  # generate a migration after schema changes
pnpm db:push      # apply schema directly (dev only)
```

## License

MIT — see [LICENSE](./LICENSE).

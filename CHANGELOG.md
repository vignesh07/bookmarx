# Changelog

All notable changes to Bookmarx are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-04-19

Initial public release.

### Added
- Library view with list and grid layouts, filter chips (unread,
  favorites, threads, media, links, long reads) and a Collections
  sidebar.
- Editorial reader for individual bookmarks: serif body, threads
  rendered as a connected sequence, no chrome.
- Inline article reader using Mozilla Readability — opens the linked
  article in-app without leaving the bookmark.
- Color-coded, manually managed Collections.
- Chrome MV3 extension that pulls every bookmark via your own X session
  cookies, including the >800 the official API can't reach.
- `POST /api/ingest` endpoint that accepts batched bookmarks and
  upserts on tweet id.
- Single-command Docker install: `docker compose up -d` brings up the
  app and Postgres on `http://localhost:3000`. Migrations run on
  startup; data persists in a Docker volume.
- Multi-arch images (`linux/amd64`, `linux/arm64`) published to
  `ghcr.io/vignesh07/bookmarx`.

### Notes
- Bookmarx is local-only by design. The server has no auth and is
  meant to be bound to localhost; the ingest endpoint has no token
  for the same reason.

[0.1.0]: https://github.com/vignesh07/bookmarx/releases/tag/v0.1.0

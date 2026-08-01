# ASHFOG

ASHFOG is a static Astro publication for one source-linked AI, open-source, and
developer-ecosystem brief per day.

## Content contract

Published editions live at:

```text
src/content/daily/YYYY-MM-DD.json
```

Every edition must pass:

```text
pnpm run validate:daily -- src/content/daily/YYYY-MM-DD.json
```

The version 3 content model keeps collection and presentation separate. `signals`
stores deduplicated events, concise factual briefs, original source links, and
optional community voices. `article` turns those signals into exactly one daily
article with internal subheadings. Every signal is assigned exactly once to an
article section or the compact `otherSignalIds` list.

When the formal content directory is empty, the site uses
`tests/fixtures/2026-07-28.json` as a site preview. The preview fixture is not
part of the publication directory. As soon as a formal edition exists, only
formal editions are rendered.

## Source collection

`editorial/sources.json` is the stable 54-source editorial registry. Machine-readable endpoints and ordered fallbacks live separately in `editorial/source-access.json`, so RSS, API, GitHub, page, and indexed-search routes can be maintained without changing source IDs or invalidating historical editions. Community collection behavior lives in `editorial/community-policy.md`.

A collector must try a source's configured routes in order. A broad route with no in-scope entries does not suppress a narrower fallback. It records `collected` when any working route yields in-window entries, `empty` when working dated routes cover the rolling 24-hour window but yield no in-window entries, and `unavailable` only after every configured route fails.

## Image library

The committed library contains 40 article artworks and 8 page artworks. Each
artwork has 768 px and 1536 px WebP renditions. The canonical manifest is:

```text
editorial/image-library.json
```

Every edition displays exactly one article image. Astro uses the edition date to
select from a stable shuffled rotation, which keeps rebuilds deterministic and
avoids repeats across consecutive editions until the 40-image pool cycles.
Daily JSON normally omits `heroImageId`; use it only for an intentional override
from the manifest. Signals and internal article sections never receive images.

## Local development

```text
pnpm install
pnpm run dev
```

## Production build

```text
pnpm run build
```

The build first validates every production daily JSON file and runs the editorial
test suite. It then creates the Astro site, generates the Pagefind search index,
and verifies canonical links, crawl directives, Sitemap output, and structured
data. Invalid editorial content or a missing SEO artifact fails deployment.

## Search indexing

Astro generates:

- `/robots.txt`
- `/sitemap-index.xml`
- `/sitemap-0.xml`
- `/rss.xml`

Daily pages include `NewsArticle` and breadcrumb JSON-LD. Collection and about
pages declare their corresponding Schema.org page types. Search and 404 pages
are marked `noindex`; search is also excluded from the Sitemap.

After the production domain is online, verify `ashfog.com` in Google Search
Console and submit:

```text
https://ashfog.com/sitemap-index.xml
```

If Search Console provides an HTML verification token, set this Cloudflare
Pages build variable:

```text
PUBLIC_GOOGLE_SITE_VERIFICATION=your-token
```

## Cloudflare Pages

- Build command: `pnpm run build`
- Output directory: `dist`
- Node.js: `22.22.2` or newer
- Production branch: `main`

Cloudflare Pages does not need a database or server runtime. A daily task writes
one validated JSON file, commits it to GitHub, and the resulting `main` update
triggers the static build.

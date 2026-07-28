# ASHFOG

ASHFOG is a static Astro publication for one verified AI, open-source, and
developer-ecosystem intelligence brief per day.

## Content contract

Published editions live at:

```text
src/content/daily/YYYY-MM-DD.json
```

Every edition must pass:

```text
pnpm run validate:daily -- src/content/daily/YYYY-MM-DD.json \
  --content-dir src/content/daily \
  --check-links
```

When the formal content directory is empty, the site uses
`tests/fixtures/2026-07-28.json` as a theme preview. The preview fixture is not
part of the publication directory. As soon as a formal edition exists, only
formal editions are rendered.

## Image library

The committed library contains 40 category story artworks and 8 page artworks. Six page artworks are registered as overflow reserves, giving every valid edition 46 unique story-image slots. The daily Schema uses 46 only as an anomaly guard. Each
artwork has 768 px and 1536 px WebP renditions. The canonical manifest is:

```text
editorial/image-library.json
```

Daily JSON normally omits `imageId`. Astro then assigns images by category
using `editionDate`, story ID, and category as a stable seed. Assignment is
deterministic across rebuilds and globally unique within one edition. Stories 41–46 use the six registered reserve artworks, so image assignment remains unique throughout every valid daily edition.

Use a story `imageId` only for an intentional editorial override. It must exist
in the manifest, match the story category, and not be used by another story in
the same edition. `heroImageId` can reference any story or page artwork.
Validation fails before publication when an ID is unknown, mismatched, repeated,
or when a rendition file is missing.

## Local development

```text
pnpm install
pnpm run dev
```

## Production build

```text
pnpm run build
```

The build creates the Astro site, then generates the Pagefind search index.
It also verifies canonical links, crawl directives, Sitemap output, and
structured data. A missing SEO artifact fails the deployment build.

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

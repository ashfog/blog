# AshFog

AshFog is a static Astro publication for one verified AI, open-source, and
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

## Cloudflare Pages

- Build command: `pnpm run build`
- Output directory: `dist`
- Node.js: `22.12` or newer
- Production branch: `main`

Cloudflare Pages does not need a database or server runtime. A daily task writes
one validated JSON file, commits it to GitHub, and the resulting `main` update
triggers the static build.

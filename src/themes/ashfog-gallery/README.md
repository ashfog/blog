# ASHFOG Gallery

Status: **registered production theme**. `site.config.json` selects `ashfog-gallery`; the manifest is registered in `src/themes/registry.ts`, and the theme tokens are imported by `src/styles/global.css`. Existing articles, publisher rules, image selection, search, RSS, Sitemap, and SEO remain shared with the other themes.

The production homepage renders `GalleryHome.astro` through `src/pages/index.astro`. During local development, `/preview/gallery` remains available as a standalone design surface. That dynamic preview route returns **zero paths in production**, so it stays outside generated pages, the sitemap, and the search index.

## Direction

An invisible gallery with restrained typography and real article covers arranged across a **three-sided perspective room**, inspired by the user-supplied museum-gallery video. The centered article hangs on a distant back wall; neighboring articles round the two rear corners and travel toward the viewer along the left and right walls. The back wall, segmented round corners, side walls and floor remain members of the CSS 3D scene for geometry only, but every surface uses the page background with no outline; the moving articles alone reveal the room. Each cover and its complete label are rendered as twenty-four matching vertical strips whose positions and tangents independently sample that same wall path. A card therefore bends around a corner, with one part still on the back wall and another already on the side wall, instead of rotating through the turn as one floating rigid panel. No reference logos or paintings are copied. The gallery draws from the twelve latest articles and links to their existing article pages.

Images retain their aspect ratios. Long exhibition labels are visually clamped, but the full title is available in the accessible link name and in the centered article panel. User-hosted images retain their existing URLs. If an image fails, the prototype uses the article's deterministic library fallback and its correct alt text, without changing the article.

## Interaction contract

- Slow automatic movement, approximately one article every 10.5 seconds.
- Hover or keyboard focus pauses automatic movement. Pointer dragging has short, bounded inertia.
- Horizontal dragging does not consume vertical touch scrolling or pinch zoom. Crossing the drag threshold suppresses accidental link activation on release.
- Previous/next controls and left/right arrow keys move between articles. Manual controls have an announcement; automatic movement does not repeatedly announce changes.
- The pause button is explicit. Reduced-motion preference disables automatic movement and inertia; manual stepping is immediate.
- Frames stop when the gallery leaves the viewport, the document is hidden, or movement is paused and settled. Listeners and observers are cleaned up when the element disconnects.
- Without JavaScript, the same real article links remain available in a horizontally scrollable list.
- Color-mode switching is local to this prototype and does not overwrite the live site's saved preference.

## Implementation boundaries

`GalleryHome.astro` supplies the shared production experience and article data. `GalleryPreview.astro` wraps that component in a standalone development-only document. `theme.css` owns the site-wide light/dark tokens and reading-page treatment; `gallery.css` owns the gallery surface. `gallery.ts` adds client interactions and constructs the non-destructive cover and label strips; `geometry.mjs` owns the loop and wall-path math. This uses native three-dimensional CSS transforms, not a recorded video, a canvas screenshot, or a WebGL renderer. The strips approximate a continuously bending print while keeping the original image and label as the accessible, no-JavaScript source.

Run `node --test src/themes/ashfog-gallery/geometry.test.mjs` for the small geometry regression suite, then `pnpm run build` to confirm existing production checks still pass. Regressions assert the back-wall, rounded-corner and side-wall segments; that the two edges of one wide cover can simultaneously occupy different wall segments; the large near-to-far scale change; and front-facing panels at every supported width. A build does not substitute for interaction review on actual browsers and devices, especially while a cover is crossing either corner.

Theme changes must still pass the gallery geometry tests and the repository's complete `pnpm run build` before they are published to `main`.

# ASHFOG Horizon artwork

Three original illustrations were generated for this theme with the built-in image-generation tool on September 10, 2026. The user's reference screenshots informed the airy palette and illustrated editorial direction; no screenshot pixels or third-party logos were used as theme assets.

## Production files

All files are self-hosted under `public/images/themes/horizon/`. WebP conversion and responsive resizing preserve the generated artwork.

| File | Dimensions | Bytes | Usage |
| --- | --- | ---: | --- |
| landscape-1536.webp | 1536 × 1024 | 297494 | Decorative homepage hero and homepage social image |
| landscape-640.webp | 640 × 427 | 64628 | Responsive hero source |
| reading-window-1024.webp | 1024 × 1024 | 235256 | Homepage editorial panel and About illustration |
| reading-window-640.webp | 640 × 640 | 108562 | Responsive editorial source |
| river-valley-2048.webp | 2048 × 683 | 228092 | Full-width decorative footer landscape |
| river-valley-1024.webp | 1024 × 341 | 73866 | Medium footer source |
| river-valley-640.webp | 640 × 213 | 32304 | Small footer source |

The hero has empty Alt text because it is decorative behind a complete textual introduction. The window illustration has a literal description of the book, telescope, arched window, and mountain lake. The footer illustration is decorative, has empty Alt text, and sits in an aria-hidden container below all navigation and copyright text. It fades into the footer background, centers the river on mobile, and uses CSS dimming and a cool tint in dark mode without downloading another image. It is static, lazy-loaded, and low priority. Existing article images and user-provided external URLs are retained; these theme assets do not replace article covers.

## Generation prompts

### Mountain panorama

Use case: illustration-story. Asset type: original panoramic website hero background for ASHFOG, an independent magazine about technology, culture and curiosity. Generate a beautiful wide 3:2 landscape illustration, premium hand-painted gouache with subtle paper texture, intricate but soft architectural detail, clear airy turquoise sky and creamy sunlit clouds. Composition for web text overlay: upper 58 percent is quiet open pale blue sky, nearly empty especially center; the entire lower 42 percent is an enchanting continuous island landscape. Lush green rocky alpine peaks to left, a small warm terracotta observatory with cream telescope dome near left edge, meandering turquoise river into distance, cream stone arched footbridge, cypress trees, a tiny peaceful cream library with blue roof to right, grassy terraces and wildflowers, layered hills and soft mist. Natural believable illustrated environment, not flying islands. Sky is lighter toward horizon, sophisticated travel-journal charm. A small hot air balloon far upper right only. Palette azure #65c8e3, pale sky #e6f5fa, eucalyptus green, ivory, hints of terracotta. Warm joyful curiosity, not childish. Landscape bleeds to edges, no frame, NO text, NO logos, NO UI, NO watermark, no recognizable famous landmarks. Do not include human faces.

### Reading window

Use case: illustration-story. Asset type: square editorial website illustration for ASHFOG Horizon curiosity journal. Scene: intimate beautiful cream stone arched window, a thick arch that frames a sunny turquoise lake and distant green mountains with tiny town, blue sky and fluffy ivory clouds. On the broad cream windowsill sits an open book with blank unmarked creamy pages, a small terracotta vase with flowering olive branches, a small brass vintage telescope pointing through window. One pale yellow butterfly. The surrounding wall is warm off-white, the window beautifully centered and occupying most of the square. Hand-painted gouache with delicate paper grain, premium illustrated travel journal, inviting and sophisticated, not cartoon clipart. Azure sky, sage foliage, warm cream, small coral accents, natural soft afternoon sunlight and gentle shadows. No text, no letters, no watermark, no logos, no frame outside the composition. All elements within crop. Same artistic world as a panoramic landscape of a library and observatory in mountain valley.

### Quiet river valley

Use case: illustration-story. Asset type: original panoramic website footer illustration for ASHFOG Horizon, matching a premium sunlit gouache mountain-valley journal. Create a VERY WIDE 3:1 panoramic horizontal landscape, a peaceful quiet narrow river winding gently from a misty distant valley at the center toward the foreground, flanked by soft sage-green grassy banks, a few low willow and cypress trees, pale smooth river stones, sparse tiny white wildflowers. Layered low blue-green mountains recede into luminous morning mist. Upper third is pale powder blue mist and soft empty sky, fading almost to #e9f3f7 at top edge. Clear shallow blue-turquoise water reflects the sky with delicate ripples. A restful intimate riverside scene, not a grand canyon and not a huge lake. Hand-painted gouache on fine-grain paper, sophisticated editorial travel-journal illustration, beautifully observed foliage and water, restrained detail density, muted azure, eucalyptus green, cream and tiny warm earth accents. Landscape features stay low and horizontal. Keep the river bends and valley focal point centered so a narrow portrait crop still looks meaningful; main landscape must remain legible when the top and bottom are cropped into a shallow footer banner. Gentle diffuse morning light, quiet and contemplative, no drama. Full bleed artwork, no borders, no vignettes, NO text, NO logo, NO watermark, no buildings, no people, no mountains with sharp towering spires. Fresh original illustration, not a screenshot or UI mockup.

## Maintenance

- Add new themes as separate registry entries; do not overwrite these assets when switching themes.
- These are illustrations, not photographs of actual locations.
- Preserve explicit width/height, responsive sources, and below-the-fold lazy loading.
- Respect the repository's license when redistributing its theme and artwork.

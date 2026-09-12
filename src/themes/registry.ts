import ashfogEditorial from "./ashfog-editorial/theme.json";
import ashfogGallery from "./ashfog-gallery/theme.json";
import ashfogHumanist from "./ashfog-humanist/theme.json";
import ashfogHorizon from "./ashfog-horizon/theme.json";

const registry = {
  [ashfogEditorial.id]: ashfogEditorial,
  [ashfogGallery.id]: ashfogGallery,
  [ashfogHumanist.id]: ashfogHumanist,
  [ashfogHorizon.id]: ashfogHorizon
} as const;

export type ThemeId = keyof typeof registry;

export function getThemeManifest(themeId: string) {
  const manifest = registry[themeId as ThemeId];
  if (!manifest) throw new Error(`Unknown site theme: ${themeId}`);
  return manifest;
}

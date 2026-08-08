import ashfogEditorial from "./ashfog-editorial/theme.json";
import ashfogHumanist from "./ashfog-humanist/theme.json";

const registry = {
  [ashfogEditorial.id]: ashfogEditorial,
  [ashfogHumanist.id]: ashfogHumanist
} as const;

export type ThemeId = keyof typeof registry;

export function getThemeManifest(themeId: string) {
  const manifest = registry[themeId as ThemeId];
  if (!manifest) throw new Error(`Unknown site theme: ${themeId}`);
  return manifest;
}

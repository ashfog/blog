import imageLibrary from "../../editorial/image-library.json";
import type { DailyEdition } from "./daily";

type ImageVariant = "main" | "light" | "dark";

interface StoryImageEntry {
  id: string;
  category: string;
  variant: ImageVariant;
  alt: string;
}

interface PageImageEntry {
  id: string;
  page: string;
  variant: ImageVariant;
  alt: string;
}

export interface LibraryImage {
  id: string;
  alt: string;
  variant: ImageVariant;
  src: string;
  largeSrc: string;
  srcset: string;
  width: number;
  height: number;
}

const storyEntries = imageLibrary.storyImages as StoryImageEntry[];
const pageEntries = imageLibrary.pageImages as PageImageEntry[];
const allEntries = [...storyEntries, ...pageEntries];

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function imagePath(entry: StoryImageEntry | PageImageEntry, width: 768 | 1536) {
  if ("category" in entry) {
    return `/images/library/stories/${entry.category}/${entry.id}-${width}.webp`;
  }
  return `/images/library/pages/${entry.id}-${width}.webp`;
}

function toLibraryImage(entry: StoryImageEntry | PageImageEntry): LibraryImage {
  const small = imagePath(entry, 768);
  const large = imagePath(entry, 1536);
  return {
    id: entry.id,
    alt: entry.alt,
    variant: entry.variant,
    src: small,
    largeSrc: large,
    srcset: `${small} 768w, ${large} 1536w`,
    width: imageLibrary.dimensions.width,
    height: imageLibrary.dimensions.height
  };
}

export function getImageById(id: string | null | undefined) {
  if (!id) return undefined;
  const entry = allEntries.find((image) => image.id === id);
  return entry ? toLibraryImage(entry) : undefined;
}

export function getPageImage(page: string) {
  const entry = pageEntries.find((image) => image.page === page);
  return entry ? toLibraryImage(entry) : undefined;
}

export function getEditionHeroImage(edition: DailyEdition) {
  const requested = getImageById(edition.heroImageId);
  if (requested) return requested;

  const orderedPool = [...storyEntries].sort(
    (first, second) => hash(first.id) - hash(second.id)
  );
  const dayNumber = Math.floor(
    Date.parse(`${edition.editionDate}T00:00:00Z`) / 86_400_000
  );
  const entry = orderedPool[((dayNumber % orderedPool.length) + orderedPool.length) % orderedPool.length];
  return entry ? toLibraryImage(entry) : getPageImage("daily");
}

export const storyImageIds = new Set(storyEntries.map((image) => image.id));
export const imageIds = new Set(allEntries.map((image) => image.id));

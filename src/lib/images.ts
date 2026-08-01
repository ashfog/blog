import imageLibrary from "../../editorial/image-library.json";
import type { DailyEdition, DailySignal } from "./daily";

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
const reserveStoryPageIds = new Set(imageLibrary.storyReservePageIds as string[]);
const reserveStoryEntries = pageEntries.filter((image) => reserveStoryPageIds.has(image.id));
const storyPoolEntries = [...storyEntries, ...reserveStoryEntries];
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

function choose(
  candidates: Array<StoryImageEntry | PageImageEntry>,
  story: DailySignal,
  editionDate: string
) {
  return candidates[
    hash(`${editionDate}:${story.id}:${story.category}`) % candidates.length
  ];
}

export function getEditionStoryImages(edition: DailyEdition) {
  const assigned = new Map<string, LibraryImage>();
  const used = new Set<string>();
  const orderedStories = [...edition.signals].sort(
    (first, second) => first.position - second.position
  );

  for (const story of orderedStories) {
    const requested = story.imageId
      ? storyEntries.find((image) => image.id === story.imageId)
      : undefined;
    const categoryCandidates = storyEntries.filter(
      (image) => image.category === story.category && !used.has(image.id)
    );
    const fallbackCandidates = storyPoolEntries.filter(
      (image) => !used.has(image.id)
    );

    const entry =
      (requested && !used.has(requested.id) ? requested : undefined) ??
      (categoryCandidates.length
        ? choose(categoryCandidates, story, edition.editionDate)
        : choose(fallbackCandidates, story, edition.editionDate));

    assigned.set(story.id, toLibraryImage(entry));
    used.add(entry.id);
  }

  return assigned;
}

export function getEditionHeroImage(
  edition: DailyEdition,
  storyImages = getEditionStoryImages(edition)
) {
  const requested = getImageById(edition.heroImageId);
  if (requested) return requested;
  const featured = edition.signals[0];
  return storyImages.get(featured.id) ?? getPageImage("daily");
}

export const storyImageIds = new Set(storyEntries.map((image) => image.id));
export const imageIds = new Set(allEntries.map((image) => image.id));

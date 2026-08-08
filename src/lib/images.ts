import imageLibrary from "../../editorial/image-library.json";
import { getArticleSlug, type ArticleEntry } from "./articles";

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
const categoryFallbacks: Record<string, string> = {
  web: "developer-tools",
  media: "community",
  culture: "community"
};

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

export function getArticleHeroImage(article: ArticleEntry) {
  if (article.data.heroImageUrl && article.data.heroImageAlt) {
    return {
      id: `external-${getArticleSlug(article)}`,
      alt: article.data.heroImageAlt,
      variant: "main" as const,
      src: article.data.heroImageUrl,
      largeSrc: article.data.heroImageUrl,
      srcset: article.data.heroImageUrl,
      width: imageLibrary.dimensions.width,
      height: imageLibrary.dimensions.height
    };
  }

  const requested = getImageById(article.data.heroImageId);
  if (requested) return requested;

  const exactCategoryPool = storyEntries.filter(
    (entry) => entry.category === article.data.category
  );
  const fallbackCategory = categoryFallbacks[article.data.category];
  const categoryPool = exactCategoryPool.length > 0
    ? exactCategoryPool
    : fallbackCategory
      ? storyEntries.filter((entry) => entry.category === fallbackCategory)
      : [];
  const pool = categoryPool.length > 0 ? categoryPool : storyEntries;
  const orderedPool = [...pool].sort(
    (first, second) => hash(first.id) - hash(second.id)
  );
  const entry = orderedPool[hash(getArticleSlug(article)) % orderedPool.length];
  return entry ? toLibraryImage(entry) : getPageImage("analysis");
}

export const storyImageIds = new Set(storyEntries.map((image) => image.id));
export const imageIds = new Set(allEntries.map((image) => image.id));

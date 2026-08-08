import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import imageLibrary from "../editorial/image-library.json";

const imageIds = new Set([
  ...imageLibrary.storyImages.map((image) => image.id),
  ...imageLibrary.pageImages.map((image) => image.id)
]);
const tagPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const httpsImageUrl = z.string().url().refine((url) => url.startsWith("https://"), {
  message: "External image URLs must use HTTPS"
});

const articles = defineCollection({
  loader: glob({ base: "./src/content/articles", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string().min(8).max(120),
    description: z.string().min(40).max(220),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    language: z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/).optional(),
    category: z.enum([
      "models",
      "agents",
      "open-source",
      "developer-tools",
      "infrastructure",
      "research",
      "hardware",
      "security",
      "policy",
      "web",
      "media",
      "culture",
      "community"
    ]),
    tags: z.array(z.string().regex(tagPattern)).min(1).max(10).refine(
      (tags) => new Set(tags).size === tags.length,
      { message: "Article tags must be unique lowercase hyphenated slugs" }
    ),
    heroImageId: z.string().refine((id) => imageIds.has(id), {
      message: "heroImageId must reference editorial/image-library.json"
    }).optional(),
    heroImageUrl: httpsImageUrl.optional(),
    heroImageAlt: z.string().trim().min(5).max(180).optional(),
    featured: z.boolean().default(false),
    sources: z.array(z.object({
      title: z.string().min(1),
      url: z.string().url().refine((url) => url.startsWith("https://") || url.startsWith("http://"), {
        message: "Source URLs must use HTTP or HTTPS"
      })
    })).default([])
  }).strict().superRefine((data, context) => {
    if (data.heroImageId && data.heroImageUrl) {
      context.addIssue({
        code: "custom",
        path: ["heroImageUrl"],
        message: "Use either heroImageId or heroImageUrl, not both"
      });
    }
    if (Boolean(data.heroImageUrl) !== Boolean(data.heroImageAlt)) {
      context.addIssue({
        code: "custom",
        path: data.heroImageUrl ? ["heroImageAlt"] : ["heroImageUrl"],
        message: "heroImageUrl and heroImageAlt must be provided together"
      });
    }
  })
});

export const collections = { articles };

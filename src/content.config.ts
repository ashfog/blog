import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ base: "./src/content/articles", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string().min(8).max(120),
    description: z.string().min(40).max(220),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    category: z.enum([
      "models",
      "agents",
      "open-source",
      "developer-tools",
      "infrastructure",
      "research",
      "hardware",
      "security",
      "policy"
    ]),
    tags: z.array(z.string().min(1)).min(1).max(10),
    heroImageId: z.string().optional(),
    featured: z.boolean().default(false),
    sources: z.array(z.object({
      title: z.string().min(1),
      url: z.string().url()
    })).default([])
  })
});

export const collections = { articles };

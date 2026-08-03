import { getCollection, type CollectionEntry } from "astro:content";

export type ArticleEntry = CollectionEntry<"articles">;

export async function getArticles() {
  const articles = await getCollection("articles");
  return articles.sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );
}

export function formatArticleDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function articleReadingMinutes(article: ArticleEntry) {
  const words = article.body.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function getAllArticleTopics(articles: ArticleEntry[]) {
  return [...new Set(articles.flatMap((article) => [article.data.category, ...article.data.tags]))]
    .sort((a, b) => a.localeCompare(b));
}

export function getArticlesByTopic(articles: ArticleEntry[], topic: string) {
  return articles.filter(
    (article) => article.data.category === topic || article.data.tags.includes(topic)
  );
}

export const categoryLabels: Record<string, string> = {
  models: "Models",
  agents: "Agents",
  "open-source": "Open Source",
  "developer-tools": "Developer Tools",
  infrastructure: "Infrastructure",
  research: "Research",
  hardware: "Hardware",
  security: "Security",
  policy: "Policy"
};

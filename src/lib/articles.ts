import { getCollection, type CollectionEntry } from "astro:content";
import { siteConfig } from "../config/site";

export type ArticleEntry = CollectionEntry<"articles">;

export interface ArticleDateGroup {
  key: string;
  label: string;
  articles: ArticleEntry[];
}

export interface ActiveArticleCategory {
  slug: string;
  label: string;
  count: number;
  latestAt: Date;
}

export async function getArticles() {
  const articles = await getCollection("articles");
  return articles.sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );
}

export function getArticleSlug(article: ArticleEntry) {
  const normalizedId = article.id.replaceAll("\\", "/");
  return normalizedId.split("/").filter(Boolean).at(-1) ?? normalizedId;
}

export function formatArticleDate(date: Date, locale = siteConfig.site.locale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: siteConfig.site.timezone
  }).format(date);
}

export function articleReadingMinutes(article: ArticleEntry) {
  const cjkCharacters = article.body.match(/[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/gu)?.length ?? 0;
  const nonCjkWords = article.body
    .replace(/[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(cjkCharacters / 500 + nonCjkWords / 220));
}

function getSiteDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: siteConfig.site.timezone
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>;
}

function getSiteDateKey(date: Date) {
  const parts = getSiteDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getSiteMonthKey(date: Date) {
  const parts = getSiteDateParts(date);
  return `${parts.year}-${parts.month}`;
}

export function getArticlesFromLatestDays(articles: ArticleEntry[], days = 3) {
  if (articles.length === 0 || days < 1) return [];
  const latestKey = getSiteDateKey(articles[0].data.publishedAt);
  const firstDay = new Date(`${latestKey}T00:00:00Z`);
  firstDay.setUTCDate(firstDay.getUTCDate() - (days - 1));
  const firstKey = firstDay.toISOString().slice(0, 10);
  return articles.filter((article) => {
    const key = getSiteDateKey(article.data.publishedAt);
    return key >= firstKey && key <= latestKey;
  });
}

export function groupArticlesByDay(articles: ArticleEntry[]): ArticleDateGroup[] {
  const groups = new Map<string, ArticleEntry[]>();

  for (const article of articles) {
    const key = getSiteDateKey(article.data.publishedAt);
    const group = groups.get(key) ?? [];
    group.push(article);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([key, groupedArticles]) => ({
    key,
    label: new Intl.DateTimeFormat(siteConfig.site.locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: siteConfig.site.timezone
    }).format(groupedArticles[0].data.publishedAt),
    articles: groupedArticles
  }));
}

export function groupArticlesByMonth(articles: ArticleEntry[]): ArticleDateGroup[] {
  const groups = new Map<string, ArticleEntry[]>();

  for (const article of articles) {
    const key = getSiteMonthKey(article.data.publishedAt);
    const group = groups.get(key) ?? [];
    group.push(article);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([key, groupedArticles]) => ({
    key,
    label: new Intl.DateTimeFormat(siteConfig.site.locale, {
      year: "numeric",
      month: "long",
      timeZone: siteConfig.site.timezone
    }).format(groupedArticles[0].data.publishedAt),
    articles: groupedArticles
  }));
}

export function getActiveArticleCategories(
  articles: ArticleEntry[],
  limit = 6
): ActiveArticleCategory[] {
  const categories = new Map<string, { count: number; latestAt: Date }>();

  for (const article of articles) {
    const current = categories.get(article.data.category);
    categories.set(article.data.category, {
      count: (current?.count ?? 0) + 1,
      latestAt: current?.latestAt ?? article.data.publishedAt
    });
  }

  return [...categories.entries()]
    .map(([slug, value]) => ({
      slug,
      label: categoryLabels[slug] ?? slug,
      count: value.count,
      latestAt: value.latestAt
    }))
    .sort(
      (a, b) =>
        b.count - a.count || b.latestAt.getTime() - a.latestAt.getTime()
    )
    .slice(0, limit);
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
  policy: "Policy",
  web: "Web",
  media: "Media",
  culture: "Culture",
  community: "Community"
};

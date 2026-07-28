import demoEdition from "../../tests/fixtures/2026-07-28.json";

export type EvidenceLabel =
  | "officially_stated"
  | "maintainer_confirmed"
  | "multiple_users_report"
  | "single_community_test"
  | "community_discussion_suggests"
  | "not_independently_verified";

export interface DailySource {
  id: string;
  name: string;
  tier: "A" | "B" | "C";
  url: string;
  publishedAt: string;
  updatedAt: string | null;
  sourceLanguage: string;
  evidenceLabel: EvidenceLabel;
}

export interface DailyStory {
  id: string;
  eventId: string;
  position: number;
  kind: "news" | "community";
  highlight: boolean;
  region: "global" | "china" | "north-america" | "europe" | "asia-pacific" | "other";
  category: string;
  topics: string[];
  company: string | null;
  ecosystem: string;
  openSource: boolean;
  mediaOnly: boolean;
  imageId?: string | null;
  headline: string;
  summary: string;
  whyItMatters: string;
  source: DailySource;
  score: { total: number };
}

export interface DailyEdition {
  schemaVersion: number;
  language: "en";
  edition: "global";
  editionDate: string;
  timezone: "Asia/Shanghai";
  cutoffAt: string;
  generatedAt: string;
  runId: string;
  title: string;
  description: string;
  heroImageId?: string | null;
  dailyAnalysis: {
    title: string;
    body: string;
    signalIds: string[];
  };
  stories: DailyStory[];
  research: {
    collectedUrls: string[];
    unavailableSources: string[];
    warnings: string[];
  };
}

const productionModules = import.meta.glob<DailyEdition>(
  "/src/content/daily/*.json",
  { eager: true, import: "default" }
);

const productionEditions = Object.values(productionModules);
const editions = (
  productionEditions.length > 0
    ? productionEditions
    : [demoEdition as DailyEdition]
).sort((a, b) => b.editionDate.localeCompare(a.editionDate));

export function getEditions() {
  return editions;
}

export function getLatestEdition() {
  return editions[0];
}

export function getEdition(date: string) {
  return editions.find((edition) => edition.editionDate === date);
}

export function getAllTopics() {
  const topics = new Set<string>();
  for (const edition of editions) {
    for (const story of edition.stories) {
      topics.add(story.category);
    }
  }
  return [...topics].sort();
}

export function getStoriesByTopic(topic: string) {
  return editions.flatMap((edition) =>
    edition.stories
      .filter((story) => story.category === topic || story.topics.includes(topic))
      .map((story) => ({ edition, story }))
  );
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options
  }).format(new Date(`${date}T00:00:00+08:00`));
}

export function readingMinutes(edition: DailyEdition) {
  const words = [
    edition.dailyAnalysis.body,
    ...edition.stories.flatMap((story) => [
      story.summary,
      story.whyItMatters
    ])
  ].join(" ").trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(3, Math.ceil(words / 220));
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
  community: "Community"
};

export const evidenceLabels: Record<EvidenceLabel, string> = {
  officially_stated: "Official statement",
  maintainer_confirmed: "Maintainer confirmed",
  multiple_users_report: "Multiple user reports",
  single_community_test: "Single community test",
  community_discussion_suggests: "Early community signal",
  not_independently_verified: "Not independently verified"
};

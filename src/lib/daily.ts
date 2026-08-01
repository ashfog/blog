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
  url: string;
  publishedAt: string;
  updatedAt: string | null;
  sourceLanguage: string;
  evidenceLabel: EvidenceLabel;
}

export interface CommunityVoice {
  summary: string;
  source: DailySource;
}

export interface DailySignal {
  id: string;
  eventId: string;
  position: number;
  origin: "news" | "community";
  region: "global" | "china" | "north-america" | "europe" | "asia-pacific" | "other";
  category: string;
  topics: string[];
  openSource: boolean;
  imageId?: string | null;
  headline: string;
  brief: string;
  source: DailySource;
  communityVoices: CommunityVoice[];
}

export interface ArticleSection {
  id: string;
  position: number;
  kicker: string;
  title: string;
  body: string;
  signalIds: string[];
}

export interface DailyEdition {
  schemaVersion: 3;
  language: "en";
  edition: "global";
  editionDate: string;
  timezone: "America/New_York";
  windowStartAt: string;
  cutoffAt: string;
  generatedAt: string;
  runId: string;
  title: string;
  description: string;
  heroImageId?: string | null;
  article: {
    synthesis: {
      title: string;
      body: string;
      signalIds: string[];
    };
    sections: ArticleSection[];
    otherSignalIds: string[];
  };
  signals: DailySignal[];
  research: {
    sourceScan: Array<{
      sourceId: string;
      status: "collected" | "empty" | "unavailable" | "not-run";
    }>;
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
    for (const signal of edition.signals) topics.add(signal.category);
  }
  return [...topics].sort();
}

export function getStoriesByTopic(topic: string) {
  return editions.flatMap((edition) =>
    edition.signals
      .filter((signal) => signal.category === topic || signal.topics.includes(topic))
      .map((signal) => ({ edition, story: signal }))
  );
}

export function getSignalMap(edition: DailyEdition) {
  return new Map(edition.signals.map((signal) => [signal.id, signal]));
}

export function getSectionSignals(edition: DailyEdition, section: ArticleSection) {
  const signals = getSignalMap(edition);
  return section.signalIds.flatMap((id) => {
    const signal = signals.get(id);
    return signal ? [signal] : [];
  });
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
    ...options
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function readingMinutes(edition: DailyEdition) {
  const words = [
    edition.article.synthesis.body,
    ...edition.article.sections.map((section) => section.body),
    ...edition.article.otherSignalIds.flatMap((id) => {
      const signal = edition.signals.find((candidate) => candidate.id === id);
      return signal ? [signal.brief] : [];
    })
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

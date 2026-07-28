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
  evidenceLabel: EvidenceLabel;
}

export interface DailyStory {
  id: string;
  eventId: string;
  position: number;
  kind: "news" | "community";
  highlight: boolean;
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
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options
  }).format(new Date(`${date}T00:00:00+08:00`));
}

export function readingMinutes(edition: DailyEdition) {
  const characters = [
    edition.dailyAnalysis.body,
    ...edition.stories.flatMap((story) => [
      story.summary,
      story.whyItMatters
    ])
  ].join("").length;
  return Math.max(4, Math.round(characters / 420));
}

export const categoryLabels: Record<string, string> = {
  models: "模型",
  agents: "智能体",
  "open-source": "开源",
  "developer-tools": "开发工具",
  infrastructure: "基础设施",
  research: "研究",
  hardware: "硬件",
  security: "安全",
  policy: "政策",
  community: "社区"
};

export const evidenceLabels: Record<EvidenceLabel, string> = {
  officially_stated: "官方发布",
  maintainer_confirmed: "维护者确认",
  multiple_users_report: "多位用户报告",
  single_community_test: "单次社区测试",
  community_discussion_suggests: "社区早期信号",
  not_independently_verified: "尚未独立验证"
};

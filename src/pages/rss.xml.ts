import rss from "@astrojs/rss";
import { getEditions } from "../lib/daily";

export async function GET(context: { site: URL }) {
  const editions = getEditions();

  return rss({
    title: "AshFog Daily",
    description: "每天一份经过来源核验的 AI、开源与开发者生态要点。",
    site: context.site,
    items: editions.map((edition) => ({
      title: edition.title,
      description: edition.description,
      pubDate: new Date(edition.generatedAt),
      link: `/daily/${edition.editionDate}`
    })),
    customData: "<language>zh-CN</language>"
  });
}

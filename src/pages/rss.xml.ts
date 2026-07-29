import rss from "@astrojs/rss";
import { getEditions } from "../lib/daily";

export async function GET(context: { site: URL }) {
  const editions = getEditions();

  return rss({
    title: "ASHFOG Daily",
    description: "A source-linked global briefing on AI, open source, developer tools, infrastructure, research, and policy.",
    site: context.site,
    items: editions.map((edition) => ({
      title: edition.title,
      description: edition.description,
      pubDate: new Date(edition.generatedAt),
      link: `/daily/${edition.editionDate}`
    })),
    customData: "<language>en</language>"
  });
}

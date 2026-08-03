import rss from "@astrojs/rss";
import { getArticles } from "../lib/articles";

export async function GET(context: { site: URL }) {
  const articles = await getArticles();
  return rss({
    title: "ASHFOG Articles",
    description: "Independent, source-linked articles about AI models, systems, tools, open source, and research.",
    site: context.site,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.publishedAt,
      link: `/articles/${article.id}`,
      categories: [article.data.category, ...article.data.tags]
    })),
    customData: "<language>en</language>"
  });
}

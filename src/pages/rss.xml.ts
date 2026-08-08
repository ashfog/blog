import rss from "@astrojs/rss";
import { getArticleSlug, getArticles } from "../lib/articles";
import { siteConfig } from "../config/site";

export async function GET(context: { site: URL }) {
  const articles = await getArticles();
  return rss({
    title: `${siteConfig.site.name} Articles`,
    description: siteConfig.site.description,
    site: context.site,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.publishedAt,
      link: `/articles/${getArticleSlug(article)}`,
      categories: [article.data.category, ...article.data.tags]
    })),
    customData: `<language>${siteConfig.site.language}</language>`
  });
}

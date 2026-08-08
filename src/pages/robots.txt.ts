import type { APIRoute } from "astro";
import { siteUrl } from "../config/site";

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? siteUrl;
  const sitemap = new URL("/sitemap-index.xml", origin);
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${sitemap.href}`,
    ""
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
};

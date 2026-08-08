import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { readFileSync } from "node:fs";

const siteConfig = JSON.parse(
  readFileSync(new URL("./site.config.json", import.meta.url), "utf8")
);

export default defineConfig({
  site: siteConfig.site.url,
  output: "static",
  trailingSlash: "never",
  integrations: [
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return pathname !== "/search" && !pathname.startsWith("/daily");
      }
    })
  ],
  redirects: {
    "/daily": "/articles"
  },
  vite: {
    build: {
      cssMinify: true
    }
  }
});

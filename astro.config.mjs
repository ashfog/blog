import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://ashfog.com",
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

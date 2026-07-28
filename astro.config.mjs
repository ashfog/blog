import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://ashfog.com",
  output: "static",
  trailingSlash: "never",
  integrations: [sitemap()],
  vite: {
    build: {
      cssMinify: true
    }
  }
});

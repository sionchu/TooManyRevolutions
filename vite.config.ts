import { sites } from "@openai/sites-vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), sites()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        worldAssetGallery: "world-asset-gallery.html",
      },
    },
  },
});

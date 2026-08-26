import { sites } from "@openai/sites-vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), sites()],
  build: {
    outDir: mode === "r3f" ? "dist-benchmark/r3f" : "dist-benchmark/pixi",
    emptyOutDir: true,
    rollupOptions: {
      input: mode === "r3f" ? "benchmarks/r3f.html" : "benchmarks/pixi.html",
    },
  },
}));

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const serverDirectory = resolve("dist", "server");
const serverEntry = `const ASSET_BINDING = "ASSETS";

export default {
  async fetch(request, env) {
    const assets = env[ASSET_BINDING];
    if (assets === undefined || typeof assets.fetch !== "function") {
      return new Response("Sites asset binding is unavailable.", { status: 500 });
    }

    const response = await assets.fetch(request);
    if (response.status === 404 && request.method === "GET") {
      return assets.fetch(new Request(new URL("/", request.url), request));
    }
    return response;
  },
};
`;

await mkdir(serverDirectory, { recursive: true });
await writeFile(resolve(serverDirectory, "index.js"), serverEntry, "utf8");

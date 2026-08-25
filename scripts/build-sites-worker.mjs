import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const serverDirectory = resolve("dist", "server");
const serverEntry = `const ASSET_BINDING = "ASSETS";

function requestWithPath(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

async function fetchSiteAsset(request, assets) {
  const direct = await assets.fetch(request);
  if (direct.status !== 404 || request.method !== "GET") {
    return direct;
  }

  // Sites may expose the uploaded Vite artifact with either the artifact root
  // or its canonical dist/ prefix. Try the latter only after the normal
  // Workers Assets lookup so both layouts remain valid.
  const pathname = new URL(request.url).pathname.replace(/^\\/+/, "");
  const prefixedPath = pathname.length > 0 ? \`/dist/\${pathname}\` : "/dist/index.html";
  return assets.fetch(requestWithPath(request, prefixedPath));
}

export default {
  async fetch(request, env) {
    const assets = env[ASSET_BINDING];
    if (assets === undefined || typeof assets.fetch !== "function") {
      return new Response("Sites asset binding is unavailable.", { status: 500 });
    }

    const response = await fetchSiteAsset(request, assets);
    if (response.status === 404 && request.method === "GET") {
      return fetchSiteAsset(requestWithPath(request, "/index.html"), assets);
    }
    return response;
  },
};
`;

await mkdir(serverDirectory, { recursive: true });
await writeFile(resolve(serverDirectory, "index.js"), serverEntry, "utf8");

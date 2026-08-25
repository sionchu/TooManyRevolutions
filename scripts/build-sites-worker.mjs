import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const serverDirectory = resolve("dist", "server");
const assetDirectory = resolve("dist", "assets");
const assetNames = [
  "index.html",
  ...(await readdir(assetDirectory)).map((name) => `assets/${name}`),
];
const embeddedAssets = Object.fromEntries(
  await Promise.all(
    assetNames.map(async (name) => {
      const body = await readFile(resolve("dist", name), "utf8");
      const contentType = name.endsWith(".html")
        ? "text/html; charset=utf-8"
        : name.endsWith(".css")
          ? "text/css; charset=utf-8"
          : "text/javascript; charset=utf-8";
      return [`/${name}`, { body, contentType }];
    }),
  ),
);
const embeddedAssetsSource = JSON.stringify(embeddedAssets);
const serverEntry = `const ASSET_BINDING = "ASSETS";
const EMBEDDED_ASSETS = ${embeddedAssetsSource};

function requestWithPath(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

function embeddedResponse(request) {
  if (request.method !== "GET") {
    return null;
  }
  const url = new URL(request.url);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const asset = EMBEDDED_ASSETS[pathname];
  return asset === undefined
    ? null
    : new Response(asset.body, {
        headers: {
          "cache-control": pathname === "/index.html" ? "no-cache" : "public, max-age=31536000, immutable",
          "content-type": asset.contentType,
        },
      });
}

async function fetchSiteAsset(request, assets) {
  if (assets !== undefined && typeof assets.fetch === "function") {
    const direct = await assets.fetch(request);
    if (direct.status !== 404 || request.method !== "GET") {
      return direct;
    }

    const embedded = embeddedResponse(request);
    if (embedded !== null) {
      return embedded;
    }

    // Sites may expose the uploaded Vite artifact with either the artifact root
    // or its canonical dist/ prefix. Try the latter only after the normal
    // Workers Assets lookup so both layouts remain valid.
    const pathname = new URL(request.url).pathname.replace(/^\\/+/, "");
    const prefixedPath = pathname.length > 0 ? \`/dist/\${pathname}\` : "/dist/index.html";
    return assets.fetch(requestWithPath(request, prefixedPath));
  }

  return embeddedResponse(request) ?? new Response("Not found", { status: 404 });
}

export default {
  async fetch(request, env) {
    const assets = env[ASSET_BINDING];
    return fetchSiteAsset(request, assets);
  },
};
`;

await mkdir(serverDirectory, { recursive: true });
await writeFile(resolve(serverDirectory, "index.js"), serverEntry, "utf8");

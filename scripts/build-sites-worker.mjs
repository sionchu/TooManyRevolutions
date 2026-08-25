import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const serverDirectory = resolve("dist", "server");
const assetDirectory = resolve("dist", "assets");
async function collectAssetFiles(directory, relativePrefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = relativePrefix
      ? `${relativePrefix}/${entry.name}`
      : entry.name;
    const absolutePath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectAssetFiles(absolutePath, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

const assetNames = [
  "index.html",
  ...(await collectAssetFiles(assetDirectory)).map((name) => `assets/${name}`),
];

function contentTypeFor(name) {
  if (name.endsWith(".html")) return "text/html; charset=utf-8";
  if (name.endsWith(".css")) return "text/css; charset=utf-8";
  if (name.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (name.endsWith(".json")) return "application/json; charset=utf-8";
  if (name.endsWith(".svg")) return "image/svg+xml";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

async function readEmbeddedAsset(name) {
  const bytes = await readFile(resolve("dist", name));
  const contentType = contentTypeFor(name);
  const isText =
    contentType.startsWith("text/") ||
    contentType.startsWith("application/json");

  return {
    body: isText ? bytes.toString("utf8") : bytes.toString("base64"),
    contentType,
    ...(isText ? {} : { encoding: "base64" }),
  };
}

const embeddedAssets = Object.fromEntries(
  await Promise.all(
    assetNames.map(async (name) => [`/${name}`, await readEmbeddedAsset(name)]),
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
    : new Response(
        asset.encoding === "base64"
          ? Uint8Array.from(atob(asset.body), (character) =>
              character.charCodeAt(0),
            )
          : asset.body,
        {
        headers: {
          "cache-control": pathname === "/index.html" ? "no-cache" : "public, max-age=31536000, immutable",
          "content-type": asset.contentType,
        },
        },
      );
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

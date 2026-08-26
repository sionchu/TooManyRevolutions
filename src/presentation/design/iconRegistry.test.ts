import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  assertIconRegistryIntegrity,
  TMR_ICON_REGISTRY,
  TMR_ICON_SIZES,
  validateIconSvgAsset,
} from "./iconRegistry";

const availableAssetPaths = new Set(
  TMR_ICON_REGISTRY.map((icon) => icon.assetPath).filter((assetPath) =>
    existsSync(resolve(process.cwd(), "public", assetPath.slice(1))),
  ),
);

describe("TMR semantic icon registry", () => {
  it("contains the complete small core set with valid channels and provenance", () => {
    assertIconRegistryIntegrity({ availableAssetPaths });
    expect(TMR_ICON_REGISTRY).toHaveLength(42);
    expect(
      new Set(TMR_ICON_REGISTRY.map((icon) => icon.semanticRole)).size,
    ).toBe(5);
    expect(
      TMR_ICON_REGISTRY.every(
        (icon) =>
          icon.provenance.sourceType === "CUSTOM_SVG" &&
          icon.provenance.license.includes("no external asset"),
      ),
    ).toBe(true);
    expect(TMR_ICON_SIZES).toEqual([16, 20, 24, 32, 48]);
  });

  it("rejects duplicate semantic IDs and duplicate asset paths", () => {
    const first = TMR_ICON_REGISTRY[0]!;
    expect(() =>
      assertIconRegistryIntegrity({ icons: [first, first] }),
    ).toThrow("Icon ID repeats");

    const duplicatePath = {
      ...TMR_ICON_REGISTRY[1]!,
      assetPath: first.assetPath,
    };
    expect(() =>
      assertIconRegistryIntegrity({
        icons: [first, duplicatePath],
      }),
    ).toThrow("Icon asset path repeats");
  });

  it("rejects missing assets and keeps every registered SVG parseable", () => {
    expect(() =>
      assertIconRegistryIntegrity({
        availableAssetPaths: new Set(),
      }),
    ).toThrow("file is missing");

    for (const icon of TMR_ICON_REGISTRY) {
      const filePath = resolve(
        process.cwd(),
        "public",
        icon.assetPath.slice(1),
      );
      const markup = readFileSync(filePath, "utf8");
      expect(validateIconSvgAsset(markup), icon.id).toEqual([]);
      expect(markup).not.toMatch(/<(?:text|script|foreignObject)\b/i);
      expect(markup).toMatch(/\b(?:stroke|fill)=["']#27211d["']/i);
    }
  });

  it("rejects malformed or text-dependent SVG content", () => {
    expect(validateIconSvgAsset('<svg viewBox="0 0 24 24"></svg>')).toContain(
      "SVG has no vector geometry.",
    );
    expect(
      validateIconSvgAsset('<svg viewBox="0 0 24 24"><text>!</text></svg>'),
    ).toContain("SVG contains disallowed text or executable content.");
  });
});

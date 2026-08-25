import { getAssetPath } from "../presentation/design/assetManifest";

export function BrandMark({ compact = false }: { readonly compact?: boolean }) {
  return (
    <img
      className={compact ? "brand-mark brand-mark-compact" : "brand-mark"}
      src={getAssetPath("tmr.brand.logo.primary")}
      alt="아르켄 왕국 문장"
      data-asset-id="tmr.brand.logo.primary"
    />
  );
}

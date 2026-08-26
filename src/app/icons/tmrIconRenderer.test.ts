import { describe, expect, it } from "vitest";

import { TMR_ICON_IDS } from "../../presentation/design/iconRegistry";
import {
  getTmrIconRenderStyle,
  TMR_ICON_TONE_CSS_VARIABLES,
} from "./tmrIconRenderer";

describe("TMR theme-safe icon renderer", () => {
  it("uses a registry asset as a currentColor CSS mask", () => {
    const style = getTmrIconRenderStyle({
      assetPath: "/assets/tmr/icons/capital.svg",
      size: 16,
      tone: "neutral",
    });

    expect(style.backgroundColor).toBe("currentColor");
    expect(style.color).toBe("var(--tmr-icon-color, currentColor)");
    expect(style.maskImage).toBe('url("/assets/tmr/icons/capital.svg")');
    expect(style.WebkitMaskImage).toBe(style.maskImage);
    expect(style.maskSize).toBe("contain");
  });

  it("keeps crisis tone separate from the crisis silhouette", () => {
    const style = getTmrIconRenderStyle({
      assetPath: "/assets/tmr/icons/rebellion.svg",
      size: 24,
      tone: "crisis",
    });

    expect(style.color).toBe(
      `var(${TMR_ICON_TONE_CSS_VARIABLES.crisis}, currentColor)`,
    );
    expect(TMR_ICON_IDS.crisis.rebellion).toBe("tmr.icon.crisis.rebellion");
  });
});

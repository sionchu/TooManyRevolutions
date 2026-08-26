import type { CSSProperties } from "react";

import type { TmrIconSize } from "../../presentation/design/iconRegistry";

export type TmrIconTone = "neutral" | "accent" | "crisis" | "inverse";

export const TMR_ICON_TONE_CSS_VARIABLES = {
  neutral: "--tmr-icon-color",
  accent: "--tmr-icon-color-accent",
  crisis: "--tmr-icon-color-crisis",
  inverse: "--tmr-icon-color-inverse",
} as const satisfies Readonly<Record<TmrIconTone, `--${string}`>>;

export interface TmrIconRenderStyleOptions {
  readonly assetPath: string;
  readonly size: TmrIconSize;
  readonly tone: TmrIconTone;
}

/**
 * Render a registry SVG as a CSS mask so its authored ink is not a theme
 * constraint. The surface supplies the semantic color through currentColor
 * or one of the documented --tmr-icon-color-* variables.
 */
export function getTmrIconRenderStyle({
  assetPath,
  size,
  tone,
}: TmrIconRenderStyleOptions): CSSProperties {
  const maskImage = `url("${assetPath}")`;
  return {
    display: "inline-block",
    flex: "0 0 auto",
    width: `${size}px`,
    height: `${size}px`,
    color: `var(${TMR_ICON_TONE_CSS_VARIABLES[tone]}, currentColor)`,
    backgroundColor: "currentColor",
    maskImage,
    maskRepeat: "no-repeat",
    maskPosition: "center",
    maskSize: "contain",
    WebkitMaskImage: maskImage,
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    WebkitMaskSize: "contain",
  };
}

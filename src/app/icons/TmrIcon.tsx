import type { CSSProperties, HTMLAttributes } from "react";

import {
  getIconDefinition,
  type TmrIconId,
  type TmrIconSize,
} from "../../presentation/design/iconRegistry";
import { getTmrIconRenderStyle, type TmrIconTone } from "./tmrIconRenderer";

export interface TmrIconProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "aria-hidden" | "aria-label" | "height" | "role" | "width"
> {
  readonly iconId: TmrIconId;
  readonly size?: TmrIconSize;
  readonly decorative?: boolean;
  readonly tone?: TmrIconTone;
}

export function TmrIcon({
  iconId,
  size,
  decorative = false,
  tone = "neutral",
  className,
  style,
  ...spanProps
}: TmrIconProps) {
  const definition = getIconDefinition(iconId);
  const resolvedSize = size ?? definition.defaultSize;
  const iconStyle: CSSProperties = {
    ...getTmrIconRenderStyle({
      assetPath: definition.assetPath,
      size: resolvedSize,
      tone,
    }),
    ...style,
  };

  return (
    <span
      {...spanProps}
      className={className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : definition.ariaLabel}
      aria-hidden={decorative ? true : undefined}
      data-icon-id={definition.id}
      data-icon-role={definition.semanticRole}
      data-icon-tone={tone}
      data-icon-renderer="css-mask"
      style={iconStyle}
    />
  );
}

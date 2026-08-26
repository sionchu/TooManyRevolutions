import type { CSSProperties, ImgHTMLAttributes } from "react";

import {
  getIconDefinition,
  type TmrIconId,
  type TmrIconSize,
} from "../../presentation/design/iconRegistry";

export interface TmrIconProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "alt" | "aria-hidden" | "height" | "src" | "width"
> {
  readonly iconId: TmrIconId;
  readonly size?: TmrIconSize;
  readonly decorative?: boolean;
}

export function TmrIcon({
  iconId,
  size,
  decorative = false,
  className,
  style,
  ...imageProps
}: TmrIconProps) {
  const definition = getIconDefinition(iconId);
  const resolvedSize = size ?? definition.defaultSize;
  const iconStyle: CSSProperties = {
    display: "inline-block",
    flex: "0 0 auto",
    height: `${resolvedSize}px`,
    width: `${resolvedSize}px`,
    ...style,
  };

  return (
    <img
      {...imageProps}
      className={className}
      src={definition.assetPath}
      alt={decorative ? "" : definition.ariaLabel}
      aria-hidden={decorative ? true : undefined}
      width={resolvedSize}
      height={resolvedSize}
      decoding="async"
      data-icon-id={definition.id}
      data-icon-role={definition.semanticRole}
      style={iconStyle}
    />
  );
}

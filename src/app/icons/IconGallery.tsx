import {
  TMR_ICON_REGISTRY,
  TMR_ICON_SIZES,
  type IconDefinition,
  type TmrIconId,
  type TmrIconSemanticRole,
  type TmrIconSize,
} from "../../presentation/design/iconRegistry";
import { TmrIcon } from "./TmrIcon";

const ROLE_ORDER: readonly TmrIconSemanticRole[] = [
  "map-place",
  "politics",
  "crisis",
  "activity",
  "ui",
];

const ROLE_LABELS: Record<TmrIconSemanticRole, string> = {
  "map-place": "지도 / 장소",
  politics: "정치",
  crisis: "위기",
  activity: "활동",
  ui: "UI",
};

const galleryStyles = {
  root: {
    background: "#fbf5e8",
    border: "1px solid #dfceb0",
    color: "#27211d",
    fontFamily: '"Noto Sans KR", "Segoe UI", system-ui, sans-serif',
    padding: "24px",
  },
  heading: {
    margin: "0 0 6px",
  },
  description: {
    color: "#6f6255",
    margin: "0 0 20px",
  },
  group: {
    borderTop: "1px solid #dfceb0",
    padding: "18px 0 0",
  },
  groupHeading: {
    fontSize: "0.9rem",
    letterSpacing: "0.08em",
    margin: "0 0 12px",
    textTransform: "uppercase" as const,
  },
  grid: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(176px, 1fr))",
  },
  item: {
    border: "1px solid #dfceb0",
    minWidth: 0,
    padding: "12px",
  },
  samples: {
    alignItems: "end",
    display: "flex",
    gap: "10px",
    minHeight: "52px",
  },
  sample: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  size: {
    color: "#6f6255",
    fontFamily: '"Cascadia Mono", Consolas, monospace',
    fontSize: "0.65rem",
  },
  label: {
    display: "block",
    fontWeight: 700,
    marginTop: "10px",
  },
  id: {
    color: "#6f6255",
    display: "block",
    fontFamily: '"Cascadia Mono", Consolas, monospace',
    fontSize: "0.68rem",
    marginTop: "4px",
    overflowWrap: "anywhere" as const,
  },
} as const;

export interface IconGalleryProps {
  readonly icons?: readonly IconDefinition[];
  readonly sizes?: readonly TmrIconSize[];
}

export function IconGallery({
  icons = TMR_ICON_REGISTRY,
  sizes = TMR_ICON_SIZES,
}: IconGalleryProps) {
  return (
    <section
      aria-label="TMR semantic icon gallery"
      data-icon-gallery="tmr"
      style={galleryStyles.root}
    >
      <h2 style={galleryStyles.heading}>TMR 시맨틱 아이콘 갤러리</h2>
      <p style={galleryStyles.description}>
        색에 의존하지 않는 프로젝트 작성 SVG 실루엣을 16, 20, 24, 32, 48픽셀로
        비교합니다.
      </p>
      {ROLE_ORDER.map((role) => {
        const roleIcons = icons.filter((icon) => icon.semanticRole === role);
        if (roleIcons.length === 0) return null;
        return (
          <section
            key={role}
            aria-labelledby={`tmr-icon-gallery-${role}`}
            data-icon-gallery-category={role}
            style={galleryStyles.group}
          >
            <h3
              id={`tmr-icon-gallery-${role}`}
              style={galleryStyles.groupHeading}
            >
              {ROLE_LABELS[role]}
            </h3>
            <div style={galleryStyles.grid}>
              {roleIcons.map((icon) => (
                <figure
                  key={icon.id}
                  data-icon-gallery-item={icon.id}
                  style={galleryStyles.item}
                >
                  <div style={galleryStyles.samples}>
                    {sizes.map((size) => (
                      <div
                        key={`${icon.id}-${size}`}
                        style={galleryStyles.sample}
                      >
                        <TmrIcon
                          iconId={icon.id as TmrIconId}
                          size={size}
                          decorative
                        />
                        <span style={galleryStyles.size}>{size}</span>
                      </div>
                    ))}
                  </div>
                  <figcaption>
                    <span style={galleryStyles.label}>{icon.ariaLabel}</span>
                    <code style={galleryStyles.id}>{icon.id}</code>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}

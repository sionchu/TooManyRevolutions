import type { ReactNode } from "react";

import {
  TMR_ICON_IDS,
  type TmrIconId,
} from "../presentation/design/iconRegistry";
import { TmrIcon } from "./icons/TmrIcon";

export type ContextPanel =
  "map" | "decisions" | "institutions" | "region" | "chronicle";

const CONTEXT_TABS = [
  { id: "map", label: "지도", note: "세계" },
  { id: "decisions", label: "결정", note: "지금" },
  { id: "institutions", label: "제도", note: "구조" },
  { id: "chronicle", label: "연대기", note: "흐름" },
] as const satisfies ReadonlyArray<{
  readonly id: Exclude<ContextPanel, "region">;
  readonly label: string;
  readonly note: string;
}>;

const CONTEXT_TAB_ICONS = {
  map: TMR_ICON_IDS.ui.map,
  decisions: TMR_ICON_IDS.ui.decision,
  institutions: TMR_ICON_IDS.ui.governance,
  chronicle: TMR_ICON_IDS.ui.chronicle,
} as const satisfies Record<Exclude<ContextPanel, "region">, TmrIconId>;

const PANEL_TITLES: Readonly<Record<Exclude<ContextPanel, "map">, string>> = {
  decisions: "지금 결정할 일",
  institutions: "제도망",
  region: "지역 상세",
  chronicle: "국가 연대기",
};

const FULL_SURFACES = new Set<ContextPanel>(["institutions", "chronicle"]);

function selectedTab(
  activePanel: ContextPanel,
  tabId: Exclude<ContextPanel, "region">,
): boolean {
  if (activePanel === "region") return tabId === "map";
  return activePanel === tabId;
}

export function ContextualDock({
  activePanel,
  onSelectPanel,
  onClose,
  children,
}: {
  readonly activePanel: ContextPanel;
  readonly onSelectPanel: (panel: ContextPanel) => void;
  readonly onClose: () => void;
  readonly children?: ReactNode;
}) {
  const drawerOpen = activePanel === "decisions" || activePanel === "region";
  const fullSurfaceOpen = FULL_SURFACES.has(activePanel);
  const fullSurfaceTitle =
    activePanel === "institutions"
      ? PANEL_TITLES.institutions
      : activePanel === "chronicle"
        ? PANEL_TITLES.chronicle
        : undefined;

  return (
    <>
      <nav
        className={`context-tabs${fullSurfaceOpen ? " context-tabs-in-surface" : ""}`}
        aria-label="게임 주요 화면"
        data-active-surface={activePanel}
      >
        {CONTEXT_TABS.map((tab) => {
          const isSelected = selectedTab(activePanel, tab.id);
          return (
            <button
              key={tab.id}
              className={isSelected ? "context-tab active" : "context-tab"}
              type="button"
              aria-current={isSelected ? "page" : undefined}
              aria-pressed={isSelected}
              data-context-panel={tab.id}
              onClick={() => onSelectPanel(tab.id)}
            >
              <TmrIcon
                className="context-tab-icon"
                iconId={CONTEXT_TAB_ICONS[tab.id]}
                size={20}
                decorative
                tone={isSelected ? "inverse" : "neutral"}
              />
              <span className="context-tab-copy">
                <strong>{tab.label}</strong>
                <small>{tab.note}</small>
              </span>
            </button>
          );
        })}
      </nav>

      {fullSurfaceOpen ? (
        <section
          className={`surface-mode surface-mode-${activePanel}`}
          data-context-surface={activePanel}
          aria-label={fullSurfaceTitle}
        >
          <button
            className="surface-mode-close"
            type="button"
            aria-label="지도로 돌아가기"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
            <span>지도로 돌아가기</span>
          </button>
          <div className="surface-mode-content">{children}</div>
        </section>
      ) : null}

      {drawerOpen ? (
        <aside
          className="contextual-drawer"
          data-context-panel={activePanel}
          aria-label={PANEL_TITLES[activePanel]}
        >
          <div className="drawer-heading">
            <div className="drawer-heading-title">
              <TmrIcon
                iconId={TMR_ICON_IDS.ui.details}
                size={20}
                decorative
                tone="neutral"
              />
              <div>
                <span className="eyebrow">지도에서 호출한 정보</span>
                <h2>{PANEL_TITLES[activePanel]}</h2>
              </div>
            </div>
            <button
              className="drawer-close"
              type="button"
              aria-label="상세 패널 닫기"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
          <div className="drawer-content">{children}</div>
        </aside>
      ) : null}
    </>
  );
}

import type { ReactNode } from "react";

import {
  TMR_ICON_IDS,
  type TmrIconId,
} from "../presentation/design/iconRegistry";
import { TmrIcon } from "./icons/TmrIcon";

export type ContextPanel =
  "map" | "agenda" | "decisions" | "region" | "chronicle";

const CONTEXT_TABS = [
  { id: "map", label: "지도" },
  { id: "agenda", label: "국정" },
  { id: "decisions", label: "결정" },
  { id: "chronicle", label: "기록" },
] as const satisfies ReadonlyArray<{
  readonly id: Exclude<ContextPanel, "region">;
  readonly label: string;
}>;

const CONTEXT_TAB_ICONS = {
  map: TMR_ICON_IDS.ui.map,
  agenda: TMR_ICON_IDS.ui.governance,
  decisions: TMR_ICON_IDS.ui.decision,
  chronicle: TMR_ICON_IDS.ui.chronicle,
} as const satisfies Record<Exclude<ContextPanel, "region">, TmrIconId>;

const PANEL_TITLES: Readonly<Record<Exclude<ContextPanel, "map">, string>> = {
  agenda: "현재 국정",
  decisions: "결정 테이블",
  region: "지역 상세",
  chronicle: "국가 기록",
};

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
  const drawerOpen = activePanel !== "map";

  return (
    <>
      <nav className="context-tabs" aria-label="지도 주변 정보">
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
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

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

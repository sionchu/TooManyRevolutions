import type { RunRecord } from "../sim/core/step";
import type { Country } from "../sim/state/country";
import {
  PLAYER_COPY,
  PRODUCT_IDENTITY,
} from "../presentation/design/copyRegistry.ko";
import { TMR_ICON_IDS } from "../presentation/design/iconRegistry";
import { BrandMark } from "./BrandMark";
import { formatDate } from "./gamePresentation";
import { TmrIcon } from "./icons/TmrIcon";

export function GameHeader({
  playerCountry,
  date,
  tick,
  soundEnabled,
  onToggleSound,
  onReset,
}: {
  readonly playerCountry: Country | undefined;
  readonly date: RunRecord["world"]["date"];
  readonly tick: number;
  readonly soundEnabled: boolean;
  readonly onToggleSound: () => void;
  readonly onReset: () => void;
}) {
  return (
    <header className="game-header">
      <div className="brand-lockup">
        <BrandMark compact />
        <div>
          <p className="eyebrow">{PLAYER_COPY.main.continuity}</p>
          <h1>{PRODUCT_IDENTITY.koTitle}</h1>
        </div>
      </div>
      <div className="run-meta">
        <strong>{playerCountry?.name ?? "아르켄 왕국"}</strong>
        <span>
          {formatDate(date)} · {tick}일차
        </span>
      </div>
      <div className="header-actions">
        <button
          className="quiet-button"
          type="button"
          aria-pressed={soundEnabled}
          onClick={onToggleSound}
        >
          <TmrIcon
            iconId={TMR_ICON_IDS.ui.audio}
            size={20}
            decorative
            tone={soundEnabled ? "accent" : "neutral"}
          />
          소리 {soundEnabled ? "켜짐" : "꺼짐"}
        </button>
        <button className="quiet-button" type="button" onClick={onReset}>
          타이틀로
        </button>
      </div>
    </header>
  );
}

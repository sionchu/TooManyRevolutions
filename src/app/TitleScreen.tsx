import { useState } from "react";

import { getAssetPath } from "../presentation/design/assetManifest";
import {
  PLAYER_COPY,
  PRODUCT_IDENTITY,
} from "../presentation/design/copyRegistry.ko";
import { BrandMark } from "./BrandMark";

export function TitleScreen({ onStart }: { readonly onStart: () => void }) {
  const [showWorldNote, setShowWorldNote] = useState(false);

  return (
    <main className="title-shell" data-screen-id="tmr.screen.title">
      <div
        className="title-hero-art"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${getAssetPath("tmr.asset.title.hero.arken-crisis.v1")})`,
        }}
        data-asset-id="tmr.asset.title.hero.arken-crisis.v1"
      />
      <div className="title-grain" aria-hidden="true" />
      <div className="title-content">
        <BrandMark />
        <p className="eyebrow">{PLAYER_COPY.title.eyebrow}</p>
        <p className="title-kicker">{PRODUCT_IDENTITY.enTitle}</p>
        <h1>{PRODUCT_IDENTITY.koTitle}</h1>
        <p className="title-tagline">{PRODUCT_IDENTITY.tagline}</p>
        <p className="title-copy">{PLAYER_COPY.title.hook}</p>
        <div className="title-actions">
          <button
            className="primary-button title-start"
            type="button"
            onClick={onStart}
          >
            {PLAYER_COPY.title.action} <span aria-hidden="true">→</span>
          </button>
          <button
            aria-expanded={showWorldNote}
            className="title-secondary"
            type="button"
            onClick={() => setShowWorldNote((visible) => !visible)}
          >
            {PLAYER_COPY.title.secondary}
          </button>
        </div>
        {showWorldNote ? (
          <aside className="title-world-note" aria-live="polite">
            <span className="eyebrow">{PLAYER_COPY.title.worldNoteTitle}</span>
            <p>{PLAYER_COPY.title.worldNote}</p>
          </aside>
        ) : null}
        <div className="title-rule" />
        <p className="title-footnote">{PLAYER_COPY.title.footer}</p>
      </div>
      <p className="title-asset-note">1897 · 헌정 위기 기록 제1호</p>
    </main>
  );
}

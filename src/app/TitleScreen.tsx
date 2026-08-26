import { useState } from "react";

import { getAssetPath } from "../presentation/design/assetManifest";
import { getGameBuildersTitleContent } from "../presentation/design/playerContent";
import { BrandMark } from "./BrandMark";

export function TitleScreen({ onStart }: { readonly onStart: () => void }) {
  const [showWorldNote, setShowWorldNote] = useState(false);
  const content = getGameBuildersTitleContent();

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
        <p className="eyebrow" data-content-id="tmr.copy.title.eyebrow">
          {content.eyebrow}
        </p>
        <p className="title-kicker" data-content-id="tmr.copy.title.en">
          {content.enTitle}
        </p>
        <h1 data-content-id="tmr.copy.title.ko">{content.koTitle}</h1>
        <p className="title-tagline" data-content-id="tmr.copy.title.tagline">
          {content.tagline}
        </p>
        <p className="title-copy" data-content-id="tmr.copy.title.hook">
          {content.hook}
        </p>
        <div className="title-actions">
          <button
            className="primary-button title-start"
            type="button"
            onClick={onStart}
            data-content-id="tmr.copy.title.action"
          >
            {content.action} <span aria-hidden="true">→</span>
          </button>
          <button
            aria-expanded={showWorldNote}
            className="title-secondary"
            type="button"
            onClick={() => setShowWorldNote((visible) => !visible)}
            data-content-id="tmr.copy.title.secondary"
          >
            {content.secondary}
          </button>
        </div>
        {showWorldNote ? (
          <aside className="title-world-note" aria-live="polite">
            <span
              className="eyebrow"
              data-content-id="tmr.copy.title.world-note-title"
            >
              {content.worldNoteTitle}
            </span>
            <p data-content-id="tmr.copy.title.world-note">
              {content.worldNote}
            </p>
          </aside>
        ) : null}
        <div className="title-rule" />
        <p className="title-footnote" data-content-id="tmr.copy.title.footer">
          {content.footer}
        </p>
      </div>
      <p
        className="title-asset-note"
        data-content-id="tmr.copy.title.asset-note"
      >
        {content.assetNote}
      </p>
    </main>
  );
}

import { useState } from "react";

import {
  PLAYER_COPY,
  PRODUCT_IDENTITY,
} from "../presentation/design/copyRegistry.ko";
import { BrandMark } from "./BrandMark";

export function OpeningBriefing({
  onComplete,
}: {
  readonly onComplete: () => void;
}) {
  const [beatIndex, setBeatIndex] = useState(0);
  const beat = PLAYER_COPY.briefing.beats[beatIndex]!;
  const isLastBeat = beatIndex === PLAYER_COPY.briefing.beats.length - 1;

  return (
    <main
      className="briefing-shell"
      data-screen-id="tmr.screen.opening-briefing"
      aria-labelledby="briefing-title"
    >
      <div className="briefing-paper">
        <div className="briefing-masthead">
          <BrandMark compact />
          <div>
            <p className="eyebrow">{PLAYER_COPY.briefing.label}</p>
            <strong>{PRODUCT_IDENTITY.enTitle}</strong>
          </div>
          <span className="briefing-page">
            {String(beatIndex + 1).padStart(2, "0")} /{" "}
            {String(PLAYER_COPY.briefing.beats.length).padStart(2, "0")}
          </span>
        </div>
        <div className="briefing-rule" />
        <section className="briefing-copy">
          <p className="eyebrow">{beat.eyebrow}</p>
          <h1 id="briefing-title">{beat.title}</h1>
          <p>{beat.body}</p>
        </section>
        <div className="briefing-actions">
          <button className="quiet-button" type="button" onClick={onComplete}>
            {PLAYER_COPY.briefing.skip}
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              if (isLastBeat) onComplete();
              else setBeatIndex((index) => index + 1);
            }}
          >
            {isLastBeat
              ? PLAYER_COPY.briefing.finish
              : PLAYER_COPY.briefing.next}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </main>
  );
}

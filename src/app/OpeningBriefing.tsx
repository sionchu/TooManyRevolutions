import { useState } from "react";

import {
  getGameBuildersOpeningBriefingContent,
  getGameBuildersTitleContent,
} from "../presentation/design/playerContent";
import { BrandMark } from "./BrandMark";

export function OpeningBriefing({
  onComplete,
}: {
  readonly onComplete: () => void;
}) {
  const [beatIndex, setBeatIndex] = useState(0);
  const content = getGameBuildersOpeningBriefingContent();
  const titleContent = getGameBuildersTitleContent();
  const beat = content.beats[beatIndex]!;
  const isLastBeat = beatIndex === content.beats.length - 1;

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
            <p className="eyebrow" data-content-id="tmr.copy.briefing.label">
              {content.label}
            </p>
            <strong data-content-id="tmr.copy.title.en">
              {titleContent.enTitle}
            </strong>
          </div>
          <span className="briefing-page">
            {String(beatIndex + 1).padStart(2, "0")} /{" "}
            {String(content.beats.length).padStart(2, "0")}
          </span>
        </div>
        <div className="briefing-rule" />
        <section className="briefing-copy">
          <p className="eyebrow" data-content-id={beat.eyebrowId}>
            {beat.eyebrow}
          </p>
          <h1 id="briefing-title" data-content-id={beat.titleId}>
            {beat.title}
          </h1>
          <p data-content-id={beat.bodyId}>{beat.body}</p>
        </section>
        <div className="briefing-actions">
          <button
            className="quiet-button"
            type="button"
            onClick={onComplete}
            data-content-id="tmr.copy.briefing.skip"
          >
            {content.skip}
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              if (isLastBeat) onComplete();
              else setBeatIndex((index) => index + 1);
            }}
          >
            <span
              data-content-id={
                isLastBeat
                  ? "tmr.copy.briefing.finish"
                  : "tmr.copy.briefing.next"
              }
            >
              {isLastBeat ? content.finish : content.next}
            </span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </main>
  );
}

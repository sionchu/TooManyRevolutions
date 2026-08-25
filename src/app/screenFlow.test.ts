import { describe, expect, it } from "vitest";

import { transitionProductScreen } from "./screenFlow";

describe("GameBuilders product screen flow", () => {
  it("keeps the title -> opening briefing -> main game progression explicit", () => {
    const briefing = transitionProductScreen("title", "start-new-game");
    const main = transitionProductScreen(briefing, "finish-opening");

    expect(briefing).toBe("opening-briefing");
    expect(main).toBe("main-game");
  });

  it("allows a briefing skip without changing simulation state", () => {
    expect(transitionProductScreen("opening-briefing", "skip-opening")).toBe(
      "main-game",
    );
    expect(transitionProductScreen("main-game", "skip-opening")).toBe(
      "main-game",
    );
  });
});

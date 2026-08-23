import { describe, expect, it } from "vitest";

import { runT024PersistenceReplayInspection } from "./t024PersistenceReplayInspection";

describe("T024 Persistence / Replay inspection", () => {
  it("passes the snapshot, replay, derived-state, terminal, and corruption checks", () => {
    const report = runT024PersistenceReplayInspection();

    console.log(report.output);

    expect(report.allPassed).toBe(true);
    expect(report.output).toContain("T024 Persistence / Replay Inspection");
    expect(report.output).toContain("final state identical: YES");
    expect(report.output).toContain("Terminal won no-op after load: PASS");
    expect(report.output).toContain("Terminal defeated no-op after load: PASS");
    expect(report.output).toContain("Gate 1V: NOT STARTED");
  });
});

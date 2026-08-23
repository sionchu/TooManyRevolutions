import { describe, expect, it } from "vitest";

import { runT023StateDissolutionInspection } from "./t023StateDissolutionInspection";

describe("T023 State Dissolution inspection", () => {
  it("passes the non-defeat, precedence, terminal, and ordinary-consolidation diagnostics", () => {
    const report = runT023StateDissolutionInspection();

    console.log(report.output);

    expect(report.allPassed).toBe(true);
    expect(report.output).toContain("Case F — Actual state dissolution");
    expect(report.output).toContain(
      "Case G — Simultaneous consolidation / dissolution",
    );
    expect(report.output).toContain("precedence: STATE_DISSOLVED");
    expect(report.output).toContain("post-defeat next step advances: NO");
    expect(report.output).toContain("T024 replay:\nNOT IMPLEMENTED");
  });
});

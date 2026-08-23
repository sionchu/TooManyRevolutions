import { describe, expect, it } from "vitest";

import {
  formatT022OrderConsolidationInspection,
  runT022OrderConsolidationInspection,
} from "./t022OrderConsolidationInspection";

describe("T022 order consolidation inspection", () => {
  it("prints a reproducible Cases A–G report with all checks passing", () => {
    const first = runT022OrderConsolidationInspection();
    const second = runT022OrderConsolidationInspection();
    const output = formatT022OrderConsolidationInspection(first);

    console.log(output);

    expect(first).toEqual(second);
    expect(first.cases).toHaveLength(7);
    expect(first.allPassed).toBe(true);
    expect(output).toContain("T022 Order Consolidation Inspection");
    expect(output).toContain("Case C — Interrupted streak");
    expect(output).toContain("Case F — Partial capital");
    expect(output).toContain(
      "T023 state dissolution:\ncovered by inspect:t023",
    );
  });
});

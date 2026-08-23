import { describe, expect, it } from "vitest";

import {
  formatT021SimplifiedConflictInspection,
  runT021SimplifiedConflictInspection,
} from "./t021SimplifiedConflictInspection";

describe("T021 simplified conflict inspection", () => {
  it("prints a reproducible territorial-resolution report with all checks passing", () => {
    const first = runT021SimplifiedConflictInspection();
    const second = runT021SimplifiedConflictInspection();
    const output = formatT021SimplifiedConflictInspection(first);

    console.log(output);

    expect(first).toEqual(second);
    expect(first.allPassed).toBe(true);
    expect(output).toContain("T021 Simplified Conflict Inspection");
    expect(output).toContain("same-tick occupation: NO");
    expect(output).toContain("target collision handling: PASS");
    expect(output).toContain(
      "T022/T023 terminal evaluation:\nOUTSIDE T021 SCOPE",
    );
  });
});

import { describe, expect, it } from "vitest";

import { runV01PresentationStateInspection } from "./v01PresentationInspection";

describe("V01 presentation inspection", () => {
  it("passes the renderer-independent presentation checkpoint", () => {
    const report = runV01PresentationStateInspection();

    console.log(report.output);
    expect(report.allPassed).toBe(true);
    expect(report.output).toContain("V02: NOT STARTED");
  });
});

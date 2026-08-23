import { describe, expect, it } from "vitest";

import {
  formatF04AInspection,
  runF04ADiagnosis,
} from "./f04aEndogenousFactionDynamics";

describe("F04A endogenous faction dynamics inspection", () => {
  it("reports bounded recovery without a one-way ratchet", () => {
    const result = runF04ADiagnosis(undefined, 40103, 1);
    const output = formatF04AInspection(result);

    expect(output).toContain(
      "F04A Endogenous Faction Dynamics / One-Way Ratchet Repair",
    );
    expect(result.oneWayRatchetPaths).toEqual([]);
    expect(result.factionPaths.every((path) => path.accepted)).toBe(true);
  });

  it("is deterministic for the same survey inputs", () => {
    const first = runF04ADiagnosis(undefined, 40103, 1);
    const second = runF04ADiagnosis(undefined, 40103, 1);

    expect(first.deterministicSignature).toBe(second.deterministicSignature);
  });
});

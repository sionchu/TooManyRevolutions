import { describe, expect, it } from "vitest";

import {
  formatF04BInspection,
  runF04BInspection,
  runF04BDiagnosis,
} from "./f04bActiveConflictRecoveryAgency";

describe("F04B active conflict / recovery inspection", () => {
  it("passes the active-conflict and conditional-recovery diagnostics", () => {
    const report = runF04BInspection();

    expect(report.allPassed).toBe(true);
    expect(report.output).toContain("F04B Active Conflict Response");
    expect(report.output).toContain("Inspection invariants: PASS");
    expect(report.result.strongRecovery.status).toBe("RECOVERY");
    expect(report.result.weakRecovery.status).toBe("STALEMATE");
  });

  it("has a deterministic diagnostic signature", () => {
    const first = runF04BDiagnosis();
    const second = runF04BDiagnosis();

    expect(first.deterministicSignature).toBe(second.deterministicSignature);
    expect(formatF04BInspection(first)).toContain(
      "save/load recovery equivalence: PASS",
    );
  });
});

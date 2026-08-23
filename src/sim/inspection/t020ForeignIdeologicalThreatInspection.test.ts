import { describe, expect, it } from "vitest";

import { runT020ForeignIdeologicalThreatInspection } from "./t020ForeignIdeologicalThreatInspection";

describe("T020 foreign ideological threat inspection", () => {
  it("prints a reproducible Cases A–H causal-boundary report", () => {
    const output = runT020ForeignIdeologicalThreatInspection();
    const repeatedOutput = runT020ForeignIdeologicalThreatInspection();

    console.log(output);

    expect(repeatedOutput).toBe(output);
    expect(output).toContain("Case A — Strong foreign ideology, no contact");
    expect(output).toContain(
      "Case D — Live foreign exposure + domestic mobilization",
    );
    expect(output).toContain(
      "Case F — Incoming threat vs T019 outgoing closure",
    );
    expect(output).toContain("Case G — Actual incoming restriction");
    expect(output).toContain("Case H — Information-only exposure");
    expect(output).toContain("No ideology writes:");
    expect(output).toContain("No foreignSupport fabrication:");
    expect(output).toContain("No territorial mutation: PASS");
    expect(output).toContain("Stable ordering: PASS");
  });
});

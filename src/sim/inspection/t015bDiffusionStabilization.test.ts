import { describe, expect, it } from "vitest";

import { CONTACT_FIXTURE_REGION_IDS } from "../state/contactFixture";
import {
  DEFAULT_IDEOLOGY_DIFFUSION_FORMULA,
  DEFAULT_IDEOLOGY_DIFFUSION_RATE,
} from "../systems/ideologyDiffusion";
import {
  formatT015BDiffusionStabilization,
  runT015BDiffusionStabilization,
  T015B_CHECKPOINTS,
  T015B_GRADIENT_RATES,
} from "./t015bDiffusionStabilization";

describe("T015B diffusion stabilization comparison", () => {
  it("compares the current formula with gradient rates on the same scenario", () => {
    const report = runT015BDiffusionStabilization();
    const output = formatT015BDiffusionStabilization(report);
    const repeatedOutput = formatT015BDiffusionStabilization(
      runT015BDiffusionStabilization(),
    );

    console.log(output);

    expect(report.absoluteSource.formula).toBe("absoluteSource");
    expect(report.absoluteSource.diffusionRate).toBe(0.1);
    expect(DEFAULT_IDEOLOGY_DIFFUSION_FORMULA).toBe("supportGradient");
    expect(DEFAULT_IDEOLOGY_DIFFUSION_RATE).toBe(0.05);
    expect(report.absoluteSource.checkpoints.map(({ day }) => day)).toEqual(
      T015B_CHECKPOINTS,
    );
    expect(
      report.gradientRuns.map(({ diffusionRate }) => diffusionRate),
    ).toEqual(T015B_GRADIENT_RATES);
    expect(
      report.gradientRuns.every(
        (run) =>
          run.checkpoints.map(({ day }) => day).join(",") ===
          "0,10,30,60,120,240",
      ),
    ).toBe(true);
    expect(
      report.gradientRuns[0]?.checkpoints[0]?.regions.find(
        ({ regionId }) => regionId === CONTACT_FIXTURE_REGION_IDS.mine,
      ),
    ).toMatchObject({ republicanSupport: 0.01, monarchySupport: 0.01 });
    expect(repeatedOutput).toBe(output);
    expect(output).toContain("A. absolute-source formula");
    expect(output).toContain("B. gradient formula");
    expect(output).toContain("플레이어 광산");
  });
});

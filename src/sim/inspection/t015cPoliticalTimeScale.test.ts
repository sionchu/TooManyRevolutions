import { describe, expect, it } from "vitest";

import {
  formatT015CPoliticalTimeScaleCalibration,
  runT015CPoliticalTimeScaleCalibration,
  T015C_CADENCES,
  T015C_CHECKPOINTS,
} from "./t015cPoliticalTimeScale";
import {
  DEFAULT_IDEOLOGY_DIFFUSION_FORMULA,
  DEFAULT_IDEOLOGY_DIFFUSION_RATE,
  DEFAULT_IDEOLOGY_POLITICAL_CADENCE,
} from "../systems/ideologyDiffusion";
import { CONTACT_FIXTURE_REGION_IDS } from "../state/contactFixture";

describe("T015C political time-scale calibration", () => {
  it("compares daily, weekly, and monthly on the same ten-year scenario", () => {
    const report = runT015CPoliticalTimeScaleCalibration();
    const output = formatT015CPoliticalTimeScaleCalibration(report);
    const repeatedOutput = formatT015CPoliticalTimeScaleCalibration(
      runT015CPoliticalTimeScaleCalibration(),
    );

    console.log(output);

    expect(report.runs.map(({ cadence }) => cadence)).toEqual(T015C_CADENCES);
    expect(
      report.runs.every(({ formula }) => formula === "supportGradient"),
    ).toBe(true);
    expect(DEFAULT_IDEOLOGY_DIFFUSION_FORMULA).toBe("supportGradient");
    expect(DEFAULT_IDEOLOGY_DIFFUSION_RATE).toBe(0.05);
    expect(DEFAULT_IDEOLOGY_POLITICAL_CADENCE).toBe("monthly");
    expect(
      report.runs.every(({ checkpoints }) => checkpoints.length === 7),
    ).toBe(true);
    expect(report.runs[0]?.checkpoints.map(({ tick }) => tick)).toEqual(
      T015C_CHECKPOINTS.map(({ tick }) => tick),
    );
    expect(
      report.runs.find(({ cadence }) => cadence === "daily")
        ?.politicalUpdateCount,
    ).toBe(3600);
    expect(
      report.runs.find(({ cadence }) => cadence === "weekly")
        ?.politicalUpdateCount,
    ).toBe(514);
    expect(
      report.runs.find(({ cadence }) => cadence === "monthly")
        ?.politicalUpdateCount,
    ).toBe(120);
    expect(
      report.runs[2]?.checkpoints[0]?.regions.find(
        ({ regionId }) => regionId === CONTACT_FIXTURE_REGION_IDS.mine,
      ),
    ).toMatchObject({ republicanSupport: 0.01, monarchySupport: 0.01 });
    expect(repeatedOutput).toBe(output);
    expect(output).toContain("Year 10 (왕력 11년 1월 1일)");
    expect(output).toContain("monthly");
    expect(output).toContain("플레이어 광산");
  });
});

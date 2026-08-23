import { describe, expect, it } from "vitest";

import {
  formatT015DiffusionInspection,
  runT015DiffusionInspection,
  T015_INSPECTION_CHECKPOINTS,
} from "./t015DiffusionInspection";
import { CONTACT_FIXTURE_REGION_IDS } from "../state/contactFixture";

describe("T015 headless diffusion inspection harness", () => {
  it("runs the fixed checkpoints and prints a reproducible report", () => {
    const report = runT015DiffusionInspection();
    const output = formatT015DiffusionInspection(report);
    const repeatedOutput = formatT015DiffusionInspection(
      runT015DiffusionInspection(),
    );

    console.log(output);

    expect(report.checkpoints.map((checkpoint) => checkpoint.day)).toEqual(
      T015_INSPECTION_CHECKPOINTS,
    );
    expect(report.sensitivity.map((row) => row.diffusionRate)).toEqual([
      0.05, 0.1, 0.15,
    ]);
    const dayZero = report.checkpoints[0];
    expect(
      dayZero?.rows.find(
        (row) => row.regionId === CONTACT_FIXTURE_REGION_IDS.mine,
      ),
    ).toMatchObject({
      republicanSupport: 0.01,
      monarchySupport: 0.01,
      incomingContacts: [],
    });
    expect(
      dayZero?.rows.find(
        (row) => row.regionId === CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
      )?.monarchySupport,
    ).toBe(0.85);
    expect(report.topology).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.port,
          channel: "information",
        }),
        expect.objectContaining({
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.merchantPort,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.port,
          channel: "trade",
        }),
        expect.objectContaining({
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.port,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.capital,
          channel: "information",
        }),
        expect.objectContaining({
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.capital,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.farmland,
          channel: "border",
        }),
        expect.objectContaining({
          fromRegionId: CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
          toRegionId: CONTACT_FIXTURE_REGION_IDS.border,
          channel: "border",
        }),
      ]),
    );
    expect(repeatedOutput).toBe(output);
    expect(output).toContain("## Day 240");
    expect(output).toContain("## Meaningful diffusion events");
  });
});

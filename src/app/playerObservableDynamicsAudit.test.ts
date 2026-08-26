import { describe, expect, it } from "vitest";

import {
  PLAYER_OBSERVABLE_AUDIT_CHECKPOINTS,
  runPlayerObservableDynamicsAudit,
} from "./playerObservableDynamicsAudit";

describe("GameBuilders Player-Observable Dynamics Audit", () => {
  it("records actual demo checkpoints without forcing a story event", () => {
    const report = runPlayerObservableDynamicsAudit();
    const days = report.checkpoints.map((checkpoint) => checkpoint.day);

    expect(days).toEqual([...PLAYER_OBSERVABLE_AUDIT_CHECKPOINTS]);
    expect(report.finalRuntime.world.tick).toBe(1080);
    expect(report.checkpoints[0]?.classification).toBe(
      "PLAYER_OBSERVABLE_SYSTEM_CHANGE",
    );
    expect(
      report.checkpoints.some(
        (checkpoint) =>
          checkpoint.classification === "PLAYER_OBSERVABLE_SYSTEM_CHANGE",
      ),
    ).toBe(true);
    expect(
      report.checkpoints.reduce(
        (total, checkpoint) => total + checkpoint.controllerChanges,
        0,
      ),
    ).toBeGreaterThan(1);
    expect(
      report.checkpoints.at(-1)?.meaningfulEventCount ?? 0,
    ).toBeGreaterThan(0);
    expect(report.checkpoints.at(-1)?.mapSignature).not.toBe(
      report.checkpoints[0]?.mapSignature,
    );
    expect(report.checkpoints.at(-1)?.ideologySignature).not.toBe(
      report.checkpoints[0]?.ideologySignature,
    );
    expect(
      report.checkpoints.every(
        (checkpoint) => checkpoint.meaningfulEventCount >= 0,
      ),
    ).toBe(true);

    console.log(
      "GAMEBUILDERS_PLAYER_OBSERVABLE_DYNAMICS_AUDIT_JSON",
      JSON.stringify(
        report.checkpoints.map((checkpoint) => ({
          day: checkpoint.day,
          classification: checkpoint.classification,
          meaningfulEvents: checkpoint.meaningfulEventCount,
          activeConflicts: checkpoint.activeConflictCount,
          controllerChanges: checkpoint.controllerChanges,
          playerControlledLandHexes: checkpoint.playerControlledLandHexCount,
          agendas: checkpoint.agendaSignature,
          policies: checkpoint.policyInstitutionSignature,
          factions: checkpoint.factionActionSignature,
          foreign: checkpoint.foreignActionRouteSignature,
          ideology: checkpoint.ideologySignature,
          decisions: checkpoint.availableDecisionSignature,
          outcome: checkpoint.outcome,
        })),
      ),
    );
  }, 120_000);
});

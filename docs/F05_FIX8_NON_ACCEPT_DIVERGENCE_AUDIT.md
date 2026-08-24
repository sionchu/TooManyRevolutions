# F05_FIX8 Non-Accept Divergence Audit

## Scope and order

This audit was completed before changing production proposal lifecycle rules.
It compares the F05 historical runner, the F05_FIX7 integration runner with
no template, and the template-enabled IGNORE/REJECT branches. The audit seed
is `40103` and the long-horizon is `1800` days.

## Exact pre-fix branches

The F05_FIX7 state-grounded comparison identified exactly eight branches: four
`PROPOSAL_IGNORE` and four `PROPOSAL_REJECT`. The first divergence was the
authored proposal episode entering the template-enabled trace; no requested
intervention had been accepted.

| context | strategy | mode | first relative tick | first absolute tick | FIX7 silence before seam fix | historical F05 silence | classification |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| `EARLY_PREVENTIVE_T0` | `REPEATED_POLITICAL_ACCOMMODATION` | `PROPOSAL_IGNORE` | 31 | 31 | 83d | 112d | `MEASUREMENT_SIGNATURE_ARTIFACT` |
| `EARLY_PREVENTIVE_T0` | `REPEATED_POLITICAL_ACCOMMODATION` | `PROPOSAL_REJECT` | 31 | 31 | 83d | 112d | `MEASUREMENT_SIGNATURE_ARTIFACT` |
| `EARLY_PREVENTIVE_T1` | `REPEATED_POLITICAL_ACCOMMODATION` | `PROPOSAL_IGNORE` | 30 | 31 | 83d | 111d | `MEASUREMENT_SIGNATURE_ARTIFACT` |
| `EARLY_PREVENTIVE_T1` | `REPEATED_POLITICAL_ACCOMMODATION` | `PROPOSAL_REJECT` | 30 | 31 | 83d | 111d | `MEASUREMENT_SIGNATURE_ARTIFACT` |
| `NEAR_CRISIS_T18` | `REPEATED_POLITICAL_ACCOMMODATION` | `PROPOSAL_IGNORE` | 13 | 31 | 83d | 94d | `MEASUREMENT_SIGNATURE_ARTIFACT` |
| `NEAR_CRISIS_T18` | `REPEATED_POLITICAL_ACCOMMODATION` | `PROPOSAL_REJECT` | 13 | 31 | 83d | 94d | `MEASUREMENT_SIGNATURE_ARTIFACT` |
| `NEAR_CRISIS_T19` | `REPEATED_POLITICAL_ACCOMMODATION` | `PROPOSAL_IGNORE` | 12 | 31 | 83d | 93d | `MEASUREMENT_SIGNATURE_ARTIFACT` |
| `NEAR_CRISIS_T19` | `REPEATED_POLITICAL_ACCOMMODATION` | `PROPOSAL_REJECT` | 12 | 31 | 83d | 93d | `MEASUREMENT_SIGNATURE_ARTIFACT` |

At each first divergent observation the causal comparison was:

- accepted `ActionRecord` identities and sequence order: equal;
- carried faction actions: equal;
- phase output: the normal phase output remained equal, with only the
  authored proposal lifecycle event added to the template trace;
- authoritative `WorldState` core: equal;
- intervention feasibility and commitment state: equal;
- proposal state: different, as expected from the opened/rejected episode;
- Agenda and reassessment measurement inputs at that observation: equal;
- historical F05 runner versus F05_FIX7 integration no-template runner:
  equal through the first divergence and across the paired control probe.

The proposal state therefore had no production consumer that could explain the
reported F05 trajectory difference. The requested intervention was not
accepted in either non-accept mode.

## Causal finding and seam repair

The pre-fix F05_FIX7 observer counted every individual pacing-event tick. The
official F05 observer groups pacing events into a readable cluster while the
gap from the current cluster end is at most 30 days, and uses the cluster end
as the reassessment signal. The integration observer did not apply that cluster
rule, so identical non-accept runtime state acquired a different measurement
signature.

The repair was limited to the developer measurement seam in
`f05Fix7InteractionIntegration.ts`: pacing ticks are clustered with the
official `>30 days` boundary, then Agenda and decision-signature changes are
added as separate state-grounded signals. No production proposal state,
intervention, faction action, or F05 pacing event was changed to force a
control match.

## Post-fix re-audit

The executable audit is `pnpm run inspect:f05fix8audit`. Its post-fix result is:

```text
historical baseline=NOT_READY branches=36
pre-fix observed divergences=8 ignore=4 reject=4
post-fix divergences=0 ignore=0 reject=0
PHASE_A=ORCHESTRATION_ARTIFACT_FIXED
```

The unchanged historical population remains 36 branches with the prior
`NOT_READY` F05 recommendation. Phase A is therefore resolved, and the
state-grounded lifecycle implementation is permitted to proceed.


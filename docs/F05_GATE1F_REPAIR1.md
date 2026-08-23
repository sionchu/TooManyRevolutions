# F05_FIX1 Gate 1F Recovery and Pacing Repair 1

Date: 2026-08-24

Task status: **REPAIR_COMPLETE**

Gate 1F recommendation: **NOT_READY**

The recovery-choice blocker is repaired. The pacing diagnosis is narrower than
the original F05 interpretation, but the five-year arc still contains a long
late steady-state span in two representative contexts. This task therefore
stops after one coherent repair and does not add a second pacing system merely
to force a pass.

## Scope and unchanged boundaries

- The exact F05 matrix remains 36 branches: seed `40103`, 1,800 days, contexts
  `0/1`, `18/19`, and `180/181`, and the same six strategies.
- No fixture value, intervention effect, conflict rule, territory rule, RNG,
  story scheduler, UI, renderer, or V02 file changed.
- `WorldState.landHexStates[*].controller` remains the only physical territory
  authority. F04B's maximum one-Hex weekly recovery boundary is unchanged.
- Agenda remains a pure read model. It creates no authoritative progress or
  quest state.

## Silence diagnosis

Classification: `MIXED_GAP`.

The original F05 metric treated only selected major events as pause-worthy.
Late-horizon inspection showed that this omitted real state movement:

- faction grievance and organization continued to move on the existing F04A
  monthly cadence;
- faction-pressure Agenda priority and severity bands changed as those values
  crossed existing thresholds;
- fiscal Agenda composition and severity changed as treasury crossed into
  debt;
- the existing legal-response set changed when treasury or institutional
  rules changed;
- crisis and conflict state remained authoritative even when no new major
  pacing event was emitted.

Agenda priority/composition, severity-band changes, and legal-response-set
changes are stable enough to justify a future player reassessment. Raw scalar
movement, every treasury event, and every numeric Agenda change are not
counted. This avoids converting normal tick noise into artificial pacing.

The diagnostic also found a real remaining simulation-side gap. Some
early/pre-crisis accommodation branches reach their last meaningful threshold
at day 600 and then remain in the same critical political configuration for
1,200 days. The improved measurement must not hide that steady-state span.

## Agenda honesty repair

The existing fiscal Agenda combined debt stock and daily deficit with fixed
weights. That made a severe debt-only or severe deficit-only state incapable
of reaching its honest band because the absent second signal permanently
capped the result.

Fiscal severity now uses the stronger of the two independently observed
pressures:

```text
max(debt stock signal, daily deficit flow signal)
```

This is a pure selector correction over existing country state. It adds no
meter, resource, event, or gameplay authority. Focused tests prove that severe
debt with balanced daily flow and severe deficit with positive treasury both
produce a `critical` fiscal Agenda.

## Recovery response repair

Chosen response: `POLITICAL_ACCOMMODATION`.

The response itself was not rebalanced. F04D already gives it a real 70
treasury cost, 35 administrative load, seven-day commitment, and a bounded
reduction in the target rebellion faction's grievance while preserving its
organization. F05 previously compared mostly terminal scalar state, so it
missed the existing T016 Agenda consequence of that authoritative change.

The mechanism follows the existing F04C-R grounding:

```text
bounded accommodation lowers targeted grievance while preserving organization
→ F04A continues endogenous faction recovery
→ T016 Agenda reads the changed grievance/organization trajectory
→ critical rebellion pressure is delayed
→ the player receives time at an explicit treasury/capacity opportunity cost
```

In the representative active-conflict/recovery branch:

| Measure | WAIT | Political accommodation |
| --- | ---: | ---: |
| Critical rebellion-pressure Agenda | day 90 | day 420 |
| Five-year treasury | `-1,137` | `-1,207` |
| Controlled LandHexes at horizon | 0 | 0 |
| Active conflicts at horizon | 2 | 2 |

The benefit is therefore a 330-day delay in critical rebellion pressure, not
free territory or conflict deletion. The final physical state remains under
the unchanged F04B authority, and the 70-treasury downside remains visible.

## Measurement correction

F05 now samples the existing Agenda every 30 days and the legal response set
every 90 days. A reassessment point is recorded only when one of these changes:

- an existing major pacing-event cluster;
- Agenda composition, priority, or severity band;
- the set of currently feasible required responses.

The trajectory signature and response comparison now include the first
`critical` rebellion- and coup-pressure Agenda ticks. This makes the existing
paid pressure-delay consequence visible without changing authoritative
simulation state.

## Exact F05 rerun

| Representative context | WAIT | Meaningful required responses | Old major-event silence | Reassessment silence | Readable arc |
| --- | --- | ---: | ---: | ---: | --- |
| Early/preventive, tick 0 | `WAIT_WORSE` | 4 | 1,695 days | 1,200 days | No |
| Near-crisis, tick 18 | `WAIT_WORSE` | 4 | 1,713 days | 1,200 days | No |
| Active-conflict/recovery, tick 180 | `TRADEOFF` | 3 | 1,787 days | 510 days | Yes |

The maximum measured gap falls from 1,787 to 1,200 days. The 587-day reduction
is real because it comes from existing Agenda-band and response-availability
thresholds, not new filler events. It is not sufficient to make all three
representative arcs readable.

Recovery now has three measured paid trade-offs:

- material relief improves scarcity, unrest, and grievance for 90 treasury;
- political accommodation delays critical rebellion pressure by 330 days for
  70 treasury;
- opposition legalization delays rebellion pressure but costs 100 treasury,
  changes competition to `plural`, and accelerates coup pressure and the next
  coup.

Political accommodation remains `CONDITIONALLY_STRONG`. All representative
contexts retain six distinct trajectory signatures and visible causal traces.
The one-day neighbor classifications remain `MEANINGFUL_TIMING`,
`MEANINGFUL_TIMING`, and `STABLE`.

## Gate 1F decision

The repaired recovery context meets the narrow response target:

- at least two causally distinct paid responses are meaningful;
- WAIT is no longer weakly or strongly dominant;
- conflict and territory authority are unchanged.

Gate 1F is still not ready because the early/preventive and near-crisis
families contain a 1,200-day late span without another meaningful threshold,
decision-set, or consequence change. The smallest remaining blocker is a
single existing-system pacing consequence that prevents those critical
steady-state branches from going inert. This task does not authorize or design
that follow-up.

```text
GATE1F_RECOMMENDATION: NOT_READY
NEXT_AUTHORIZED_TASK_ID: NONE
V02: NOT STARTED
```

## External-reference guardrail

- `docs/FUTURE_REFERENCE_GROUNDING_GATES.md` was read and followed.
- Existing F04C-R accommodation/legalization/coercion grounding was reused.
- No new external research was performed.
- War, Fantasy, and visual-production reference domains were untouched.

## Verification

- `pnpm install --frozen-lockfile`: pass, pnpm 11.19.0, already current
- `pnpm run format`: pass
- `pnpm run typecheck`: pass
- `pnpm run lint`: pass
- `pnpm run build`: pass, 44 modules transformed
- `pnpm run inspect:t024`: pass, including save/load replay
- `pnpm run inspect:f01`: pass, including 40-year WAIT invariants and replay
- `pnpm run inspect:f04b`: pass
- `pnpm run inspect:f04d`: pass
- `pnpm run inspect:f05`: complete, recommendation `NOT_READY`
- `pnpm test`: pass, 51 files / 422 tests

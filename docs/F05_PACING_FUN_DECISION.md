# F05 Headless Pacing / Fun Decision

Date: 2026-08-24

Recommendation: **NOT_READY**

This is a developer-only Gate 1F measurement. It does not rebalance the
simulation, pass Gate 1F, or start V02.

## Measurement scope

- Scenario: `gate1f.f04d.validation`
- Seed: `40103`
- Horizon: 5 simulated years per branch (`1,800` days)
- Representative contexts:
  - early/preventive at tick 0;
  - near-crisis at tick 18, one day before the baseline rebellion;
  - active-conflict/recovery at tick 180, with zero state-controlled Hexes and
    one active conflict.
- Controlled neighboring conditions: the same natural history at ticks 1, 19,
  and 181. No formula or fixture-value perturbation was added.
- Responses: `WAIT`, `MATERIAL_RELIEF`, `POLITICAL_ACCOMMODATION`,
  `OPPOSITION_LEGALIZATION`, `COERCIVE_RESTRICTION`, and a 90-day
  `REPEATED_POLITICAL_ACCOMMODATION` probe.
- Execution path: the existing F03/F04D canonical action → step → commit path.

The matrix contains 36 branches: six contexts × six strategies.

## Decision summary

| Gate question | Measured result | Decision |
| --- | --- | --- |
| Political accommodation dominance | Strong before territorial collapse, ineffective after it; repeat use preserves territory but leaves severe instability | `CONDITIONALLY_STRONG`, not globally dominant |
| WAIT dominance | Worse in early and near-crisis contexts; weakly dominant in recovery | Context-dependent, but recovery choice coverage is too thin |
| Action strength and trade-offs | Four meaningful responses before collapse; only material relief remains meaningfully beneficial in recovery | Insufficient across the full arc |
| Timing | Tick 18 versus tick 19 changes all crisis timings without changing the terminal outcome | Meaningful near-crisis threshold, no terminal cliff |
| Five-year pacing | Major activity is concentrated early, followed by 1,485–1,787 days of political silence | Not readable enough for Gate 1F |
| Choice-driven histories | Six distinct traces in every representative context | Present, but many single-action branches reconverge structurally |
| Causal readability | Intervention completion, institutional change, shortage, crisis, and territory events are traceable | Present; long quiet recovery remains the main gap |

## Political accommodation

Classification: `CONDITIONALLY_STRONG`.

In the early context, one accommodation delays the first rebellion from day 19
to day 300. Its five-year treasury is `1,367`, compared with `-957` under WAIT.
This is not a direct treasury grant: the economy aggregates production from
fully controlled regions, so delaying territorial loss preserves daily income.
The branch still ends with zero controlled Hexes and two active conflicts.

At tick 18, the rebellion begins one day later in both WAIT and accommodation.
Accommodation therefore does not erase the already-mature immediate crisis,
but its later conflict sequence produces a much stronger treasury path
(`1,349` versus `-975`).

At tick 180, a single accommodation provides no measured final benefit and
costs 70 treasury. The response is ineffective once the state has already lost
all three Hexes.

The repeat probe is the clearest strength boundary:

| Context | Attempts / starts / completions / rejections | Five-year result versus WAIT |
| --- | --- | --- |
| Early/preventive | `20 / 20 / 20 / 0` | 3 Hexes and 1 conflict instead of 0 Hexes and 2 conflicts; treasury `13,500`; instability `96.422` instead of `0` |
| Near-crisis | `20 / 20 / 20 / 0` | 3 Hexes and 1 conflict instead of 0 Hexes and 2 conflicts; treasury `13,644`; instability `96.545` instead of `0` |
| Active-conflict/recovery | `20 / 4 / 4 / 16` | No recovery benefit; treasury falls to `-1,417` versus `-1,137` |

Repeated accommodation is therefore not a no-cost dominant strategy. It is a
powerful pre-collapse lever with a severe instability trade-off and a clear
post-collapse failure state. It should remain a focused balance observation
when the pacing gaps are remeasured.

## WAIT dominance

| Representative context | Classification | Evidence |
| --- | --- | --- |
| Early/preventive | `WAIT_WORSE` | Every required action creates a distinct history; material relief, accommodation, and coercion delay or improve measured pressure without a worse five-year vector |
| Near-crisis | `WAIT_WORSE` | The immediate rebellion is unavoidable at this boundary, but the response branches still alter later institutions, conflict timing, scarcity, or treasury |
| Active-conflict/recovery | `WAIT_WEAKLY_DOMINANT` | Only material relief produces a paid benefit; accommodation, legalization, and coercion are cost-only or worsen crisis timing |

WAIT is not broadly dominant before crisis. The weak recovery dominance is a
real decision-quality problem because three of four required responses cease to
offer a useful trade-off after territorial collapse.

## Action strength

| Action | Early/preventive | Near-crisis | Active-conflict/recovery |
| --- | --- | --- | --- |
| Material relief | Strong: scarcity `1.0 → 0.5`, lower unrest/grievance, first crisis day 20 | Strong on scarcity/unrest/grievance; cannot stop the day-1 rebellion | Meaningful trade-off: scarcity and unrest improve, treasury is 90 lower |
| Political accommodation | Strong: first crisis day 300 and preserved pre-collapse income | Strong downstream economy, but no immediate prevention | Ineffective/cost-only |
| Opposition legalization | Trade-off: plural competition and earlier coup/rebellion sequence | Strong five-year treasury but does not stop the immediate rebellion | Cost-only and produces a coup at relative day 13 |
| Coercive restriction | Strong timing effect: rebellion day 120; competition becomes banned and press censored | Strong downstream treasury, immediate rebellion unchanged | Ineffective/cost-only |

The early labels are end-to-end comparisons, not claims that every action has a
good institutional cost. Legalization and coercion change political rules, and
the trace preserves those consequences even where the five-year numeric vector
looks favorable.

## Timing sensitivity

| Family | Neighbor comparison | Structural traces changed | Terminal changes | Absolute first-crisis changes | Result |
| --- | --- | ---: | ---: | ---: | --- |
| Early/preventive | tick 0 vs 1 | 6 / 6 | 0 | 0 | Event-cluster history is timing-sensitive, but the first crisis is not a one-day cliff |
| Near-crisis | tick 18 vs 19 | 6 / 6 | 0 | 6 / 6 | The checkpoint crosses the rebellion boundary; later crisis order/timing changes materially |
| Active-conflict/recovery | tick 180 vs 181 | 0 / 6 | 0 | 0 | Stable under the one-day neighbor |

Early action has leverage before the day-19 rebellion. At tick 18, all actions
are already too late to prevent that rebellion, though they can still change
the later trajectory. After territorial collapse, timing by one day no longer
creates meaningful leverage.

## Pacing and arc

The representative pressure windows are legible at the start:

- Early WAIT produces shortage pressure on day 1, unrest-band movement from day
  4, rebellion on day 19, territorial losses on days 35/42/49, and a coup on
  day 300.
- The tick-18 context gives one decision day before rebellion. Several actions
  change the later crisis sequence, but none prevents that immediate event.
- The tick-180 context starts after all three Hexes are lost. Its next major
  crisis is 120 days later, while the current action set provides almost no
  territorial recovery leverage.

The five-year arc then becomes sparse:

| Context | Longest measured political silence | Single-response readable arc |
| --- | ---: | --- |
| Early/preventive | `1,695` days | No |
| Near-crisis | `1,713` days | No |
| Active-conflict/recovery | `1,787` days | No |

Single actions create one or two early clusters and then leave roughly four to
five years without another meaningful political decision/event cluster. The
repeat probe creates a regular 90-day rhythm, but repeating the same response is
not accepted as evidence of a healthy general pacing arc.

The system provides a reason to accelerate through low-information days, but
not enough new decisions or consequences to make pausing across the five-year
arc consistently valuable.

## Trajectory diversity and causal readability

Each representative context produced six distinct trajectory signatures, and
at least two required actions diverged from WAIT. Major examples are
explainable through the existing event chain:

- material-relief completion causes a shortage change;
- legalization/coercion completion causes institutional-rule changes;
- legalization completion in recovery directly causes the day-13 coup event;
- crisis events lead into deterministic territorial-control changes;
- retained territorial control preserves production and daily treasury flow.

The diversity is partly fragile. Every single-response five-year branch remains
active; most end at zero controlled Hexes and two conflicts. Several branches
differ mainly in crisis timing, treasury path, institutional rules, or scarcity
rather than in a different late-game political structure. State-threshold
events also legitimately lack an event cause ID, so their explanation depends
on the captured state trajectory.

## Gate 1F criteria

| Criterion | Result |
| --- | --- |
| Meaningful trade-offs | Partial — good before collapse, too thin in recovery |
| Surprising but explainable outcomes | Yes |
| Different histories from choices | Yes |
| Reasons to accelerate and pause | Partial — acceleration is useful; pause-worthy clusters are sparse |
| Readable 5–10 year headless arc | No at the measured five-year boundary |

## Required fixes before Gate 1F review can pass

1. Make at least one additional existing response produce a distinct paid
   benefit in active-conflict/recovery. Preserve explicit treasury or
   institutional cost and stay within existing F03/F04/F04D systems.
2. Shorten the longest political silence, or add an existing-system
   decision/event consequence, in all three representative contexts. Retain the
   five-year horizon and do not use a generic meter or story-node scheduler.
3. Rerun this same matrix after those narrow changes. Keep the repeat
   accommodation probe and its instability/territory/treasury trace visible.

F05 does not authorize these fixes. A new Bridge task is required before code or
balance changes.

## Verification

- `pnpm install --frozen-lockfile`: pass, lockfile already current
- `pnpm run format`: pass
- `pnpm run typecheck`: pass
- `pnpm run lint`: pass
- `pnpm run build`: pass, 44 modules transformed
- `pnpm run inspect:t024`: pass, all persistence/replay checks
- `pnpm run inspect:f01`: pass, 40-year WAIT invariants and replay
- `pnpm run inspect:f04d`: pass
- `pnpm run inspect:f05`: complete, recommendation `NOT_READY`
- `pnpm test`: pass, 51 files / 421 tests

Gate 1F remains under ChatGPT/user review. V02 remains not started.

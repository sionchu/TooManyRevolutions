# F05_FIX5 Faction Action Consequence Grounding

Date: 2026-08-24  
Task: `F05_FIX5`  
Start commit: `6aec8b94163737a5ba7970a48125b94ed39486d8`  
Scope: T016 faction action consequence audit; no new political domain

## Decision

```text
CLASSIFICATION: INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING
SELECTED_ACTION: NONE
ACTIVE_CONFLICT_CONSUMER: NONE
GATE1F_RECOMMENDATION: NOT_READY
```

No action consequence is implemented. The current accepted-action path remains
authoritative and deterministic, but the five active T016 action types still
resolve to `Faction.currentStrategy` plus the diagnostic
`FACTION_STRATEGY_CHANGED` event. Adding a resource, organization, grievance,
Agenda, crisis, conflict, or combat effect would require an unsupported cost,
object, recipient, or numeric conversion.

The only code change in this task is a focused regression covering all five
action types through the accepted `ActionRecord` path. It records the present
grounding boundary; it does not create a gameplay consequence.

## Method

The audit follows the F04C-R sequence:

```text
source-supported fact
-> observed mechanism
-> conditions / counterexamples / failure modes
-> trade-off
-> TMR state + existing consumer mapping
-> IMPLEMENT / DEFER / REJECT
```

The literature is used to ground mechanisms, not to select a numeric game
effect. A source claim is not treated as a TMR formula.

## External reference grounding

| ID | Source-supported fact | Observed mechanism | Conditions / counterexamples / trade-off | TMR inference |
|---|---|---|---|---|
| R01 | [McCarthy & Zald (1977), *Resource Mobilization and Social Movements: A Partial Theory*](https://doi.org/10.1086/226464) questions a simple grievance-to-activity link and emphasizes the variety and sources of resources, relations with authorities and other parties, and interaction among movement organizations. | Grievance can create demand, but mobilization depends on resources, organization, and relationships that make collective activity possible. | The article is a partial theory, not a conversion table. Resource presence does not prove that a particular expenditure succeeds or that activity is monotonic. | Existing `Faction.resources`, `Faction.organization`, and local ideology organization are plausible conditions for a narrow mobilization consumer; an action-specific delta still needs a represented cost and scale. |
| R02 | [Jenkins (1983), *Resource Mobilization Theory and the Study of Social Movements*](https://doi.org/10.1146/annurev.so.09.080183.002523) presents a multifactor model including resources, organization, political opportunities, and discontent, and identifies group organization as a major determinant of mobilization potential. | Organization and opportunity condition whether a movement can mobilize; discontent alone is not a sufficient runtime outcome. | The review also discusses alliances, disruption, and organizational diversity. Formal organization is not the only route, so a single linear organization bonus would be an overreach. | `ORGANIZE` and `FUND_MOVEMENT` are plausible candidates only if the existing local-mobilization/T018/T021 chain is paired with a real commitment and bounded state transition. |
| R03 | [Andrews & Edwards (2004), *Advocacy Organizations in the U.S. Political Process*](https://doi.org/10.1146/annurev.soc.30.012703.110542) treats organizational structure, participation, resources, and networks/coalitions as relevant characteristics and separates influence into agenda setting, access, favorable policy, implementation, and long-term institutional priorities/resources. | Advocacy is a multi-stage relationship with institutions, not a universal scalar influence result. | Access can fail; favorable policy and implementation are distinct outcomes. The review warns about limited evidence and scope, so a successful policy effect cannot be assumed from an advocacy label. | `LOBBY` needs a represented demand, recipient/access outcome, and downstream policy consumer. TMR currently has none of these objects. |
| R04 | [Garlick, Junk & Brown (2025), *How Lobbying Matters*](https://doi.org/10.1146/annurev-polisci-033123-124920) summarizes three documented pathways: transactional access, information changing policymaker positions, and mobilized citizen support or lobbying coalitions. | Lobbying can work through access, information, and coalition/mobilization channels. | Each pathway is conditional on an institutional venue, counterpart, information or coalition, and an observable policy process. The review does not support automatic influence from an action name. | `LOBBY` remains `DEFER` until TMR represents at least one demand/recipient/access or information/coalition outcome. |

### Source-to-TMR boundary

The external references support a resource/organization condition and a
multi-stage advocacy mechanism. They do **not** support any of the following
unstated conversions:

- `FUND_MOVEMENT -> resources - X` with an invented `X`;
- `ORGANIZE -> organization + X` with no membership/effort object;
- `LOBBY -> influence + X` or automatic policy success;
- `BARGAIN -> grievance - X` without an offer, counterpart, acceptance, or
  settlement;
- `ACCEPT -> grievance - X` without a represented accepted object or concession.

## Repository state and consumer audit

The source of truth is the current implementation, not the action label.

| Repository fact | Current behavior | Consumer boundary |
|---|---|---|
| `src/sim/state/action.ts` | `FactionActionPayload` contains only `{ factionId }`; the action vocabulary is bounded and schema-versioned. | No demand, offer, recipient, fund allocation, commitment duration, or accepted object can be carried by the current record. |
| `src/sim/systems/factionPressure.ts` | The accepted action decoder maps each action to `Faction.currentStrategy`; the phase emits `FACTION_STRATEGY_CHANGED` only when the label changes. F04A separately moves grievance/organization toward state-derived targets at the existing monthly boundary. | The accepted faction action has no action-specific writer for resources, organization, grievance, Agenda, crisis, conflict, or territory. |
| `src/sim/readModels/agenda.ts` | Faction Agenda severity reads grievance, organization, regional stress, and leverage. `currentStrategy` is an explanatory cause only; it is not the trigger. | A strategy event can be evidence, but it does not create a new Agenda or change severity by itself. |
| `src/sim/systems/politicalCrisis.ts` | T018 coup/rebellion gates read current grievance, faction organization/resources, state weakness, and local mobilization. `currentStrategy` is supporting evidence only. | No crisis is created by `FUND_MOVEMENT`, `ORGANIZE`, or another strategy label. |
| `src/sim/systems/conflictResolution.ts` | T021 faction operational strength reads current organization, a saturating resources signal, and affected-region radicalism/ideology organization/unrest. | A faction action cannot affect active-conflict strength, intent, recovery, or territory without first changing one of those existing fields. |
| `docs/F04B_ACTIVE_CONFLICT_RECOVERY_AGENCY.md` | The active-conflict chain is already explicit: organization/resources/local activation -> operational strength and current LandHex intent; grievance remains a creation/persistence condition. | This is a valid future consumer chain, but F05_FIX5 has no grounded action cost or magnitude that can enter it. |

## Five-action grounding matrix

`IMPLEMENT_CANDIDATE` is reserved for an action that passes every candidate
gate. `DEFER` means the mechanism may be useful after a missing object/consumer
is added. `REJECT` means the action name alone cannot justify the proposed
consequence.

| Action | Political meaning in current TMR vocabulary | Explicit actor cost / commitment | Candidate authoritative fields already present | Existing downstream consumers | Active-conflict relevance | Player reassessment pathway | Evidence strength | Failure modes / counterexamples | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| `FUND_MOVEMENT` | Pool or direct resources for a movement. The current chooser selects it when grievance, resources, and organization are high. | Only a `resources >= 0.5` availability gate exists. No spend, earmark, duration, or opportunity cost is represented. | `Faction.resources`, `Faction.organization`, regional ideology organization/radicalism/unrest. | T018 reads faction resources/organization and local gates; T021 derives resource signal and operational strength; Agenda reads resources as leverage. | Potentially high if one of those fields changed, but there is no grounded action writer. | Player interventions can change treasury/regions/faction fields before the next proposal; the accepted action itself does not feed back. | R01/R02 strongly support resources/organization as conditions; they do not supply a TMR numeric cost or conversion. | Funds can be diverted, fail to mobilize, or strengthen organization without immediate combat effect. A cheap monthly subtraction or combat bonus would be a new ungrounded rule and could ratchet. | `DEFER` |
| `ORGANIZE` | Build collective organization/capacity. The chooser uses faction or local ideology organization and labor legality. | Labor legality is an availability condition; no organizer effort, membership, resource cost, duration, or saturation rule is represented. | `Faction.organization`, regional ideology organization/radicalism/unrest, grievance. | T018 faction-organization/local-mobilization gates; T021 operational strength; Agenda organization signal; F04A organization writer. | Potentially high through T021/T018, but only after a real bounded organization transition. | Player interventions and institutional labor rules can change legal availability and state fields; no action-specific return path exists. | R01/R02 support organization as a mobilization condition; exact action magnitude, visibility, and covert/fragmented failure modes are not represented. | Organization can be restricted, fragmented, covert, or costly; a linear `organization + X` would confuse a condition with an achieved mobilization outcome. | `DEFER` |
| `LOBBY` | Seek institutional access, information exchange, or coalition support for a political demand. | Press not censored and influence/grievance thresholds only. No demand, recipient, access, information, coalition, or implementation commitment. | `Faction.influence`, `resources`, `currentStrategy`, institutional rules, Agenda evidence. | Agenda may record strategy evidence; no existing T018/T021 effect consumes a lobbying result. | None in the current active-conflict path. | No represented recipient or policy implementation object through which a player could observe a consequence. | R03/R04 support conditional access/information/coalition mechanisms, not universal influence. | Access can fail, information can be ignored, coalitions can split, and policy adoption/implementation can diverge. | `DEFER` |
| `BARGAIN` | Signal willingness to negotiate. `politicalCompetition = plural` makes it legal; it does not define a settlement. | Plural competition plus grievance and a weak leverage condition. No offer, counterpart, acceptance, deadline, or settlement. | `currentStrategy`, institutional rules, grievance/resources/influence as observation inputs. | Current legality/chooser only; no settlement or conflict consumer. | None. It cannot reduce an active conflict without a represented bargain and response. | Player can change institutional legality through F04D, but there is no bargaining object for a branch to consume. | F04C-R explicitly defers full bargaining; R02's political-opportunity language does not define a TMR settlement. | Counterparty refusal, unequal bargaining power, failed implementation, and non-comparable demands are all possible. | `DEFER` |
| `ACCEPT` | Accept the current status quo or an already available response. | Always available; no accepted object, concession, or status quo identity is carried. | `currentStrategy` only; grievance remains an observation input. | Diagnostic strategy evidence only. | None. | No object or concession lets a player distinguish what was accepted or reassess a downstream state. | No reviewed source supports a generic grievance reduction from the action name. R01/R02 instead caution against a mechanical grievance-to-activity shortcut. | Acceptance may preserve grievance, entrench a status quo, or be conditional; automatic `grievance - X` would be arbitrary. | `REJECT` |

## Candidate-selection gate

The task permits one consequence only if all eight gates pass. `—` means the
candidate has no meaningful path to evaluate because an earlier required object
or consumer is absent.

| Candidate | 1 existing field / narrow parameter | 2 explicit cost / commitment | 3 existing active-conflict consumer | 4 no direct terminal/territory shortcut | 5 bounded/no monthly ratchet | 6 natural repeat limit | 7 grounded magnitude | 8 counterfactual beyond strategy/event | Result |
|---|---|---|---|---|---|---|---|---|---|
| `FUND_MOVEMENT` | Pass: resources/org/local activation exist | **Fail:** threshold is availability, not cost | Pass in principle: T021/T018 read resources/org | Pass if implemented carefully | **Fail:** no spending/saturation semantics | **Fail:** repeated accepted action is currently free | **Fail:** no action magnitude or scenario parameter | **Fail:** current state is identical beyond strategy/event | `DEFER` |
| `ORGANIZE` | Pass: organization/local activation exist | **Fail:** no effort/resource commitment | Pass in principle: T021/T018 read organization | Pass if implemented carefully | **Fail:** no bounded growth writer owned by the action | **Fail:** repeated action is free | **Fail:** no numeric organization gain scale | **Fail:** current state is identical beyond strategy/event | `DEFER` |
| `LOBBY` | **Fail:** no represented demand/access/policy field | **Fail:** no access or information commitment | **Fail:** no lobbying result consumer | Pass | **Fail:** no outcome to bound | **Fail:** no recipient or rejection state | **Fail:** no scalar influence conversion allowed | **Fail:** no measurable policy counterfactual | `DEFER` |
| `BARGAIN` | **Fail:** no offer/counterpart/settlement field | **Fail:** legality is not a commitment | **Fail:** no bargaining consumer | Pass | **Fail:** no settlement state | **Fail:** repeated legality is free | **Fail:** no grounded concession scale | **Fail:** no settlement counterfactual | `DEFER` |
| `ACCEPT` | **Fail:** no accepted object/status quo identity | **Fail:** no acceptance commitment | **Fail:** no consumer | Pass | **Fail:** arbitrary grievance change would ratchet | **Fail:** always available with no limit | **Fail:** no magnitude | **Fail:** no accepted-object counterfactual | `REJECT` |

No candidate passes all eight gates. The preference for `ORGANIZE` or
`FUND_MOVEMENT` therefore does not authorize forcing one into implementation.

## Controlled counterfactuals and focused regression

### Accepted action versus no action

The new test in
`src/sim/systems/factionPressure.test.ts` submits each of
`FUND_MOVEMENT`, `ORGANIZE`, `LOBBY`, `BARGAIN`, and `ACCEPT` as an accepted
heuristic `ActionRecord` against the same fixture state. It compares the action
branch with a no-action branch at the same tick.

Observed invariant:

- the faction's `currentStrategy` and one `FACTION_STRATEGY_CHANGED` event can
  differ;
- `resources`, `organization`, `grievance`, country state, regions, policies,
  conflicts, LandHex controllers, and run outcome do not differ;
- the repeated same action emits no second strategy-change event and does not
  add a resource, organization, or grievance delta beyond the existing F04A
  state writer.

This is a counterfactual for the absence of a consequence, not evidence that a
consequence should be invented.

### Player interaction

The player can change fields that the chooser observes through existing
intervention and institutional paths. That can change a later proposal or its
legality. There is no reverse path in which the accepted faction action changes
one of those fields or a downstream player response set. The current slice is
therefore an actor-input seam, not a genuine player↔faction consequence loop.

### F05 matrix handling

No authoritative action consequence was implemented, so the exact 36-branch,
five-year F05 matrix is **not claimed as rerun evidence for this task**. The
required `inspect:f05` command is still run as a baseline verification command;
its output is reported as unchanged actor-loop evidence, not as a new pacing
result caused by F05_FIX5.

## Implementation boundary retained for a future task

A future candidate would need to introduce (within a separately authorized
scope) the smallest missing object and state transition, for example:

```text
legal action
-> represented demand / effort / access / settlement object
-> explicit cost or commitment
-> bounded existing field transition
-> T018/T021 or another named consumer
-> player-visible reassessment counterfactual
```

That future work must keep `LandHex.controller` as the only physical territory
authority, avoid continuity/terminal writers, and avoid generic political or
utility meters. It must also demonstrate insertion-order independence,
persistence/replay determinism, and a non-dominant repeated-use pattern before
any F05 matrix is reinterpreted.

## Claim-to-source ledger

| claim_id | claim | status | source | support / limitation | artifact location |
|---|---|---|---|---|---|
| R01-C1 | Grievance is not a sufficient mechanical predictor of movement activity; resources and organizational relationships matter. | Source-based inference from the abstract | R01 | The abstract directly contrasts grievance-centered analysis with a resource-mobilization perspective; it is not a TMR numeric rule. | External reference grounding |
| R02-C1 | Resources, organization, political opportunities, and discontent are distinct formation conditions; organization is a major mobilization determinant in the review. | Verified fact | R02 | Directly stated in the Annual Reviews abstract; review scope is theory, not a game balance function. | External reference grounding |
| R03-C1 | Advocacy influence spans agenda setting, access, favorable policy, implementation, and long-term institutional priorities/resources. | Verified fact | R03 | Directly stated in the Annual Reviews abstract; empirical scope is U.S. advocacy organizations. | External reference grounding / LOBBY |
| R04-C1 | Lobbying pathways include transactional access, information, and mobilized citizen/coalition support. | Verified fact | R04 | Directly stated in the Annual Reviews abstract; pathways require institutions and counterparts. | External reference grounding / LOBBY |
| TMR-C1 | The current accepted faction action changes only `currentStrategy` plus its strategy event. | Verified repository fact | `src/sim/systems/factionPressure.ts` and focused test | Source/test observation; F04A monthly state movement is separate from action semantics. | Repository state / counterfactuals |
| TMR-C2 | T018/T021 have existing resource/organization consumers, but no current action-specific writer enters them. | Verified repository fact | `src/sim/systems/politicalCrisis.ts`, `src/sim/systems/conflictResolution.ts`, `docs/F04B_ACTIVE_CONFLICT_RECOVERY_AGENCY.md` | Current fields are authoritative consumers; the missing cost/magnitude prevents safe implementation. | Repository state / candidate gate |

## Final classification

```text
INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING
SELECTED_ACTION: NONE
ACTIVE_CONFLICT_CONSUMER: NONE
GATE1F_RECOMMENDATION: NOT_READY
```

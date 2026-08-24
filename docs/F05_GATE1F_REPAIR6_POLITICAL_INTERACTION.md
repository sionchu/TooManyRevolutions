# F05 / Gate 1F Repair 6 — Political Interaction Counterfactual

**Task:** F05_FIX6
**Classification:** `KERNEL_IMPLEMENTED_VERTICAL_SLICE_MEANINGFUL`
**Gate 1F recommendation:** `NOT_READY`
**Official F05 pacing:** unchanged; proposal responses are not integrated into the six-strategy pacing matrix.

## Implemented slice

The developer-only scenario `gate1f.f05.fix6.political-interaction` explicitly maps the coup/security fixture faction's accepted `LOBBY` to the existing F04D `gate1f.f04d.coercive-restriction` intervention. The proposal targets the player Country's current Government at opening. On the next tick the player can ignore, reject, or accept it. `ACCEPT` uses the normal intervention resolver; there is no action-name-to-effect inference.

## Controlled experiment

All branches use the same scenario, seed `56006`, initial state, and an 8-day horizon. The inspection is `pnpm run inspect:f05fix6` and its assertions are in `src/sim/inspection/f05Fix6PoliticalInteraction.test.ts`.

| Branch | Proposal lifecycle | Feasibility at response | Existing intervention path | Measured downstream state |
| --- | --- | --- | --- | --- |
| `NO_PROPOSAL` | no proposal | n/a | none | Treasury `500 -> 564`; no rule, crisis, conflict, or LandHex change; CountryId and Government remain unchanged. |
| `PROPOSAL_IGNORE` | opened tick 1, remains `open` | response not submitted | none | Treasury `500 -> 564`; no intervention/rule/faction effect; no territory or conflict change; first post-opening reassessment signal is existing unrest/instability band evidence after 3 days. |
| `PROPOSAL_REJECT` | opened tick 1, `rejected` tick 2 (`explicitReject`) | intervention feasible; reject is legal | none | Treasury `500 -> 564`; no commitment/start/completion, no rule change, and the affected rebellion faction remains `grievance 0.600 / organization 0.600`. Status quo matches IGNORE on the measured intervention-owned state. |
| `PROPOSAL_ACCEPT` | opened tick 1, `accepted` tick 2 | `accept=true` before response | starts tick 2, completes tick 7 | Treasury `500 -> 489` after the existing cost/settlement; administrative load is occupied while the commitment is active; `pressFreedom restricted -> censored` and `politicalCompetition restricted -> banned`; affected rebellion faction becomes `grievance 0.700 / organization 0.480`; faction legal-action availability changes. No crisis, conflict, Government, LandHex, or terminal writer fires in this horizon. |

The target Government is the same `policy-fixture.government` in all proposal branches and the CountryId remains `policy-fixture.country`. The open/rejected branches do not apply the coercive restriction. The accepted branch differs by the existing intervention's treasury, commitment, duration, institutional, and faction completion effects—not by counting proposal events as a gameplay payoff.

The accept branch's response feasibility is evaluated before the commitment is started. The inspection also saves/loads each final branch through V3 and checks canonical replay equivalence and unchanged LandHex controllers.

## Interpretation

This is a meaningful vertical slice because a player response now selects between an unchanged status quo and an already-authoritative, bounded intervention whose completion changes institutional and faction state. It is not a Gate 1F pacing repair: the official F05 six-strategy inspection still has no proposal-response policy, and this task does not auto-accept or auto-reject proposals in that matrix. A future integration task requires separate review.

## Verification references

- Kernel design and source ledger: `docs/POLITICAL_INTERACTION_KERNEL.md`.
- Focused lifecycle/persistence coverage: `src/sim/systems/politicalProposal.test.ts` (9 tests).
- Controlled branch inspection: `src/sim/inspection/f05Fix6PoliticalInteraction.ts` (4 branches).

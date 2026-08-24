# F05_FIX12 — FUND_MOVEMENT Authoring Seam

TASK_ID: `F05_FIX12`
START_COMMIT: `5828dda5834a7cb037c7b83b9e44820192fc73bb`
BASE_BRANCH: `master`

## Decision

```text
PRIMARY_CLASSIFICATION: FUND_MOVEMENT_AUTHORING_SEAM_IMPLEMENTED
AUTHORING_SCOPE: STATIC_SCENARIO_ONLY
AUTHORING_TYPE: FactionFundMovementTemplate
SCENARIO_FIELD: factionFundMovementTemplates
TARGET_DOMAIN: REGION_SINGLE
TARGET_INFERENCE: FORBIDDEN
AMOUNT_OWNERSHIP: SCENARIO_AUTHORED
AMOUNT_DEFAULT: NONE
AMOUNT_DERIVATION: NONE
STATIC_AMOUNT_VALIDATION: Number.isFinite(resourceAmount) && resourceAmount > 0; current faction-resource feasibility is deferred to runtime
PROFILE_UNIQUENESS: at most one template per factionId
RUNTIME_ACTION_SCHEMA_CHANGE: NO
AUTHORITATIVE_COMMITMENT_STATE: NO
RUNTIME_RESOURCE_WRITER: NO
PERSISTENCE_FORMAT: V4_UNCHANGED
NEXT_IMPLEMENTATION_READINESS: TARGETED_COMMITMENT_VERTICAL_SLICE
GATE1F_RECOMMENDATION: NOT_READY
V02: NOT_STARTED
```

The specialized template type represents the `FUND_MOVEMENT` action kind. It
does not create a generic authoring framework and it does not add a
`targetRegionId` or amount to the accepted faction action payload.

## Static authoring contract

```ts
export interface FactionFundMovementTemplate {
  readonly factionId: FactionId;
  readonly targetRegionId: RegionId;
  readonly resourceAmount: number;
}

readonly factionFundMovementTemplates?: readonly FactionFundMovementTemplate[];
```

The authoring and validation boundary is:

```text
scenario author
  -> explicit factionId
  -> explicit single targetRegionId
  -> explicit resourceAmount
  -> assertScenarioDefinition()
  -> future runtime intake boundary (not implemented)
```

Validation uses the scenario's static `initialFactions` and `initialRegions`:

- `factionId` must identify one initial Faction.
- `targetRegionId` must identify one initial Region.
- v1 requires `Region.ownerCountryId === Faction.countryId`. This is a narrow
  local-political authoring boundary; it does not redefine LandHex control,
  `Region.stateControl`, or any territorial authority.
- `resourceAmount` must be finite and strictly positive. There is no default,
  universal constant, upper-bound balance rule, or state-derived formula.
- current `Faction.resources` is not compared during static validation. Current
  resource availability and commitment feasibility belong to the separately
  authorized runtime slice because the stock is mutable run state.
- a Faction may have at most one profile. A repeated `factionId` is rejected;
  no runtime chooser resolves duplicate profiles.

The optional field is absent from existing scenarios and is not copied into
`WorldState`. An empty or absent authoring collection therefore leaves initial
run behavior unchanged.

## Explicit authority boundary

This task changes only `src/sim/state/scenario.ts` and its focused validation
test. It does not change:

- `FactionActionPayload`, `decodeFactionAction()`, or ActionRecord schema;
- heuristic target or amount selection in `factionPressure`;
- faction resource debit, reserve, earmark, availability projection, or any
  other runtime writer;
- commitment lifecycle, Agenda reading, T018/T021 consequences, Conflict,
  LandHex, continuity, terminal outcome, UI, V02, or runtime LLM/solver;
- snapshot serialization or replay. Persistence remains V4.

No production scenario receives a target or amount in this task. The focused
tests use synthetic values only.

## Focused coverage

`src/sim/state/scenario.test.ts` covers:

- accepted valid profiles;
- acceptance independent of profile insertion order;
- missing Faction rejection;
- missing Region rejection;
- foreign-owner Region rejection;
- zero, negative, `NaN`, positive infinity, and negative infinity rejection;
- duplicate profile rejection;
- absent authoring data versus an explicit empty collection producing equal
  initial WorldState.

The static seam is sufficient for a separately authorized targeted commitment
vertical slice. It does not authorize that runtime slice, Gate 1F, V02, or
F05_FIX13.

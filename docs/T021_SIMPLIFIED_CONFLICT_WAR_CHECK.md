# T021 Simplified Conflict / War Check

**Status:** COMPLETE / PASS  
**Date:** 2026-08-22

## Scope

T021 adds strategic resolution for existing active armed `rebellion`, `civilWar`,
and `war` conflicts. `coup` remains non-territorial. The daily tick remains the
authoritative clock; territorial resolution runs on the centralized weekly
boundary.

## Headless inspection

`pnpm run inspect:t021` covers:

- Case A: peaceful border has no derived front or territorial change
- Case B: a rebellion detected by T018 cannot capture in the same phase
- Case C: initial rebellion seizure changes one LandHex
- Case D: adjacent rebellion expansion and government recapture
- Case E: Country war uses `Country.militaryPower` and adjacency
- Case F: equal strength produces stalemate
- Case G: simultaneous target collision is stable by `ConflictId`

The inspection also checks that LandHex is the sole physical territorial writer,
fronts are derived, coup has no territorial mutation, and occupation leaves owner,
stateControl, ideology, ContactGraph topology, and RunOutcome unchanged.

## Deferred

T022 victory/consolidation, T023 dissolution/defeat, T024 snapshot/replay, war
declaration/peace, detailed army behavior, terrain/logistics/casualties, foreign
military intervention, UI/rendering, and Gate 1V remain outside T021.

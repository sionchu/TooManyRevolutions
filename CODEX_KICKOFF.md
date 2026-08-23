# Codex Kickoff — New Project

Use this as the first implementation task after placing all docs in the repository.

---

Read these files completely before acting:

1. `AGENTS.md`
2. `docs/GDD.md`
3. `docs/ARCHITECTURE.md`
4. `docs/BACKLOG.md`

This is a brand-new project.
This is a greenfield repository. Start from the documented architecture and scope.

## Task

Execute **Gate 0 / T001–T005 only**.

Do not implement:
- final gameplay,
- final art,
- R3F world rendering beyond any minimal scaffold needed to boot,
- LLM agents,
- diplomacy gameplay,
- rebellion gameplay,
- WebGPU,
- HTML-in-Canvas.

### Establish

1. Vite + React + TypeScript
2. test framework
3. lint/format
4. clean source structure
5. renderer-independent `src/sim/`
6. seeded deterministic RNG
7. game clock/tick skeleton
8. serializable event model with `causeIds`
9. base types for:
   - Country
   - Region
   - Ideology
   - Faction
   - Policy
   - Conflict
   - Run state
10. automated tests for determinism and basic invariants

### Documentation

Update:
- `docs/ARCHITECTURE.md` only if actual implementation differs
- `docs/DECISIONS.md` for any expensive new choice
- `docs/CODEX_DEVLOG.md` with observable work performed
- `docs/BACKLOG.md` status for completed tasks

### Required verification

Before finishing:
- run all tests
- run lint/typecheck if configured
- run production build
- report exact commands and results

### Scope rule

Do not silently implement Gate 1.

At the end, propose the smallest next task from Gate 1, but do not execute it.

# Future Reference Grounding Gates

Date: 2026-08-24

This document records future reference-grounding gates that must be satisfied before the corresponding domains are implemented or promoted into production-facing work.

The governing principle is **demand-driven research**:

> Do not create a new domain merely because references are available. First authorize the gameplay/domain need, then perform the minimum serious reference grounding needed to validate its causal model, boundaries, failure modes, and TMR state/consumer mapping.

The F04C-R workflow is the reference standard:

```text
source-supported case
→ observed mechanism
→ conditions / counterexamples / failure modes
→ trade-off
→ TMR state + consumer mapping
→ explicit implementation/defer decision
```

External references inform TMR; they do not become scripted history, automatic balance formulas, lore-only modifiers, or production assets by themselves.

---

## 1. War as Politics — grounding required before implementation

Status: **DEFERRED / IMPLEMENTATION BLOCKED BY REFERENCE GROUNDING**

Before any War as Politics implementation task is authorized, create a dedicated historical/political grounding task comparable in rigor to F04C-R.

The grounding must cover representative cases and counterexamples for political mechanisms such as:

- mobilization and demobilization;
- conscription and exemption politics;
- fiscal extraction / war finance;
- war economy and distribution burdens;
- officer corps / civil-military relations where the future domain genuinely needs them;
- occupation and collaboration/resistance politics;
- refugees/displacement where existing state can honestly consume it;
- peace settlement and post-war political consequences.

Required output is mechanism-first, not battle-history-first. It must distinguish what current TMR state can express from what requires a new domain.

Do not authorize tactical unit micro, logistics simulation, manpower meters, officer loyalty, occupation government, or peace-treaty systems merely to make the grounding look complete.

A future War task may proceed only after the grounding explicitly identifies the smallest useful political slice and its authoritative consumers.

---

## 2. Fantasy Institutional Politics — grounding required before implementation

Status: **DEFERRED / IMPLEMENTATION BLOCKED BY REFERENCE GROUNDING**

Before implementing `Arcane Privilege / Mage Guild`, `Sacred / Supernatural Sovereignty`, or another fantasy political institution, perform a dedicated institutional-reference grounding task.

Fantasy must enter the simulation as politics, institutions, class, property, taxation, law, legitimacy, organization, or military authority — not as generic lore bonuses.

The grounding should use historical/institutional analogs where useful, for example:

- chartered guild and corporate privilege;
- estates, clerical privilege, church-state relations;
- monopoly rights and licensed professions;
- tax exemptions and jurisdictional privilege;
- sacred kingship / religious sovereignty;
- privileged military or knowledge estates;
- conflicts between central authority and autonomous privileged institutions.

The purpose is not to claim that historical institutions are literally magical. The purpose is to identify believable political mechanisms that a fantasy institution would create.

Required mapping:

```text
fantasy premise
→ institutional/legal mechanism
→ who gains/loses rights, property, revenue, authority, or organization
→ counter-reaction / failure mode
→ existing TMR state and consumer
→ new-domain requirement, if any
```

Do not implement races, prophecy, mana politics, magical-resource meters, or generic `magic = legitimacy/stability bonus` logic as substitutes for institutional grounding.

---

## 3. Gate 1V Visual Benchmark — reference-to-production validation required

Status: **PLANNED AFTER GATE 1F / PRODUCTION ACCEPTANCE BLOCKED BY BENCHMARK**

V00 already defines the Visual Bible, reference catalog, asset provenance rules, and reference → TMR rule traceability. V01 provides renderer-neutral presentation state.

After Gate 1F passes and visual implementation is authorized, Gate 1V must test those rules in an actual developer visual benchmark before production art/asset lock-in.

Required path:

```text
external visual reference
→ verified source / rights status
→ extracted visual principle
→ TMR visual rule
→ benchmark implementation using authoritative PresentationState
→ canonical screenshot comparison
→ human/readability critique
→ ACCEPT / REVISE / REJECT
```

The benchmark must verify at minimum:

- LandHex physical control readability;
- Region vs LandHex authority distinction;
- active front hierarchy;
- political influence vs territorial control distinction;
- actual Faction organization token truthfulness;
- ContactGraph route readability;
- critical pressure/event hierarchy;
- semantic zoom and map density;
- visual cohesion of any candidate external asset source.

No KayKit, Kenney, Quaternius, AI-generated concept, historical scan, or other external source becomes a production asset solely because its license/source was verified. Asset acceptance remains blocked until benchmark, normalization, technical QA, provenance, and canonical visual review pass.

---

## 4. Sequencing guardrail

Current priority remains the active gate problem.

At the time this document was created, F05 measured Gate 1F as `NOT_READY`. Therefore the immediate project priority is the narrow Gate 1F repair/re-measurement, not War, Fantasy, or final visual production.

Future sequencing:

```text
Gate 1F repair / re-measurement
→ ChatGPT/user Gate 1F PASS
→ Gate 1V visual benchmark work may be authorized

War domain authorization
→ War reference grounding
→ smallest approved War as Politics implementation

Fantasy domain authorization
→ Fantasy institutional grounding
→ smallest approved fantasy institutional implementation
```

No Codex task may self-authorize one of these domains merely because the previous task completed.

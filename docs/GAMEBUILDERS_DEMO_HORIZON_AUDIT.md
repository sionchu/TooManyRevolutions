# GameBuilders Demo Horizon Audit

Seed: `18970401`  
Scenario: `gamebuilders.demo`  
Requested checkpoints: Day 0, 90, 180, 360, 720, 1080, 1800, 3600, 7200 (approximately 20 simulated years).  
Run path: every day used `runSimulationStep -> commitSimulationStep`; player responses were submitted through the same accepted ActionRecord intake.

## Audit method

Five deterministic trajectories were run:

- A: no player action
- B: material/economic relief-oriented response (`t016b.fixture.short-action`, authored in the demo as `곡창 긴급 배급 확대`)
- C: political accommodation (`gate1f.f04d.political-accommodation`)
- D: legalization (`gate1f.f04d.opposition-legalization`)
- E: coercive/restrictive response (`gate1f.f04d.coercive-restriction`)

The action response in trajectories B–E was submitted at the first available tick and was observed as `accepted / INTERVENTION_STARTED`. No crisis was scheduled or forced. `Meaningful density` excludes only routine `TICK_ADVANCED`, `RESOURCE_PRODUCED`, `TREASURY_CHANGED`, and `NATIONAL_PRODUCTION_CHANGED` events. The `last political event` column is the latest event from the audit's political reassessment set. All rows had no physical conflict front (`fronts = none`); `control` is the LandHex controller-kind count.

For this audit, `temporarily quiet` means an active run with no meaningful event in the current checkpoint interval but with an available authored action. `structurally stalled` means the same active run has no meaningful event and no available authored action at Day 1800 or later. This is a diagnostic classification, not a new simulation rule.

## Results

Country values are shown as `treasury / legitimacy / stateCapacity / instability / stateContinuity`. Faction values are `coup grievance,organization,strategy | rebellion grievance,organization,strategy`.

### A — no player action

| Day | Outcome | Conflicts | Agenda count/highest | Available | Density | Last political | Country | Factions | Control | State |
| ---: | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |
| 0 | active | none | 2/medium/.576 | 4 | 0 | — | 500/70/55/20/100 | .40,.80,wait \| .60,.60,wait | country 3 | interactive alive |
| 90 | active | rebellion active | 2/high/.708 | 4 | 16 | 58 | 753/70/55/0/100 | .46,.80,wait \| .66,.66,wait | faction 3 | interactive alive |
| 180 | active | rebellion active | 2/high/.766 | 4 | 1 | 95 | 663/70/55/0/100 | .52,.80,wait \| .72,.72,wait | faction 3 | interactive alive |
| 360 | active | rebellion, coup active | 2/critical/.843 | 4 | 1 | 300 | 483/70/55/0/100 | .64,.80,wait \| .84,.80,wait | faction 3 | interactive alive |
| 720 | active | rebellion, coup active | 2/critical/.901 | 4 | 0 | 300 | 123/70/55/0/100 | .88,.80,wait \| .97,.80,wait | faction 3 | interactive alive |
| 1080 | active | rebellion, coup active | 3/critical/.901 | 0 | 0 | 300 | -237/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | temporarily quiet |
| 1800 | active | rebellion, coup active | 3/critical/.905 | 0 | 0 | 300 | -957/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | structurally stalled |
| 3600 | active | rebellion, coup active | 3/critical/.965 | 0 | 0 | 300 | -2757/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | structurally stalled |
| 7200 | active | rebellion, coup active | 3/critical/.985 | 0 | 0 | 300 | -6357/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | structurally stalled |

### B — material/economic relief

| Day | Outcome | Conflicts | Agenda count/highest | Available | Density | Last political | Country | Factions | Control | State |
| ---: | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |
| 0 | active | none | 2/medium/.576 | 4 | 0 | — | 500/70/55/20/100 | .40,.80,wait \| .60,.60,wait | country 3 | interactive alive |
| 90 | active | rebellion active | 2/high/.687 | 4 | 19 | 62 | 867/70/55/0/100 | .46,.80,wait \| .62,.66,wait | faction 3 | interactive alive |
| 180 | active | rebellion active | 2/high/.745 | 4 | 1 | 95 | 777/70/55/0/100 | .52,.80,wait \| .68,.72,wait | faction 3 | interactive alive |
| 360 | active | rebellion, coup active | 2/critical/.823 | 4 | 1 | 300 | 597/70/55/0/100 | .64,.80,wait \| .88,.80,wait | faction 3 | interactive alive |
| 720 | active | rebellion, coup active | 2/critical/.895 | 4 | 0 | 300 | 237/70/55/0/100 | .88,.80,wait \| .96,.80,wait | faction 3 | interactive alive |
| 1080 | active | rebellion, coup active | 3/critical/.895 | 0 | 0 | 300 | -123/70/55/0/100 | .96,.80,wait \| .96,.80,wait | faction 3 | temporarily quiet |
| 1800 | active | rebellion, coup active | 3/critical/.895 | 0 | 0 | 300 | -843/70/55/0/100 | .96,.80,wait \| .96,.80,wait | faction 3 | structurally stalled |
| 3600 | active | rebellion, coup active | 3/critical/.964 | 0 | 0 | 300 | -2643/70/55/0/100 | .96,.80,wait \| .96,.80,wait | faction 3 | structurally stalled |
| 7200 | active | rebellion, coup active | 3/critical/.984 | 0 | 0 | 300 | -6243/70/55/0/100 | .96,.80,wait \| .96,.80,wait | faction 3 | structurally stalled |

### C — political accommodation

| Day | Outcome | Conflicts | Agenda count/highest | Available | Density | Last political | Country | Factions | Control | State |
| ---: | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |
| 0 | active | none | 2/medium/.576 | 4 | 0 | — | 500/70/55/20/100 | .40,.80,wait \| .60,.60,wait | country 3 | interactive alive |
| 90 | active | none | 2/high/.653 | 4 | 12 | 65 | 1150/70/55/83.69/100 | .46,.80,wait \| .41,.66,wait | country 3 | interactive alive |
| 180 | active | none | 2/high/.696 | 4 | 1 | 95 | 1870/70/55/94.64/100 | .52,.80,wait \| .47,.72,wait | country 3 | interactive alive |
| 360 | active | coup, rebellion active | 2/high/.753 | 4 | 6 | 315 | 2807/70/55/0/100 | .64,.80,wait \| .59,.80,wait | faction 3 | interactive alive |
| 720 | active | coup, rebellion active | 2/critical/.861 | 4 | 0 | 315 | 2447/70/55/0/100 | .88,.80,wait \| .83,.80,wait | faction 3 | interactive alive |
| 1080 | active | coup, rebellion active | 2/critical/.901 | 4 | 0 | 315 | 2087/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | interactive alive |
| 1800 | active | coup, rebellion active | 2/critical/.901 | 4 | 0 | 315 | 1367/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | interactive alive |
| 3600 | active | coup, rebellion active | 3/critical/.901 | 0 | 0 | 315 | -433/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | structurally stalled |
| 7200 | active | coup, rebellion active | 3/critical/.976 | 0 | 0 | 315 | -4033/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | structurally stalled |

### D — legalization

| Day | Outcome | Conflicts | Agenda count/highest | Available | Density | Last political | Country | Factions | Control | State |
| ---: | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |
| 0 | active | none | 2/medium/.576 | 4 | 0 | — | 500/70/55/20/100 | .40,.80,wait \| .60,.60,wait | country 3 | interactive alive |
| 90 | active | coup, rebellion active | 2/high/.743 | 3 | 15 | 90 | 1120/70/55/83.69/100 | .66,.80,wait \| .56,.66,wait | country 3 | interactive alive |
| 180 | active | coup, rebellion active | 2/high/.786 | 3 | 7 | 105 | 1067/70/55/0/100 | .72,.80,wait \| .62,.72,wait | faction 3 | interactive alive |
| 360 | active | coup, rebellion active | 2/critical/.843 | 3 | 0 | 105 | 887/70/55/0/100 | .84,.80,wait \| .74,.80,wait | faction 3 | interactive alive |
| 720 | active | coup, rebellion active | 2/critical/.901 | 3 | 0 | 105 | 527/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | interactive alive |
| 1080 | active | coup, rebellion active | 2/critical/.901 | 3 | 0 | 105 | 167/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | interactive alive |
| 1800 | active | coup, rebellion active | 3/critical/.901 | 0 | 0 | 105 | -553/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | structurally stalled |
| 3600 | active | coup, rebellion active | 3/critical/.959 | 0 | 0 | 105 | -2353/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | structurally stalled |
| 7200 | active | coup, rebellion active | 3/critical/.983 | 0 | 0 | 105 | -5953/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | structurally stalled |

### E — coercive/restrictive

| Day | Outcome | Conflicts | Agenda count/highest | Available | Density | Last political | Country | Factions | Control | State |
| ---: | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |
| 0 | active | none | 2/medium/.576 | 4 | 0 | — | 500/70/55/20/100 | .40,.80,wait \| .60,.60,wait | country 3 | interactive alive |
| 90 | active | none | 2/high/.744 | 3 | 14 | 65 | 1145/70/55/83.69/100 | .46,.80,wait \| .76,.54,wait | country 3 | interactive alive |
| 180 | active | rebellion active | 2/high/.787 | 3 | 6 | 140 | 1407/70/55/0/100 | .52,.80,wait \| .82,.60,wait | faction 3 | interactive alive |
| 360 | active | rebellion, coup active | 2/critical/.868 | 3 | 1 | 300 | 1227/70/55/0/100 | .64,.80,wait \| .94,.72,wait | faction 3 | interactive alive |
| 720 | active | rebellion, coup active | 2/critical/.901 | 3 | 0 | 300 | 867/70/55/0/100 | .88,.80,wait \| .97,.80,wait | faction 3 | interactive alive |
| 1080 | active | rebellion, coup active | 2/critical/.901 | 3 | 0 | 300 | 507/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | interactive alive |
| 1800 | active | rebellion, coup active | 3/critical/.901 | 0 | 0 | 300 | -213/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | structurally stalled |
| 3600 | active | rebellion, coup active | 3/critical/.953 | 0 | 0 | 300 | -2013/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | structurally stalled |
| 7200 | active | rebellion, coup active | 3/critical/.982 | 0 | 0 | 300 | -5613/70/55/0/100 | .97,.80,wait \| .97,.80,wait | faction 3 | structurally stalled |

## Classification and pacing decision

```text
DEMO_HORIZON_STATUS: STRONG_SHORT_HORIZON_LATE_STALL
```

The early and medium audit windows remain active: every trajectory has real EventStore activity, Agenda read-model output, and at least three usable authored actions through Day 720. No-action and material relief reach a quiet state at Day 1080; every trajectory reaches sustained structural quiet by Day 1800–3600 as treasury pressure removes action availability while the active conflicts remain unresolved. This is the accepted late-state core risk, not a demo-layer fix.

The client therefore uses readable 1x/2x/3x presentation presets (`900/450/300 ms` per authoritative simulated day), with manual `+1/+7/+30` controls retained only as secondary capture/debug conveniences. A major-event auto-pause option is user-controlled and presentation-only. The demo result must disclose this late-state classification and must not claim Gate 1F completion.

The audit passed deterministic replay equality for the no-action trajectory and passed all five trajectories at all nine checkpoints. No scripted crisis, hidden countdown, timer, random pacing mechanic, Conflict deletion, or direct WorldState mutation was introduced.

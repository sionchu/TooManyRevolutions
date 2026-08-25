# GAMEBUILDERS_PRODUCT_SURFACE_P0 — MAP-FIRST PRODUCT CORRECTION

STATUS: REQUIRED
APPLIES_TO: GAMEBUILDERS_PRODUCT_SURFACE_P0
PRIORITY: P0 / OVERRIDES WEAKER SCREEN-COMPOSITION INTERPRETATIONS

## 0. Why this correction exists

The P0 task already says the map should dominate, but that is not strong enough. A layout can technically contain a large map while still feeling like a text-box web game.

TMR's original product direction is a **map-first systemic strategy game**, with Plague Inc. / Rebel Inc. as primary pacing references and an explicit spatial presentation contract:

```text
politics is calculated at Region scale
territory moves on LandHexes
ideology spreads as color/pattern
real organizations become map markers only when authoritative
revolution becomes territorial change
```

The finished P0 must therefore feel like a living political atlas / strategic world first, and a document/card interface second.

## 1. Main-screen composition — mandatory

### Wide desktop / laptop

The world map is the primary continuous surface.

Target visual allocation, not a rigid CSS formula:

```text
MAP / WORLD SURFACE: ~65–80% of usable viewport area
PERSISTENT CHROME + HUD: ~10–15%
CONTEXTUAL PANELS/DRAWERS: overlay the map edge or open on demand
```

Forbidden default composition:

```text
[large permanent text column] [small map] [large permanent text column]
```

The player should be able to glance at the screen and perceive the realm, neighboring states, political pressure, territorial control, and emerging crisis **before reading paragraphs**.

Recommended main composition:

```text
┌─────────────────────────────────────────────────────────────┐
│ compact state bar / date / time controls / critical alerts │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     LIVING WORLD MAP                        │
│                                                             │
│ country boundaries / names / terrain / settlements          │
│ ideology-pressure overlays / faction markers / contacts     │
│ territorial control / real derived fronts / crisis focus    │
│                                                             │
│  floating current issue       contextual foreign/state chip │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ contextual action tray / selected-region drawer / timeline  │
└─────────────────────────────────────────────────────────────┘
```

Agenda, Chronicle, Decisions, Foreign Powers, and Region details should primarily be **drawers, sheets, compact overlays, chips, or contextual panels**, not always-visible walls of cards.

## 2. Map itself must carry gameplay information

The map is not decorative background and not just a selectable hex diagram.

Use actual authoritative / derived data to make state changes readable spatially:

### Base geography
- terrain texture/symbols by actual LandHex terrain;
- country territory wash;
- stronger country borders;
- subtler Region boundaries;
- raw hex boundaries faint, hover-only, selection-only, or debug-only;
- country labels and Region labels;
- capital / settlement / mine / industrial / port POI only where supported by authored scenario metadata or explicit presentation metadata.

### Political layer
- Region ideology support/radicalism/organization as bounded overlay/pattern/heat, never copied as fake LandHex political state;
- actual Faction presence / organization tokens only when authoritative/presentation data supports them;
- current Agenda focus visibly locates affected Regions on map;
- foreign contact routes only from actual ContactGraph edges;
- country-to-country geopolitical presence through real neighboring Country entities.

### Crisis / territorial layer
- actual faction-controlled LandHexes visibly replace/contest country territory;
- actual derived fronts only when controllers differ across a real conflict edge;
- coup may produce no territorial change and must therefore use state/capital/political crisis presentation rather than recoloring the whole country;
- rebellion must become spatially legible when territorial control actually changes.

No invented armies, crowds, front lines, foreign units, or decorative wars.

## 3. Neighboring world — mandatory

The player realm must not float in empty space.

The GameBuilders scenario should show at least 2 meaningful neighboring non-player Countries if scenario validation remains stable.

Each visible neighbor must have:
- real CountryId;
- Government;
- Region(s);
- LandHex ownership/control;
- country name;
- country color / crest from design registry;
- capital or major settlement presentation metadata;
- actual ContactGraph relation/routes when authored.

The player should visually understand:

```text
this is my kingdom
these are neighboring powers
these borders/routes are how ideas/pressure can reach me
```

Do not draw fake countries as backdrop labels.

## 4. Interaction model — map first, text on demand

Primary interactions should be spatial where sensible:

- click/tap Region -> open Region sheet/drawer;
- click faction marker -> show faction context;
- click Agenda -> pulse/highlight affected Region(s) on map;
- click foreign power/crest -> focus its territory + compact foreign-power card;
- crisis alert -> focus the relevant map area/state marker;
- intervention selection -> map previews only **declared certain targets/effects**, never fabricated future territorial outcomes.

The player should not need to scan three permanent text columns to understand what changed.

## 5. Title -> build-up -> map reveal

The opening flow should visually build toward the map.

Do not use four full-screen text cards with paragraphs as the main fantasy delivery.

Preferred rhythm:

```text
TITLE / crest / short hook
-> visual briefing with map fragments, neighboring crests, one-sentence dispatches
-> final briefing beat reveals the complete political atlas
-> player enters the same atlas as the main gameplay surface
```

The main map reveal should feel like the player is being handed control of the realm.

Text per briefing beat should remain short enough to read in ~3–5 seconds.

## 6. Responsive behavior

### >= 1440
- map occupies most viewport;
- compact top bar;
- one edge drawer can remain open without shrinking map below dominant status.

### 1024–1439
- map still primary;
- side content becomes overlay drawers;
- no permanent 3-column dashboard.

### 768–1023
- near-full map with one contextual sheet at a time.

### < 768
- map occupies the primary screen;
- bottom tabs/sheets: `지도 / 국정 / 결정 / 기록`;
- sheets slide over map and can be dismissed;
- never stack all desktop cards into a long scrolling webpage.

## 7. Visual density and anti-web-app rules

Fail P0 if any of the following remain true:

- the first impression is a dashboard/SaaS/admin panel;
- the map is a card inside the interface rather than the interface's primary surface;
- more than half of the default desktop viewport is persistent text/card UI;
- raw hex outlines are the strongest map element;
- neighboring states are absent or decorative-only;
- the player cannot locate a current Agenda/crisis spatially;
- opening is mostly paragraphs in boxes;
- interactions primarily happen by scrolling down a webpage;
- mobile is a long vertical stack of desktop cards.

## 8. Reference intent

Use these only as structural references, not copied assets:

- Plague Inc.: world map is the persistent systemic surface; global change is visible spatially.
- Rebel Inc.: map-first stabilization/insurgency play, with initiatives and information as supporting layers rather than the world being reduced to text boxes.
- Crusader Kings III: political geography, neighbors, territory labels, heraldry.
- Suzerain / Papers, Please: title, political identity, document flavor, and decision framing — **not** the default main-screen spatial layout for TMR.

This distinction is important: Suzerain/Papers Please are useful for narrative/decision surfaces, but TMR's persistent core playfield should remain map-first.

## 9. Acceptance additions

P0 cannot PASS unless:

```text
MAP_IS_PRIMARY_PLAYFIELD: YES
DEFAULT_DESKTOP_MAP_SHARE_APPROX_65_80_PERCENT: YES
DEFAULT_THREE_COLUMN_TEXT_DASHBOARD: NO
MAP_IS_NOT_A_CARD: YES
AGENDA_CAN_FOCUS_MAP_REGION: YES
REGION_DETAIL_IS_CONTEXTUAL_DRAWER_OR_SHEET: YES
DECISION_UI_IS_CONTEXTUAL_NOT_PERMANENT_WALL: YES
NEIGHBORING_COUNTRIES_SPATIALLY_VISIBLE: YES
RAW_HEX_GRID_VISUAL_PRIORITY: LOW_OR_DEBUG_ONLY
MOBILE_MAP_FIRST_BOTTOM_SHEETS: YES
TITLE_BRIEFING_BUILDS_TO_MAP_REVEAL: YES
```

All prior simulation-authority and anti-fake-data constraints remain unchanged.

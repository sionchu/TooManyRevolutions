export type ScreenId =
  "tmr.screen.title" | "tmr.screen.opening-briefing" | "tmr.screen.main-game";

export interface ScreenDefinition {
  readonly id: ScreenId;
  readonly name: string;
  readonly primaryLayerId:
    "tmr.layer.map.atmosphere" | "tmr.layer.ui.chrome" | "tmr.layer.ui.overlay";
  readonly stableRoute: string;
}

export const TMR_SCREEN_REGISTRY: readonly ScreenDefinition[] = [
  {
    id: "tmr.screen.title",
    name: "타이틀",
    primaryLayerId: "tmr.layer.map.atmosphere",
    stableRoute: "title",
  },
  {
    id: "tmr.screen.opening-briefing",
    name: "개막 브리핑",
    primaryLayerId: "tmr.layer.ui.overlay",
    stableRoute: "opening-briefing",
  },
  {
    id: "tmr.screen.main-game",
    name: "국정 지도",
    primaryLayerId: "tmr.layer.ui.chrome",
    stableRoute: "main-game",
  },
] as const;

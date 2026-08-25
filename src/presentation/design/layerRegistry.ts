export type DesignLayerId =
  | "tmr.layer.map.atmosphere"
  | "tmr.layer.map.terrain"
  | "tmr.layer.map.political"
  | "tmr.layer.map.settlements"
  | "tmr.layer.map.routes"
  | "tmr.layer.map.pressure"
  | "tmr.layer.map.labels"
  | "tmr.layer.ui.chrome"
  | "tmr.layer.ui.overlay"
  | "tmr.layer.ui.fx";

export interface DesignLayerDefinition {
  readonly id: DesignLayerId;
  readonly zIndex: number;
  readonly name: string;
  readonly surface: "map" | "ui";
  readonly debugToggleable: boolean;
}

/**
 * The visual stack is a contract, not an implementation detail of one
 * component. Each layer can be hidden by design-debug tooling without
 * changing the simulation or the normal player flow.
 */
export const TMR_LAYER_REGISTRY: readonly DesignLayerDefinition[] = [
  {
    id: "tmr.layer.map.atmosphere",
    zIndex: 0,
    name: "종이 대기",
    surface: "map",
    debugToggleable: true,
  },
  {
    id: "tmr.layer.map.terrain",
    zIndex: 10,
    name: "지형",
    surface: "map",
    debugToggleable: true,
  },
  {
    id: "tmr.layer.map.political",
    zIndex: 20,
    name: "국가와 국경",
    surface: "map",
    debugToggleable: true,
  },
  {
    id: "tmr.layer.map.settlements",
    zIndex: 30,
    name: "수도와 정착지",
    surface: "map",
    debugToggleable: true,
  },
  {
    id: "tmr.layer.map.routes",
    zIndex: 40,
    name: "접촉 경로",
    surface: "map",
    debugToggleable: true,
  },
  {
    id: "tmr.layer.map.pressure",
    zIndex: 50,
    name: "정치 압력",
    surface: "map",
    debugToggleable: true,
  },
  {
    id: "tmr.layer.map.labels",
    zIndex: 60,
    name: "지명과 국명",
    surface: "map",
    debugToggleable: true,
  },
  {
    id: "tmr.layer.ui.chrome",
    zIndex: 70,
    name: "국정 UI",
    surface: "ui",
    debugToggleable: true,
  },
  {
    id: "tmr.layer.ui.overlay",
    zIndex: 80,
    name: "서류와 패널",
    surface: "ui",
    debugToggleable: true,
  },
  {
    id: "tmr.layer.ui.fx",
    zIndex: 90,
    name: "피드백",
    surface: "ui",
    debugToggleable: true,
  },
] as const;

export const TMR_LAYER_IDS = new Set<DesignLayerId>(
  TMR_LAYER_REGISTRY.map((layer) => layer.id),
);

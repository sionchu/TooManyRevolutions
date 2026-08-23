import type { CountryId, FactionId, IdeologyId, RegionId } from "./ids";
import type { IdeologyState } from "./ideology";

export type ResourceType = "food" | "material" | "mana" | "arms";

/** Stable iteration order for all T011 resource calculations. */
export const RESOURCE_TYPES: readonly ResourceType[] = [
  "food",
  "material",
  "mana",
  "arms",
] as const;

export type ResourceStock = Partial<Record<ResourceType, number>>;

/** The exclusive physical controller of one LandHex at runtime. */
export type TerritorialController =
  | { readonly kind: "country"; readonly countryId: CountryId }
  | { readonly kind: "faction"; readonly factionId: FactionId }
  | { readonly kind: "uncontrolled" };

export interface Region {
  readonly id: RegionId;
  readonly name: string;
  readonly ownerCountryId: CountryId;
  readonly population: number;
  readonly urbanization: number;
  readonly accessibility: number;
  readonly resources: ResourceStock;
  /** Maximum per-day output by resource. */
  readonly resourceProductionCapacity: ResourceStock;
  /** Actual output by resource from the most recently completed day. */
  readonly resourceProduction: ResourceStock;
  /** Per-day local demand by resource. */
  readonly resourceDemand: ResourceStock;
  readonly production: number;
  readonly stateControl: number;
  readonly infrastructure: number;
  readonly scarcity: number;
  readonly unrest: number;
  readonly ideology: Readonly<Record<IdeologyId, IdeologyState>>;
}

/** Static controller used only to seed LandHexRuntimeState at run creation. */
export interface ScenarioRegion extends Region {
  readonly initialController: TerritorialController;
}

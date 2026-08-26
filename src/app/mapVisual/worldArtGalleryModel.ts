import {
  getRegionComposition,
  regionCompositionRoles,
  type RegionCompositionRole,
} from "../../presentation/mapContent/regionComposition";
import {
  getProceduralWorldArtKit,
  type ProceduralWorldArtKit,
} from "../../presentation/mapVisual/proceduralKitGeometry";
import type { MapObjectFamily } from "../../presentation/mapVisual/worldArt";

export interface WorldArtGalleryPlacement {
  readonly family: MapObjectFamily;
  readonly kitId: ProceduralWorldArtKit["kitId"];
  readonly relativeScale: number;
  readonly offset: readonly [x: number, z: number];
}

export interface WorldArtGalleryPanel {
  readonly role: RegionCompositionRole;
  readonly compositionId: string;
  readonly previewOnly: true;
  readonly labelsVisible: false;
  readonly placements: readonly WorldArtGalleryPlacement[];
}

/**
 * Authoring-only art catalog. It intentionally displays every authored
 * silhouette in each role so artists can compare the five families without
 * labels. Production rendering must use resolveRegionCompositionPlacements.
 */
export function createWorldArtGallerySnapshot(): readonly WorldArtGalleryPanel[] {
  return regionCompositionRoles().map((role) => {
    const composition = getRegionComposition(role);
    return {
      role,
      compositionId: composition.compositionId,
      previewOnly: true,
      labelsVisible: false,
      placements: composition.objects.map((placement) => {
        const kit = getProceduralWorldArtKit(placement.family);
        if (kit === undefined) {
          throw new Error(`Missing procedural kit for ${placement.family}.`);
        }
        return {
          family: placement.family,
          kitId: kit.kitId,
          relativeScale: kit.relativeScale,
          offset: placement.offset,
        };
      }),
    };
  });
}

export const WORLD_ART_GALLERY_ROLES = regionCompositionRoles();

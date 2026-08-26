import {
  buildContentRegistry,
  resolveOpeningBriefingContent,
  resolveTitleContent,
  type ResolvedOpeningBriefingContent,
  type ResolvedTitleContent,
} from "./contentRegistry";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../../sim/state/gameBuildersDemoScenario";

/**
 * Reviewed static content pack consumed by the demo runtime. Content Studio
 * edits a local draft of the same stable records and exports a patch; it does
 * not write this module or call an LLM at runtime.
 */
export const GAMEBUILDERS_DEMO_CONTENT_RECORDS = buildContentRegistry(
  GAMEBUILDERS_DEMO_SCENARIO,
);

export function getGameBuildersTitleContent(): ResolvedTitleContent {
  return resolveTitleContent(GAMEBUILDERS_DEMO_CONTENT_RECORDS);
}

export function getGameBuildersOpeningBriefingContent(): ResolvedOpeningBriefingContent {
  return resolveOpeningBriefingContent(GAMEBUILDERS_DEMO_CONTENT_RECORDS);
}

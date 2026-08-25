export type Brand<Value, Tag extends string> = Value & {
  readonly __brand: Tag;
};

export type CountryId = Brand<string, "CountryId">;
export type RegionId = Brand<string, "RegionId">;
export type LandHexId = Brand<string, "LandHexId">;
export type IdeologyId = Brand<string, "IdeologyId">;
export type FactionId = Brand<string, "FactionId">;
export type PolicyId = Brand<string, "PolicyId">;
export type ConflictId = Brand<string, "ConflictId">;
export type GovernmentId = Brand<string, "GovernmentId">;
export type ScenarioId = Brand<string, "ScenarioId">;
export type ContactEdgeId = Brand<string, "ContactEdgeId">;
export type CoupCoordinationNodeId = Brand<string, "CoupCoordinationNodeId">;
export type RebellionOperationalChannelId = Brand<
  string,
  "RebellionOperationalChannelId"
>;
export type RebellionPersistenceProfileId = Brand<
  string,
  "RebellionPersistenceProfileId"
>;
export type InterventionId = Brand<string, "InterventionId">;
export type InterventionCommitmentId = Brand<
  string,
  "InterventionCommitmentId"
>;
export type FactionFundMovementCommitmentId = Brand<
  string,
  "FactionFundMovementCommitmentId"
>;
export type PoliticalProposalId = Brand<string, "PoliticalProposalId">;
export type ActionId = Brand<string, "ActionId">;
export type EventId = Brand<string, "EventId">;

export type EntityId =
  | CountryId
  | RegionId
  | LandHexId
  | IdeologyId
  | FactionId
  | PolicyId
  | ConflictId
  | GovernmentId
  | CoupCoordinationNodeId
  | InterventionId
  | InterventionCommitmentId
  | FactionFundMovementCommitmentId
  | PoliticalProposalId;

export const asCountryId = (value: string): CountryId => value as CountryId;
export const asRegionId = (value: string): RegionId => value as RegionId;
export const asLandHexId = (value: string): LandHexId => value as LandHexId;
export const asIdeologyId = (value: string): IdeologyId => value as IdeologyId;
export const asFactionId = (value: string): FactionId => value as FactionId;
export const asPolicyId = (value: string): PolicyId => value as PolicyId;
export const asConflictId = (value: string): ConflictId => value as ConflictId;
export const asGovernmentId = (value: string): GovernmentId =>
  value as GovernmentId;
export const asScenarioId = (value: string): ScenarioId => value as ScenarioId;
export const asContactEdgeId = (value: string): ContactEdgeId =>
  value as ContactEdgeId;
export const asCoupCoordinationNodeId = (
  value: string,
): CoupCoordinationNodeId => value as CoupCoordinationNodeId;
export const asRebellionOperationalChannelId = (
  value: string,
): RebellionOperationalChannelId => value as RebellionOperationalChannelId;
export const asRebellionPersistenceProfileId = (
  value: string,
): RebellionPersistenceProfileId => value as RebellionPersistenceProfileId;
export const asInterventionId = (value: string): InterventionId =>
  value as InterventionId;
export const asInterventionCommitmentId = (
  value: string,
): InterventionCommitmentId => value as InterventionCommitmentId;
export const asFactionFundMovementCommitmentId = (
  value: string,
): FactionFundMovementCommitmentId => value as FactionFundMovementCommitmentId;
export const asPoliticalProposalId = (value: string): PoliticalProposalId =>
  value as PoliticalProposalId;
export const asActionId = (value: string): ActionId => value as ActionId;
export const asEventId = (value: string): EventId => value as EventId;

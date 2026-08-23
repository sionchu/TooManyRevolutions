/**
 * Canonical registration intentionally has no public marker API.
 *
 * RunRecord registration is private to persistence.ts and
 * SimulationStepResult registration is private to tick.ts. This module is
 * retained as an explicit boundary marker for callers that previously
 * imported canonical registration helpers.
 */
export {};

import {
  formatF05Fix9LateSteadyStateAudit,
  runF05Fix9LateSteadyStateAudit,
} from "./f05Fix9LateSteadyStateAudit";

process.stdout.write(
  `${formatF05Fix9LateSteadyStateAudit(runF05Fix9LateSteadyStateAudit())}\n`,
);

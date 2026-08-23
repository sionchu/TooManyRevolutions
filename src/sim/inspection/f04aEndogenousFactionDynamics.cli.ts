import {
  formatF04AInspection,
  runF04AInspection,
} from "./f04aEndogenousFactionDynamics";

const report = runF04AInspection();
process.stdout.write(`${formatF04AInspection(report.result)}\n`);

if (!report.allPassed) {
  process.exitCode = 1;
}

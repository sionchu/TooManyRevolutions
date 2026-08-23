import {
  formatF04BInspection,
  runF04BDiagnosis,
} from "./f04bActiveConflictRecoveryAgency";

process.stdout.write(`${formatF04BInspection(runF04BDiagnosis())}\n`);

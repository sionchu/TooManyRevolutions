import {
  formatGate1FR1Sweep,
  formatGate1FR1Repeatability,
  inspectGate1FR1RepeatedAccommodationExploit,
  runGate1FR1CounterfactualSweep,
  verifyGate1FR1CanonicalRecoveryPath,
} from "./gate1fR1RecoveryRepair";
import { F04D_R1_SELECTED_POLITICAL_ACCOMMODATION_ORGANIZATION_DELTA } from "../state/gate1fValidationFixture";
import { runGate1FDiagnosisV2 } from "./gate1fDiagnosisV2";

const sweep = runGate1FR1CounterfactualSweep();
console.log(formatGate1FR1Sweep(sweep));
const canonical = verifyGate1FR1CanonicalRecoveryPath(
  F04D_R1_SELECTED_POLITICAL_ACCOMMODATION_ORGANIZATION_DELTA,
);
console.log(
  `canonical completion=${canonical.firstCompletionRelativeTick}d recovery=${canonical.firstRecoveryRelativeTick ?? "none"}d intent=${canonical.firstRecoveryIntentReason ?? "none"} target=${canonical.firstRecoveryIntentTargetHexId ?? "none"} strengths=${canonical.firstRecoveryActingStrength ?? "none"}/${canonical.firstRecoveryOpposingStrength ?? "none"} directControllerAtCompletion=${canonical.directControllerMutationAtCompletion}`,
);
const diagnosis = runGate1FDiagnosisV2();
console.log(
  `36-branch count=${diagnosis.branches.length} baselineReproduced=${diagnosis.baselineReproduced} trajectoryMismatches=${diagnosis.baselineComparison.trajectorySignatureMismatches.length} actionMismatches=${diagnosis.baselineComparison.actionCountMismatches.length} silenceMismatches=${diagnosis.baselineComparison.silenceMismatches.length}`,
);
console.log(
  formatGate1FR1Repeatability(
    diagnosis,
    inspectGate1FR1RepeatedAccommodationExploit(diagnosis),
  ),
);

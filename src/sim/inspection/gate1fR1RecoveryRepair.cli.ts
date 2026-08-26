import {
  formatGate1FR1Sweep,
  runGate1FR1CounterfactualSweep,
  verifyGate1FR1CanonicalRecoveryPath,
} from "./gate1fR1RecoveryRepair";
import { F04D_R1_SELECTED_POLITICAL_ACCOMMODATION_ORGANIZATION_DELTA } from "../state/gate1fValidationFixture";

const sweep = runGate1FR1CounterfactualSweep();
console.log(formatGate1FR1Sweep(sweep));
const canonical = verifyGate1FR1CanonicalRecoveryPath(
  F04D_R1_SELECTED_POLITICAL_ACCOMMODATION_ORGANIZATION_DELTA,
);
console.log(
  `canonical completion=${canonical.firstCompletionRelativeTick}d recovery=${canonical.firstRecoveryRelativeTick ?? "none"}d intent=${canonical.firstRecoveryIntentReason ?? "none"} target=${canonical.firstRecoveryIntentTargetHexId ?? "none"} strengths=${canonical.firstRecoveryActingStrength ?? "none"}/${canonical.firstRecoveryOpposingStrength ?? "none"} directControllerAtCompletion=${canonical.directControllerMutationAtCompletion}`,
);

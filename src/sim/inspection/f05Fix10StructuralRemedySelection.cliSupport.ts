import {
  formatF05Fix10StructuralRemedySelection,
  runF05Fix10StructuralRemedySelection,
} from "./f05Fix10StructuralRemedySelection";

export function printF05Fix10Inspection(): void {
  const result = runF05Fix10StructuralRemedySelection();
  console.log(formatF05Fix10StructuralRemedySelection(result));
}

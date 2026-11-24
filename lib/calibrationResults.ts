// Calibration results for each child.
// For now these are saved in localStorage (this browser only).
// TODO: switch save/get/hasCompleted to the calibration_results table.
// Keep the function names and return types the same so nothing else breaks.

import { getChild } from "@/lib/children";

import { createAIProfile } from "@/lib/ai-profiles";


export const CALIBRATION_SUBJECTS = ["math", "science", "literature"] as const;

// Final grade per subject. 3 = Below Grade 4.
export type CalibrationResults = {
  math: number;
  science: number;
  literature: number;
};

function storageKey(childId: string): string {
  return `calibration-results-${childId}`;
}

// Called once all 3 subjects are done. error is null if it saved.
export async function saveCalibrationResults(
  childId: string,
  results: CalibrationResults
): Promise<{ error: string | null }> {
  try {
    localStorage.setItem(storageKey(childId), JSON.stringify(results));

    const { data } = await getChild(childId);

if (data) {
  await createAIProfile(
    childId,
    data.name,
    results.math,
    results.science,
    results.literature
  );
}
    return { error: null };
  } catch {
    return { error: "Could not save the calibration results." };
  }
}

// null if the child has no results yet.
export async function getCalibrationResults(
  childId: string
): Promise<CalibrationResults | null> {
  try {
    const saved = localStorage.getItem(storageKey(childId));
    return saved === null ? null : (JSON.parse(saved) as CalibrationResults);
  } catch {
    return null;
  }
}

// Grade level Bud talks at for a subject: the calibration result if there
// is one, otherwise the child's school grade.
export async function getChildLevel(
  childId: string,
  subject: (typeof CALIBRATION_SUBJECTS)[number]
): Promise<number | null> {
  const results = await getCalibrationResults(childId);
  if (results !== null) {
    return results[subject];
  }

  const { data } = await getChild(childId);
  return data ? data.grade : null;
}

// Used by CalibrationGate to send first-time kids to calibration.
export async function hasCompletedCalibration(childId: string): Promise<boolean> {
  try {
    return localStorage.getItem(storageKey(childId)) !== null;
  } catch {
    return true; // can't read storage, so don't block the kid
  }
}

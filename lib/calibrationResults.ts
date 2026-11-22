/** Saving and checking a child's calibration results.
 *
 * TEMPORARY VERSION: results are stored in this browser only (localStorage),
 * so first-time routing can be built and demoed before the database part is
 * ready. They are not shared between devices and disappear if the browser's
 * site data is cleared.
 *
 * TO DO (Laura, database): replace the inside of these two functions with
 * Supabase calls to the calibration_results table. Keep the names, inputs and
 * outputs the same, and nothing else in the app needs to change:
 *   - saveCalibrationResults: insert one row per subject
 *   - hasCompletedCalibration: true if the child has results for every subject
 */

// The subjects a child must finish for calibration to count as done.
export const CALIBRATION_SUBJECTS = ["math", "science", "literature"] as const;

// The final grade for each subject (see climbLadder in lib/calibration.ts).
// 3 means "Below Grade 4".
export type CalibrationResults = {
  math: number;
  science: number;
  literature: number;
};

/** The browser storage key for one child, e.g. "calibration-results-<child id>". */
function storageKey(childId: string): string {
  return `calibration-results-${childId}`;
}

/** Saves a child's calibration results once every subject is finished.
 * Returns { error }; error is null when saving worked.
 */
export async function saveCalibrationResults(
  childId: string,
  results: CalibrationResults
): Promise<{ error: string | null }> {
  try {
    localStorage.setItem(storageKey(childId), JSON.stringify(results));
    return { error: null };
  } catch {
    // Storage can be blocked (e.g. private browsing). The child can still
    // use the app; they will just be asked to do calibration again next time.
    return { error: "Could not save the calibration results." };
  }
}

/** Checks whether a child has finished calibration (all subjects).
 * Used to send first-time children to the calibration test.
 */
export async function hasCompletedCalibration(childId: string): Promise<boolean> {
  try {
    return localStorage.getItem(storageKey(childId)) !== null;
  } catch {
    // If storage can't be read, don't block the child from the app.
    return true;
  }
}

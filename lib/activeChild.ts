/** Which child is using the app on this browser.
 *
 * The welcome page saves the picked child's id (through CalibrationGate), the
 * side menu's "Switch learner" removes it (components/ChildNavbar.tsx), and
 * pages like the chat read it here. Stored as "selectedChildId", the same
 * name the side menu uses.
 */

const STORAGE_KEY = "selectedChildId";

/** Saves the id of the child using the app. */
export function setActiveChildId(childId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, childId);
  } catch {
    // Storage blocked (e.g. some private browsing modes): the app still
    // works, it just won't know which child is chatting.
  }
}

/** The id of the child using the app, or null if none was picked. */
export function getActiveChildId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

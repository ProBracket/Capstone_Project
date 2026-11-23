/** Which child is using the app on this browser.
 *
 * The welcome page saves the picked child's id as "selectedChildId", and the
 * side menu's "Switch learner" removes it (see app/child/welcome/page.tsx and
 * components/ChildNavbar.tsx). Pages like the chat read it here.
 */

const STORAGE_KEY = "selectedChildId";

/** The id of the child using the app, or null if none was picked. */
export function getActiveChildId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage blocked: the app works, it just doesn't know the child
  }
}

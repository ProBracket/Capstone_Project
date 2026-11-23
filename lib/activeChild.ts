/** Remembers which child is using the app in this browser tab.
 *
 * The profile picker opens /child/welcome?childId=<id>, but the child pages'
 * links (side menu, cards) don't carry the id. So the welcome page saves it
 * here, and other pages (like the chat) read it back.
 *
 * sessionStorage is used: it belongs to this browser tab only and is cleared
 * when the tab is closed. It only holds the child's id, which is useless
 * without the parent's login (the database only shows a parent their own
 * children).
 */

const STORAGE_KEY = "active-child-id";

/** Saves the id of the child using the app in this tab. */
export function setActiveChildId(childId: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, childId);
  } catch {
    // Storage blocked (e.g. some private browsing modes): the app still
    // works, it just won't know which child is chatting.
  }
}

/** The id of the child using the app in this tab, or null if unknown. */
export function getActiveChildId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

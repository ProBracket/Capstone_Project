import { supabase } from "@/lib/supabase";

export async function getChildrenWithPin() {
    const { data, error } = await supabase.rpc("children_with_pin");
    const ids: string[] = (data ?? []).map((row: { child_id: string }) => row.child_id);
    return { data: ids, error };
}

export function setChildPin(childId: string, picks: string[]) {
    return supabase.rpc("set_child_pin", {
        p_child_id: childId,
        new_pin: picks.join("-")
    });
}

export function removeChildPin(childId: string) {
    return supabase.rpc("remove_child_pin", { p_child_id: childId });
}

export function verifyChildPin(childId: string, picks: string[]) {
    return supabase.rpc("verify_child_pin", { p_child_id: childId, pin: picks.join("-") });
}

export function selectChild(childId: string) {
     return supabase.rpc("select_child",  { p_child_id: childId });  
}

/** Nobody is playing on this device. Call whenever the profile picker shows.
 * async + await on purpose: Supabase only sends a request once something
 * awaits it, so this way `void clearActiveChild()` still sends it.
 */
export async function clearActiveChild() {
    return await supabase.rpc("clear_active_child");
}

/** Which child is playing on this device. Returns { data: child id or null, error }. */
export function getActiveChild() {
    return supabase.rpc("get_active_child");
}
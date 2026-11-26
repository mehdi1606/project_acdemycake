/**
 * One popup per visit. The badge celebration, the "What's new" notes and the
 * challenge announcement used to queue up and appear one after another at
 * login. Now the first one to ask takes this visit's slot; the others wait
 * for a later visit (they are not marked as seen, so nothing is lost).
 */
const SLOT_KEY = 'sl_popup_slot';

export function claimPopupSlot(id: string): boolean {
  try {
    const taken = sessionStorage.getItem(SLOT_KEY);
    if (!taken) { sessionStorage.setItem(SLOT_KEY, id); return true; }
    return taken === id;
  } catch {
    return true; // storage blocked: behave as before
  }
}

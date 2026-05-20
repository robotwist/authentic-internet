/**
 * True when focus is in a text-editing control so global game hotkeys should not run.
 * Use from window/document keydown handlers (movement, dock shortcuts, portal Space, etc.).
 */
export function isTextEntryFocused(doc = typeof document !== "undefined" ? document : null) {
  if (!doc?.activeElement) return false;
  const el = doc.activeElement;
  if (el === doc.body) return false;

  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    if (el.disabled || el.readOnly) return false;
    return true;
  }
  if (el.isContentEditable) {
    return true;
  }
  const role = el.getAttribute?.("role");
  if (role === "textbox" || role === "searchbox" || role === "combobox") {
    return true;
  }
  if (typeof el.closest === "function" && el.closest("[data-skip-global-hotkeys]")) {
    return true;
  }
  return false;
}

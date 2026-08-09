/**
 * Keep a single mutable Text Adventure world instance across React re-renders.
 * Creating the world object during render wipes interaction/knowledge/exit mutations.
 */
export function getStableGameWorld(ref, createWorld) {
  if (!ref?.current) {
    ref.current = createWorld();
  }
  return ref.current;
}

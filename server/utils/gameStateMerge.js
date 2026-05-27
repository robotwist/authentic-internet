const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const mergeGameState = (existingState = {}, incomingState = {}) => {
  if (!isPlainObject(existingState)) return incomingState;
  if (!isPlainObject(incomingState)) return existingState;

  return Object.entries(incomingState).reduce(
    (mergedState, [key, value]) => {
      if (isPlainObject(value) && isPlainObject(mergedState[key])) {
        mergedState[key] = mergeGameState(mergedState[key], value);
      } else {
        mergedState[key] = value;
      }

      return mergedState;
    },
    { ...existingState },
  );
};

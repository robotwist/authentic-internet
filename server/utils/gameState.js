export const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const mergeGameState = (existingState = {}, incomingState = {}) => {
  const mergedState = { ...existingState };

  Object.entries(incomingState).forEach(([key, value]) => {
    if (isPlainObject(value) && isPlainObject(existingState[key])) {
      mergedState[key] = mergeGameState(existingState[key], value);
    } else {
      mergedState[key] = value;
    }
  });

  return mergedState;
};

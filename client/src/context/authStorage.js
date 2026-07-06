const LARGE_USER_STORAGE_FIELDS = ["characterSprite"];

const isObject = (value) => value && typeof value === "object";

export const userForLocalStorage = (user) => {
  if (!isObject(user)) return user;

  return LARGE_USER_STORAGE_FIELDS.reduce((sanitizedUser, field) => {
    const { [field]: _removed, ...rest } = sanitizedUser;
    return rest;
  }, user);
};

export const storedUserNeedsMigration = (user) => {
  if (!isObject(user)) return false;

  return LARGE_USER_STORAGE_FIELDS.some((field) =>
    Object.prototype.hasOwnProperty.call(user, field),
  );
};

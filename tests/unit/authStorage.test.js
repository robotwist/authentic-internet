import {
  storedUserNeedsMigration,
  userForLocalStorage,
} from "../../client/src/context/authStorage";

describe("auth storage helpers", () => {
  it("removes character sprites before persisting users", () => {
    const user = {
      id: "user-1",
      username: "sprite-owner",
      characterSprite: "data:image/png;base64,very-large-sprite",
      characterName: "Ada",
      level: 4,
    };

    expect(userForLocalStorage(user)).toEqual({
      id: "user-1",
      username: "sprite-owner",
      characterName: "Ada",
      level: 4,
    });
  });

  it("detects legacy stored users that still contain large sprite fields", () => {
    expect(
      storedUserNeedsMigration({
        id: "legacy-user",
        characterSprite: "data:image/png;base64,old-sprite",
      }),
    ).toBe(true);

    expect(
      storedUserNeedsMigration({
        id: "current-user",
        characterName: "Grace",
      }),
    ).toBe(false);
  });
});

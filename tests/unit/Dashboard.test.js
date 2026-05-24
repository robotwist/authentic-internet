import {
  hasSavedCharacter,
  shouldRedirectToCharacterCreator,
} from "../../client/src/pages/dashboardCharacter";

describe("Dashboard character redirect", () => {
  test("recognizes saved character data from auth or fetched profile", () => {
    expect(hasSavedCharacter({ characterSprite: "data:image/png;base64,a" })).toBe(
      true,
    );
    expect(hasSavedCharacter({ hasCharacterSprite: true })).toBe(true);
    expect(
      hasSavedCharacter({}, { characterSprite: "data:image/png;base64,b" }),
    ).toBe(true);
    expect(hasSavedCharacter({}, {})).toBe(false);
  });

  test("waits for the character lookup before redirecting users missing sprite data in auth state", () => {
    expect(
      shouldRedirectToCharacterCreator({
        user: { id: "user-1", username: "Ada" },
        character: undefined,
        characterLoadFailed: false,
        characterCreatorSkipped: null,
      }),
    ).toBe(false);
  });

  test("does not redirect when character lookup failed and the server state is unknown", () => {
    expect(
      shouldRedirectToCharacterCreator({
        user: { id: "user-1", username: "Ada" },
        character: null,
        characterLoadFailed: true,
        characterCreatorSkipped: null,
      }),
    ).toBe(false);
  });

  test("does not redirect when fetched profile confirms a saved character", () => {
    expect(
      shouldRedirectToCharacterCreator({
        user: { id: "user-1", username: "Ada" },
        character: {
          id: "user-1",
          characterSprite: "data:image/png;base64,saved",
        },
        characterLoadFailed: false,
        characterCreatorSkipped: null,
      }),
    ).toBe(false);
  });

  test("redirects after the server confirms the user has no saved character", () => {
    expect(
      shouldRedirectToCharacterCreator({
        user: { id: "user-1", username: "Ada" },
        character: { id: "user-1" },
        characterLoadFailed: false,
        characterCreatorSkipped: null,
      }),
    ).toBe(true);
  });
});

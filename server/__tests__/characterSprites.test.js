import {
  CHARACTER_SPRITE_VALIDATION_MESSAGE,
  isValidCharacterSpriteReference,
} from "../utils/characterSprites.js";

describe("character sprite reference validation", () => {
  it("accepts generated sprite data URLs", () => {
    expect(isValidCharacterSpriteReference("data:image/png;base64,abc123")).toBe(true);
  });

  it("accepts managed character image upload paths", () => {
    expect(
      isValidCharacterSpriteReference("/uploads/characters/character-123_processed.png"),
    ).toBe(true);
  });

  it("rejects arbitrary paths and external URLs", () => {
    expect(isValidCharacterSpriteReference("/uploads/avatars/avatar.png")).toBe(false);
    expect(isValidCharacterSpriteReference("https://example.com/character.png")).toBe(false);
    expect(isValidCharacterSpriteReference("../characters/character.png")).toBe(false);
  });

  it("exports the API validation message", () => {
    expect(CHARACTER_SPRITE_VALIDATION_MESSAGE).toContain("saved character image path");
  });
});

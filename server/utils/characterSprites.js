const MANAGED_CHARACTER_IMAGE_PATH = /^\/uploads\/characters\/[A-Za-z0-9._-]+\.png$/;

export const CHARACTER_SPRITE_VALIDATION_MESSAGE =
  "Character sprite must be a valid image data URL or saved character image path";

export const isValidCharacterSpriteReference = (spriteData) => (
  typeof spriteData === "string" &&
  (
    spriteData.startsWith("data:image/") ||
    MANAGED_CHARACTER_IMAGE_PATH.test(spriteData)
  )
);

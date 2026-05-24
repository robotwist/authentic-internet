export const hasSavedCharacter = (user, character) =>
  Boolean(
    user?.characterSprite ||
      user?.hasCharacterSprite ||
      character?.characterSprite ||
      character?.hasCharacterSprite,
  );

export const shouldRedirectToCharacterCreator = ({
  user,
  character,
  characterLoadFailed,
  characterCreatorSkipped,
}) =>
  Boolean(
    user &&
      character !== undefined &&
      !characterLoadFailed &&
      !hasSavedCharacter(user, character) &&
      !characterCreatorSkipped,
  );

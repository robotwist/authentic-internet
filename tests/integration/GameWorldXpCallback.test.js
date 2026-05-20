import fs from 'fs';
import path from 'path';

describe('GameWorld XP callback wiring', () => {
  it('declares addExperiencePoints after awardXP and uses the notification API', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'client/src/components/GameWorld.jsx'),
      'utf8',
    );

    const awardXpIndex = source.indexOf('const awardXP = useCallback');
    const addExperienceIndex = source.indexOf('const addExperiencePoints = useCallback');

    expect(awardXpIndex).toBeGreaterThan(-1);
    expect(addExperienceIndex).toBeGreaterThan(-1);
    expect(addExperienceIndex).toBeGreaterThan(awardXpIndex);

    const addExperienceBlock = source.slice(
      addExperienceIndex,
      source.indexOf('// After switching maps', addExperienceIndex),
    );

    expect(addExperienceBlock).toContain('addXPNotification(amount, reason)');
    expect(addExperienceBlock).not.toContain('showNotification');
  });
});

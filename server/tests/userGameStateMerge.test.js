import { mergeUserGameState } from '../routes/userRoutes.js';

describe('mergeUserGameState', () => {
  it('preserves discovery and quest progress when syncing flat client state', () => {
    const existingState = {
      inventory: ['existing-item'],
      viewedArtifacts: ['artifact-1'],
      achievements: ['first-login'],
      gameProgress: {
        currentQuest: 'Intro',
        completedQuests: ['quest-1'],
        discoveredLocations: ['Home']
      },
      lastPosition: {
        worldId: 'Home',
        x: 4,
        y: 5
      }
    };

    const incomingState = {
      characterPosition: { x: 9, y: 10 },
      currentMapIndex: 2,
      inventory: ['client-item'],
      exp: 125
    };

    const merged = mergeUserGameState(existingState, incomingState);

    expect(merged.inventory).toEqual(['client-item']);
    expect(merged.viewedArtifacts).toEqual(['artifact-1']);
    expect(merged.achievements).toEqual(['first-login']);
    expect(merged.gameProgress).toEqual({
      currentQuest: 'Intro',
      completedQuests: ['quest-1'],
      discoveredLocations: ['Home']
    });
    expect(merged.lastPosition).toEqual({
      worldId: 'Home',
      x: 4,
      y: 5
    });
    expect(merged.characterPosition).toEqual({ x: 9, y: 10 });
    expect(merged.currentMapIndex).toBe(2);
    expect(merged.exp).toBe(125);
  });

  it('unions monotonic progress arrays instead of overwriting them', () => {
    const merged = mergeUserGameState(
      {
        viewedArtifacts: ['artifact-1'],
        achievements: ['achievement-1'],
        gameProgress: {
          completedQuests: ['quest-1'],
          discoveredLocations: ['Home']
        }
      },
      {
        viewedArtifacts: ['artifact-1', 'artifact-2'],
        achievements: ['achievement-2'],
        gameProgress: {
          completedQuests: ['quest-1', 'quest-2'],
          discoveredLocations: ['Home', 'Forest']
        }
      }
    );

    expect(merged.viewedArtifacts).toEqual(['artifact-1', 'artifact-2']);
    expect(merged.achievements).toEqual(['achievement-1', 'achievement-2']);
    expect(merged.gameProgress.completedQuests).toEqual(['quest-1', 'quest-2']);
    expect(merged.gameProgress.discoveredLocations).toEqual(['Home', 'Forest']);
  });
});

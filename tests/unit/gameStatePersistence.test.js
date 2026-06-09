import { mergeGameState } from '../../server/utils/gameState.js';
import { GameStateManager } from '../../client/src/utils/gameStateManager.js';

describe('game state persistence regressions', () => {
  test('mergeGameState preserves server-owned nested fields when saving partial client state', () => {
    const existingState = {
      achievements: [{ id: 'first-discovery', name: 'First Discovery' }],
      gameProgress: {
        currentQuest: 'intro',
        completedQuests: ['wake-up'],
        discoveredLocations: ['overworld'],
      },
      lastPosition: {
        worldId: 'overworld',
        x: 4,
        y: 5,
      },
    };

    const incomingState = {
      gameProgress: {
        currentQuest: 'artifact-hunt',
      },
      lastPosition: {
        x: 9,
      },
    };

    expect(mergeGameState(existingState, incomingState)).toEqual({
      achievements: [{ id: 'first-discovery', name: 'First Discovery' }],
      gameProgress: {
        currentQuest: 'artifact-hunt',
        completedQuests: ['wake-up'],
        discoveredLocations: ['overworld'],
      },
      lastPosition: {
        worldId: 'overworld',
        x: 9,
        y: 5,
      },
    });
  });

  test('saveToServer accepts a raw game-state response from the server as success', async () => {
    localStorage.setItem('token', 'test-token');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        lastPosition: { worldId: 'overworld', x: 9, y: 5 },
      }),
    });

    const manager = new GameStateManager();
    const result = await manager.saveToServer({
      lastPosition: { worldId: 'overworld', x: 9, y: 5 },
    });

    expect(result).toEqual({
      success: true,
      gameState: {
        lastPosition: { worldId: 'overworld', x: 9, y: 5 },
      },
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/users/game-state', expect.objectContaining({
      method: 'PUT',
      headers: expect.objectContaining({
        Authorization: 'Bearer test-token',
      }),
    }));
  });
});

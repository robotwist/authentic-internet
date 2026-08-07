import {
  BUILT_IN_WORLD_IDS,
  canAutoCreateWorldInstance,
  clampMaxPlayers,
  isValidWorldId,
  registerActiveConnection,
  unregisterActiveConnection,
  MAX_WORLD_ID_LENGTH,
  DEFAULT_MAX_PLAYERS,
  ABSOLUTE_MAX_PLAYERS,
} from '../utils/socketConnectionHelpers.js';

describe('socketConnectionHelpers', () => {
  describe('isValidWorldId / canAutoCreateWorldInstance', () => {
    test('accepts built-in map ids used by MultiplayerChat', () => {
      for (const worldId of BUILT_IN_WORLD_IDS) {
        expect(isValidWorldId(worldId)).toBe(true);
        expect(canAutoCreateWorldInstance(worldId)).toBe(true);
      }
    });

    test('rejects missing, oversized, or path-like world ids', () => {
      expect(isValidWorldId('')).toBe(false);
      expect(isValidWorldId(null)).toBe(false);
      expect(isValidWorldId('a'.repeat(MAX_WORLD_ID_LENGTH + 1))).toBe(false);
      expect(isValidWorldId('../etc/passwd')).toBe(false);
      expect(canAutoCreateWorldInstance('../etc/passwd')).toBe(false);
    });

    test('does not auto-create arbitrary attacker-chosen world ids', () => {
      const attackerIds = [
        'dos-world-1',
        `world_${Date.now()}_abc`,
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      ];

      for (const worldId of attackerIds) {
        expect(isValidWorldId(worldId)).toBe(true);
        expect(canAutoCreateWorldInstance(worldId)).toBe(false);
      }
    });
  });

  describe('clampMaxPlayers', () => {
    test('defaults and clamps client-controlled maxPlayers', () => {
      expect(clampMaxPlayers(undefined)).toBe(DEFAULT_MAX_PLAYERS);
      expect(clampMaxPlayers('nope')).toBe(DEFAULT_MAX_PLAYERS);
      expect(clampMaxPlayers(0)).toBe(1);
      expect(clampMaxPlayers(999999)).toBe(ABSOLUTE_MAX_PLAYERS);
      expect(clampMaxPlayers(25)).toBe(25);
    });
  });

  describe('activeConnections multi-tab unregister', () => {
    test('closing an older tab does not evict the newer socket', () => {
      const connections = new Map();
      const tabA = { id: 'sock-a' };
      const tabB = { id: 'sock-b' };
      const userId = 'user-1';

      registerActiveConnection(connections, userId, tabA);
      registerActiveConnection(connections, userId, tabB);

      expect(unregisterActiveConnection(connections, userId, tabA)).toBe(false);
      expect(connections.get(userId)).toBe(tabB);

      expect(unregisterActiveConnection(connections, userId, tabB)).toBe(true);
      expect(connections.has(userId)).toBe(false);
    });
  });
});

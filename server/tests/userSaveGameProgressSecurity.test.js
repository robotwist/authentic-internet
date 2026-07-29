import { describe, expect, jest, test } from '@jest/globals';
import User from '../models/User.js';

describe('User.saveGameProgress authorization', () => {
  test('ignores client-forged experience, level, and inventory', async () => {
    const saveGameProgress = User.schema.methods.saveGameProgress;
    const doc = {
      experience: 50,
      level: 1,
      inventory: [],
      lastPosition: { x: 0, y: 0 },
      gameState: {},
      save: jest.fn(async function save() {
        return this;
      }),
    };

    await saveGameProgress.call(doc, {
      experience: 999999,
      level: 99,
      inventory: ['cccccccccccccccccccccccc'],
      position: { x: 3, y: 4, facing: 'down' },
    });

    expect(doc.experience).toBe(50);
    expect(doc.level).toBe(1);
    expect(doc.inventory).toEqual([]);
    expect(doc.lastPosition).toEqual({ x: 3, y: 4, facing: 'down' });
    expect(doc.save).toHaveBeenCalled();
  });
});

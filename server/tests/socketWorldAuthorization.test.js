import { afterEach, describe, expect, jest, test } from '@jest/globals';
import mongoose from 'mongoose';
import ChatMessage from '../models/Chat.js';
import User from '../models/User.js';
import WorldInstance from '../models/World.js';
import { setupWorldEvents } from '../services/socketService.js';

class FakeSocketServer {
  constructor() {
    this.broadcasts = [];
  }

  in(room) {
    return {
      emit: (event, data) => {
        this.broadcasts.push({ room, event, data });
      }
    };
  }
}

class FakeSocket {
  constructor(server, user) {
    this.server = server;
    this.user = user;
    this.id = `socket-${user.id}`;
    this.rooms = new Set([this.id]);
    this.handlers = new Map();
    this.emitted = [];
  }

  on(event, handler) {
    this.handlers.set(event, handler);
  }

  emit(event, data) {
    this.emitted.push({ event, data });
  }

  join(room) {
    this.rooms.add(room);
  }

  leave(room) {
    this.rooms.delete(room);
  }

  to(room) {
    return {
      emit: (event, data) => {
        this.server.broadcasts.push({ room, event, data });
      }
    };
  }

  async trigger(event, data) {
    const handler = this.handlers.get(event);
    if (!handler) throw new Error(`No handler registered for ${event}`);
    await handler(data);
  }
}

const makeSocket = (server, id, username) => {
  const socket = new FakeSocket(server, { id, username });
  setupWorldEvents(socket, server);
  return socket;
};

const makeWorld = (overrides = {}) => ({
  worldId: 'private-world',
  settings: {
    allowChat: true,
    allowPlayerInteraction: true
  },
  canPlayerJoin: jest.fn(() => true),
  isPlayerInWorld: jest.fn(() => false),
  addPlayer: jest.fn(),
  removePlayer: jest.fn(),
  updatePlayerPosition: jest.fn(),
  addChatMessage: jest.fn(),
  getOnlinePlayers: jest.fn(() => []),
  getRecentChatMessages: jest.fn(() => []),
  save: jest.fn(async () => undefined),
  ...overrides
});

describe('world socket authorization', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('private and invite-only worlds only admit their creator or moderators', () => {
    const creatorId = new mongoose.Types.ObjectId();
    const moderatorId = new mongoose.Types.ObjectId();
    const outsiderId = new mongoose.Types.ObjectId();
    const world = new WorldInstance({
      worldId: 'restricted-world',
      name: 'Restricted World',
      creator: creatorId,
      moderators: [moderatorId],
      isPublic: false,
      requiresInvite: true
    });

    expect(world.canPlayerJoin(creatorId)).toBe(true);
    expect(world.canPlayerJoin(moderatorId)).toBe(true);
    expect(world.canPlayerJoin(outsiderId)).toBe(false);
  });

  test('rejects an outsider before world events can mutate or broadcast', async () => {
    const outsiderId = new mongoose.Types.ObjectId();
    const targetId = new mongoose.Types.ObjectId();
    const world = makeWorld({
      isPlayerInWorld: jest.fn(() => false)
    });
    jest.spyOn(WorldInstance, 'findOne').mockResolvedValue(world);
    const chatLookup = jest.spyOn(ChatMessage, 'findOne');
    const userLookup = jest.spyOn(User, 'findById');
    const server = new FakeSocketServer();
    const outsider = makeSocket(server, outsiderId, 'outsider');

    await outsider.trigger('world:message', {
      worldId: world.worldId,
      content: 'forged message'
    });
    await outsider.trigger('world:react', {
      worldId: world.worldId,
      messageId: 'message-1',
      emoji: '🔥'
    });
    await outsider.trigger('world:player-interaction', {
      worldId: world.worldId,
      targetUserId: targetId.toString(),
      interactionType: 'challenge'
    });

    expect(
      outsider.emitted.filter(({ event }) => event === 'error')
    ).toEqual([
      { event: 'error', data: { message: 'Not authorized for this world' } },
      { event: 'error', data: { message: 'Not authorized for this world' } },
      { event: 'error', data: { message: 'Not authorized for this world' } }
    ]);
    expect(world.addChatMessage).not.toHaveBeenCalled();
    expect(chatLookup).not.toHaveBeenCalled();
    expect(userLookup).not.toHaveBeenCalled();
    expect(server.broadcasts).toHaveLength(0);
  });

  test('requires both a live room and persisted membership for mutations', async () => {
    const staleMemberId = new mongoose.Types.ObjectId();
    const world = makeWorld({
      isPlayerInWorld: jest.fn(() => true)
    });
    jest.spyOn(WorldInstance, 'findOne').mockResolvedValue(world);
    const server = new FakeSocketServer();
    const staleMember = makeSocket(server, staleMemberId, 'stale-member');

    await staleMember.trigger('world:message', {
      worldId: world.worldId,
      content: 'sent from outside the room'
    });

    expect(staleMember.emitted).toContainEqual({
      event: 'error',
      data: { message: 'Not authorized for this world' }
    });
    expect(world.addChatMessage).not.toHaveBeenCalled();
    expect(server.broadcasts).toHaveLength(0);
  });

  test('allows a joined member to persist and broadcast a world message', async () => {
    const memberId = new mongoose.Types.ObjectId();
    const world = makeWorld({
      worldId: 'public-world',
      isPlayerInWorld: jest.fn(() => true)
    });
    jest.spyOn(WorldInstance, 'findOne').mockResolvedValue(world);
    jest.spyOn(User, 'findById').mockResolvedValue({ avatar: '/avatar.png', level: 3 });
    jest.spyOn(ChatMessage.prototype, 'save').mockResolvedValue(undefined);
    const server = new FakeSocketServer();
    const member = makeSocket(server, memberId, 'member');

    await member.trigger('world:join', {
      worldId: world.worldId,
      worldName: 'Public World',
      position: { x: 1, y: 2, z: 0 }
    });
    await member.trigger('world:message', {
      worldId: world.worldId,
      content: 'authorized message'
    });

    expect(member.rooms.has(`world:${world.worldId}`)).toBe(true);
    expect(world.addPlayer).toHaveBeenCalledWith(
      memberId,
      'member',
      '/avatar.png',
      { x: 1, y: 2, z: 0 }
    );
    expect(world.addChatMessage).toHaveBeenCalledWith(
      memberId,
      'member',
      '/avatar.png',
      'authorized message',
      'chat'
    );
    expect(server.broadcasts).toContainEqual(
      expect.objectContaining({
        room: `world:${world.worldId}`,
        event: 'world:message',
        data: expect.objectContaining({
          senderId: memberId,
          senderName: 'member',
          content: 'authorized message'
        })
      })
    );
  });
});

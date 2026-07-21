import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Collaboration from '../models/Collaboration.js';
import { setupCollaborationEvents } from '../services/socketService.js';

class FakeSocketServer {
  constructor() {
    this.broadcasts = [];
    this.sockets = {
      adapter: { rooms: new Map() },
      sockets: new Map()
    };
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
    this.id = new mongoose.Types.ObjectId().toString();
    this.user = user;
    this.data = {};
    this.rooms = new Set([this.id]);
    this.handlers = new Map();
    this.emitted = [];
    this.server = server;
    server.sockets.sockets.set(this.id, this);
  }

  on(event, handler) {
    this.handlers.set(event, handler);
  }

  emit(event, data) {
    this.emitted.push({ event, data });
  }

  async join(room) {
    this.rooms.add(room);
    const members = this.server.sockets.adapter.rooms.get(room) || new Set();
    members.add(this.id);
    this.server.sockets.adapter.rooms.set(room, members);
  }

  leave(room) {
    this.rooms.delete(room);
    this.server.sockets.adapter.rooms.get(room)?.delete(this.id);
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
  setupCollaborationEvents(socket, server);
  return socket;
};

const mockCollaborationLookup = (result) => {
  jest.spyOn(Collaboration, 'findOne').mockReturnValue({
    select: jest.fn().mockResolvedValue(result)
  });
};

describe('collaboration socket authorization', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('rejects a non-participant and blocks forged updates', async () => {
    const outsiderId = new mongoose.Types.ObjectId();
    const sessionId = new mongoose.Types.ObjectId().toString();
    mockCollaborationLookup(null);
    const server = new FakeSocketServer();
    const outsider = makeSocket(server, outsiderId, 'outsider');

    await outsider.trigger('collaboration:join', { sessionId });
    await outsider.trigger('collaboration:content-update', {
      sessionId,
      field: 'content',
      value: 'forged replacement'
    });

    expect(outsider.rooms.has(`collaboration:${sessionId}`)).toBe(false);
    expect(outsider.emitted).toEqual(expect.arrayContaining([
      {
        event: 'error',
        data: { message: 'Not authorized for this collaboration session' }
      }
    ]));
    expect(server.broadcasts).toHaveLength(0);
  });

  test('allows an editor to join and broadcast only to that session', async () => {
    const creatorId = new mongoose.Types.ObjectId();
    const editorId = new mongoose.Types.ObjectId();
    const sessionId = new mongoose.Types.ObjectId().toString();
    const otherSessionId = new mongoose.Types.ObjectId().toString();
    mockCollaborationLookup({
      creator: creatorId,
      participants: [{ user: editorId, role: 'editor' }]
    });
    const server = new FakeSocketServer();
    const editor = makeSocket(server, editorId, 'editor');

    await editor.trigger('collaboration:join', { sessionId });
    server.broadcasts = [];
    await editor.trigger('collaboration:content-update', {
      sessionId,
      field: 'content',
      value: 'authorized change'
    });
    await editor.trigger('collaboration:content-update', {
      sessionId: otherSessionId,
      field: 'content',
      value: 'cross-session change'
    });

    expect(editor.rooms.has(`collaboration:${sessionId}`)).toBe(true);
    expect(server.broadcasts).toEqual([
      expect.objectContaining({
        room: `collaboration:${sessionId}`,
        event: 'collaboration:content-update',
        data: expect.objectContaining({ value: 'authorized change' })
      })
    ]);
    expect(editor.emitted).toContainEqual({
      event: 'error',
      data: { message: 'Not authorized for this collaboration session' }
    });
  });

  test('prevents viewers from emitting editor and owner events', async () => {
    const creatorId = new mongoose.Types.ObjectId();
    const viewerId = new mongoose.Types.ObjectId();
    const sessionId = new mongoose.Types.ObjectId().toString();
    mockCollaborationLookup({
      creator: creatorId,
      participants: [{ user: viewerId, role: 'viewer' }]
    });
    const server = new FakeSocketServer();
    const viewer = makeSocket(server, viewerId, 'viewer');

    await viewer.trigger('collaboration:join', { sessionId });
    server.broadcasts = [];
    await viewer.trigger('collaboration:content-update', {
      sessionId,
      field: 'content',
      value: 'unauthorized edit'
    });
    await viewer.trigger('collaboration:settings-updated', {
      sessionId,
      settings: { allowEditing: false }
    });

    expect(server.broadcasts).toHaveLength(0);
    expect(viewer.emitted.filter(({ event }) => event === 'error')).toEqual([
      {
        event: 'error',
        data: { message: 'Insufficient collaboration permissions' }
      },
      {
        event: 'error',
        data: { message: 'Insufficient collaboration permissions' }
      }
    ]);
  });
});

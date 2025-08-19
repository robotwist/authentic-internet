import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config();

let mongoServer;

/**
 * Setup test database before all tests
 */
export const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('✅ Test database connected');
};

/**
 * Clean up test database after each test
 */
export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};

/**
 * Disconnect test database after all tests
 */
export const teardownTestDB = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('✅ Test database disconnected');
};

/**
 * Create test user data
 */
export const createTestUser = (overrides = {}) => ({
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPassword123',
  avatar: '/default-avatar.png',
  level: 1,
  experience: 0,
  ...overrides
});

/**
 * Create test artifact data
 */
export const createTestArtifact = (overrides = {}) => ({
  name: 'Test Artifact',
  description: 'A test artifact for testing',
  type: 'game',
  content: { gameData: 'test' },
  visibility: 'public',
  creator: new mongoose.Types.ObjectId(),
  ...overrides
});

/**
 * Create test world data
 */
export const createTestWorld = (overrides = {}) => ({
  worldId: 'test-world',
  name: 'Test World',
  description: 'A test world for testing',
  creator: new mongoose.Types.ObjectId(),
  activePlayers: [],
  maxPlayers: 10,
  ...overrides
});

/**
 * Mock JWT token for testing
 */
export const createMockToken = (userId = new mongoose.Types.ObjectId()) => {
  // This is a mock token for testing - in real tests you'd use a proper JWT library
  return `mock-token-${userId}`;
};

/**
 * Test environment configuration
 */
export const testConfig = {
  port: 5002,
  mongoUri: 'mongodb://localhost:27017/test',
  jwtSecret: 'test-secret',
  nodeEnv: 'test'
};

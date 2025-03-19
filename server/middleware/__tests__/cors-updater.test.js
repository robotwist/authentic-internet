import { jest } from '@jest/globals';
import corsUpdater, { addOriginToAllowedOrigins, clearBlockedOrigins } from '../cors-updater.js';

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// Import fs after mocking it
import fs from 'fs';

describe('CORS Updater Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Reset all mocks between tests
    jest.clearAllMocks();
    clearBlockedOrigins();
    
    // Set up environment
    process.env.NODE_ENV = 'development';
    
    // Set up mocks
    req = {
      headers: {},
      app: {
        get: jest.fn()
      }
    };
    res = {};
    next = jest.fn();
    
    // Spy on console.log
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console mocks
    console.log.mockRestore();
    console.error.mockRestore();
  });
  
  test('should call next middleware', () => {
    corsUpdater(req, res, next);
    expect(next).toHaveBeenCalled();
  });
  
  test('should skip in production mode', () => {
    process.env.NODE_ENV = 'production';
    corsUpdater(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
    process.env.NODE_ENV = 'development'; // Reset for other tests
  });
  
  test('should skip if no origin header', () => {
    req.headers.origin = undefined;
    corsUpdater(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });
  
  test('should skip if origin is already allowed', () => {
    req.headers.origin = 'http://localhost:3000';
    req.app.get.mockReturnValue(['http://localhost:3000']);
    
    corsUpdater(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });
  
  test('should log blocked origin', () => {
    req.headers.origin = 'http://localhost:3000';
    req.app.get.mockReturnValue(['http://other-origin.com']);
    
    corsUpdater(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Detected potentially blocked origin'));
  });
  
  test('should not log the same origin multiple times', () => {
    req.headers.origin = 'http://localhost:3000';
    req.app.get.mockReturnValue(['http://other-origin.com']);
    
    // First request
    corsUpdater(req, res, next);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Detected potentially blocked origin'));
    
    // Reset mock
    console.log.mockClear();
    
    // Second request with same origin
    corsUpdater(req, res, next);
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Detected potentially blocked origin'));
  });
});

describe('addOriginToAllowedOrigins Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });
  
  test('should return error if no origin specified', async () => {
    const result = await addOriginToAllowedOrigins();
    expect(result.success).toBe(false);
    expect(result.message).toContain('No origin specified');
  });
  
  test('should return error if cannot find origins array in file', async () => {
    // Override readFileSync for this test
    const originalReadFileSync = fs.readFileSync;
    fs.readFileSync = jest.fn().mockReturnValue('// No origins array here');
    
    const result = await addOriginToAllowedOrigins('http://localhost:3000');
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('Could not find allowedOrigins array');
    
    // Restore original function
    fs.readFileSync = originalReadFileSync;
  });
  
  test('should return error if origin is already in the list', async () => {
    // Override readFileSync for this test
    const originalReadFileSync = fs.readFileSync;
    fs.readFileSync = jest.fn().mockReturnValue(`
      const allowedOrigins = process.env.NODE_ENV === 'development' ? ['http://localhost:5173', 'http://localhost:3000'] : [];
    `);
    
    const result = await addOriginToAllowedOrigins('http://localhost:3000');
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('already in the allowedOrigins array');
    
    // Restore original function
    fs.readFileSync = originalReadFileSync;
  });
  
  test('should add origin to the list and update file', async () => {
    // Override readFileSync and writeFileSync for this test
    const originalReadFileSync = fs.readFileSync;
    const originalWriteFileSync = fs.writeFileSync;
    
    fs.readFileSync = jest.fn().mockReturnValue(`
      const allowedOrigins = process.env.NODE_ENV === 'development' ? ['http://localhost:5173'] : [];
    `);
    fs.writeFileSync = jest.fn();
    
    const result = await addOriginToAllowedOrigins('http://localhost:3000');
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('Successfully added');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("'http://localhost:5173', 'http://localhost:3000'")
    );
    
    // Restore original functions
    fs.readFileSync = originalReadFileSync;
    fs.writeFileSync = originalWriteFileSync;
  });

  test('should handle file write errors', async () => {
    // Override readFileSync and writeFileSync for this test
    const originalReadFileSync = fs.readFileSync;
    const originalWriteFileSync = fs.writeFileSync;
    
    fs.readFileSync = jest.fn().mockReturnValue(`
      const allowedOrigins = process.env.NODE_ENV === 'development' ? ['http://localhost:5173'] : [];
    `);
    fs.writeFileSync = jest.fn().mockImplementation(() => {
      throw new Error('Write error');
    });
    
    const result = await addOriginToAllowedOrigins('http://localhost:3000');
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('Cannot write to server.mjs');
    
    // Restore original functions
    fs.readFileSync = originalReadFileSync;
    fs.writeFileSync = originalWriteFileSync;
  });

  test('should handle file read errors', async () => {
    // Override readFileSync for this test
    const originalReadFileSync = fs.readFileSync;
    
    fs.readFileSync = jest.fn().mockImplementation(() => {
      throw new Error('Read error');
    });
    
    const result = await addOriginToAllowedOrigins('http://localhost:3000');
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('Cannot read server.mjs');
    
    // Restore original function
    fs.readFileSync = originalReadFileSync;
  });
}); 
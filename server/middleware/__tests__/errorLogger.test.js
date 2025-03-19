import { jest } from '@jest/globals';
import errorLogger from '../errorLogger.js';

describe('Error Logger Middleware', () => {
  let req, res, next, consoleErrorSpy, consoleLogSpy;
  
  beforeEach(() => {
    // Mock request object
    req = {
      method: 'GET',
      originalUrl: '/api/test',
      url: '/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
        'origin': 'http://localhost:5173',
        'referer': 'http://localhost:5173/test'
      },
      params: {},
      query: {}
    };
    
    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis()
    };
    
    // Mock next function
    next = jest.fn();
    
    // Spy on console methods
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should call next middleware', () => {
    errorLogger(req, res, next);
    expect(next).toHaveBeenCalled();
  });
  
  test('should log successful responses with status 200', () => {
    errorLogger(req, res, next);
    
    // Call the overridden methods to trigger logging
    res.status(200);
    res.send('OK');
    
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('200'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('/api/test'));
  });
  
  test('should log error responses with status 404', () => {
    errorLogger(req, res, next);
    
    // Call the overridden methods to trigger error logging
    res.status(404);
    res.json({ error: 'Not Found' });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('404'));
    
    // Test that any of the calls includes "Request details" (rather than a specific call)
    expect(consoleErrorSpy.mock.calls.some(call => 
      call[0] === 'Request details:' || 
      (typeof call[0] === 'string' && call[0].includes('Request details'))
    )).toBe(true);
  });
  
  test('should log error responses with status 500', () => {
    errorLogger(req, res, next);
    
    // Call the overridden methods to trigger error logging
    res.status(500);
    res.json({ error: 'Internal Server Error' });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('500'));
  });
  
  test('should handle CORS errors with special logging', () => {
    errorLogger(req, res, next);
    
    // Call the overridden methods to trigger CORS error logging
    res.status(403);
    res.json({ error: 'CORS Error', message: 'Not allowed' });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('403'));
    
    // Test that any of the calls includes "CORS ERROR"
    expect(consoleErrorSpy.mock.calls.some(call => 
      typeof call[0] === 'string' && call[0].includes('[CORS ERROR]')
    )).toBe(true);
  });
  
  test('should handle default status code when using res.end directly', () => {
    errorLogger(req, res, next);
    
    // Call res.end without setting status
    res.end();
    
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('200')); // Default status
  });
}); 
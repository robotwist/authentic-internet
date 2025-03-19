import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import errorMonitor from '../errorMonitor';

// Mock DOM elements and methods
global.document = {
  createElement: vi.fn(() => ({
    style: {},
    appendChild: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dataset: {},
  })),
  body: {
    appendChild: vi.fn(),
    contains: vi.fn().mockReturnValue(true),
    removeChild: vi.fn(),
  },
};

// Mock window
global.window = {
  fetch: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

// Mock XMLHttpRequest
global.XMLHttpRequest = function() {
  return {
    open: vi.fn(),
    send: vi.fn(),
    addEventListener: vi.fn(),
  };
};
XMLHttpRequest.prototype.open = vi.fn();
XMLHttpRequest.prototype.send = vi.fn();

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

describe('ErrorMonitor', () => {
  beforeEach(() => {
    // Mock console methods
    console.error = vi.fn();
    console.warn = vi.fn();
    console.log = vi.fn();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Reset error monitor state
    errorMonitor.isActive = false;
    errorMonitor.errors = [];
    errorMonitor.container = null;
    errorMonitor.originalConsoleError = console.error;
    errorMonitor.originalConsoleWarn = console.warn;
    errorMonitor.originalFetch = window.fetch;
    errorMonitor.originalXHROpen = XMLHttpRequest.prototype.open;
    errorMonitor.originalXHRSend = XMLHttpRequest.prototype.send;
  });
  
  afterEach(() => {
    // Stop the monitor if it's running
    if (errorMonitor.isActive) {
      errorMonitor.stop();
    }
    
    // Restore console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });
  
  it('should start monitoring', () => {
    errorMonitor.start();
    
    expect(errorMonitor.isActive).toBe(true);
    expect(document.createElement).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(window.addEventListener).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Error Monitor started'));
  });
  
  it('should stop monitoring', () => {
    // First, start the monitor
    errorMonitor.start();
    
    // Then stop it
    errorMonitor.stop();
    
    expect(errorMonitor.isActive).toBe(false);
    expect(window.removeEventListener).toHaveBeenCalledTimes(2);
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Error Monitor stopped'));
  });
  
  it('should override console.error', () => {
    // Start the monitor
    errorMonitor.start();
    
    // Call console.error
    console.error('Test error');
    
    // Should log the error
    expect(errorMonitor.errors.length).toBe(1);
    expect(errorMonitor.errors[0].type).toBe('console.error');
    expect(errorMonitor.errors[0].details).toContain('Test error');
  });
  
  it('should override console.warn for important warnings', () => {
    // Start the monitor
    errorMonitor.start();
    
    // Call console.warn with important warning
    console.warn('CORS error occurred');
    
    // Should log the warning
    expect(errorMonitor.errors.length).toBe(1);
    expect(errorMonitor.errors[0].type).toBe('console.warn');
    expect(errorMonitor.errors[0].details).toContain('CORS error occurred');
  });
  
  it('should ignore non-important warnings', () => {
    // Start the monitor
    errorMonitor.start();
    
    // Call console.warn with non-important warning
    console.warn('Just a regular warning');
    
    // Should not log the warning
    expect(errorMonitor.errors.length).toBe(0);
  });
  
  it('should override fetch to catch errors', async () => {
    // Mock fetch implementation with a custom error
    const customError = new Error('Cannot read properties of undefined (reading \'ok\')');
    window.fetch = vi.fn().mockRejectedValue(customError);
    
    // Start the monitor
    errorMonitor.start();
    
    // Call fetch that will throw an error
    try {
      await window.fetch('https://example.com/api');
    } catch (error) {
      // Expected to throw
    }
    
    // Should log the error
    expect(errorMonitor.errors.length).toBe(1);
    expect(errorMonitor.errors[0].type).toBe('fetch error');
    expect(errorMonitor.errors[0].details.message).toBe('Cannot read properties of undefined (reading \'ok\')');
  });
  
  it('should provide solutions for CORS errors', () => {
    // Start the monitor
    errorMonitor.start();
    
    // Simulate a CORS error
    errorMonitor.logError('fetch error', {
      status: 403,
      statusText: 'Forbidden',
      url: 'https://api.example.com/data',
      method: 'GET',
      message: 'CORS error'
    });
    
    // Should provide a CORS error solution
    expect(errorMonitor.errors[0].solution.title).toBe('CORS Error');
    expect(errorMonitor.errors[0].solution.steps.length).toBeGreaterThan(0);
  });
  
  it('should provide solutions for authentication errors', () => {
    // Start the monitor
    errorMonitor.start();
    
    // Simulate an authentication error
    errorMonitor.logError('fetch error', {
      status: 401,
      statusText: 'Unauthorized',
      url: 'https://api.example.com/profile',
      method: 'GET'
    });
    
    // Should provide an authentication error solution
    expect(errorMonitor.errors[0].solution.title).toBe('Authentication Error');
    expect(errorMonitor.errors[0].solution.steps.length).toBeGreaterThan(0);
  });
  
  it('should provide solutions for server errors', () => {
    // Start the monitor
    errorMonitor.start();
    
    // Simulate a server error
    errorMonitor.logError('fetch error', {
      status: 500,
      statusText: 'Internal Server Error',
      url: 'https://api.example.com/data',
      method: 'POST'
    });
    
    // Should provide a server error solution
    expect(errorMonitor.errors[0].solution.title).toBe('Server Error');
    expect(errorMonitor.errors[0].solution.steps.length).toBeGreaterThan(0);
  });
  
  it('should clear all errors', () => {
    // Start the monitor
    errorMonitor.start();
    
    // Add some errors
    errorMonitor.logError('console.error', ['Test error 1']);
    errorMonitor.logError('console.error', ['Test error 2']);
    
    // Clear errors
    errorMonitor.clearErrors();
    
    // Should have no errors
    expect(errorMonitor.errors.length).toBe(0);
  });
}); 
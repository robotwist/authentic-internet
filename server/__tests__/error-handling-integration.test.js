import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import errorLogger from '../middleware/errorLogger.js';
import corsUpdater from '../middleware/cors-updater.js';

describe('Error Handling Integration Tests', () => {
  let app;
  
  beforeEach(() => {
    // Create a new Express app for each test
    app = express();
    
    // Add middlewares
    app.use(errorLogger);
    app.use(corsUpdater);
    app.use(express.json());
    
    // Mock environment
    process.env.NODE_ENV = 'development';
    
    // Store allowed origins for CORS updater
    const allowedOrigins = ['http://localhost:5173'];
    app.set('allowedOrigins', allowedOrigins);
    
    // Add CORS middleware
    app.use(cors({
      origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
          const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
          return callback(new Error(msg), false);
        }
        return callback(null, true);
      },
      credentials: true
    }));
    
    // Add CORS error handler
    app.use((err, req, res, next) => {
      if (err.message.includes('CORS')) {
        res.status(403).json({
          error: 'CORS Error',
          message: err.message,
          origin: req.headers.origin
        });
      } else {
        next(err);
      }
    });
    
    // Add test routes
    app.get('/api/success', (req, res) => {
      res.status(200).json({ message: 'Success' });
    });
    
    app.get('/api/error', (req, res) => {
      res.status(500).json({ error: 'Internal Server Error' });
    });
    
    app.get('/api/not-found', (req, res) => {
      res.status(404).json({ error: 'Not Found' });
    });
    
    // Global error handler
    app.use((err, req, res, next) => {
      res.status(500).json({ error: 'Unexpected Error', message: err.message });
    });
    
    // Spy on console methods
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should handle successful requests', async () => {
    const response = await request(app)
      .get('/api/success')
      .set('Origin', 'http://localhost:5173');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Success' });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('200'));
  });
  
  test('should handle error responses', async () => {
    const response = await request(app)
      .get('/api/error')
      .set('Origin', 'http://localhost:5173');
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('500'));
  });
  
  test('should handle not found errors', async () => {
    const response = await request(app)
      .get('/api/not-found')
      .set('Origin', 'http://localhost:5173');
    
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not Found' });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('404'));
  });
  
  test('should handle CORS errors', async () => {
    const response = await request(app)
      .get('/api/success')
      .set('Origin', 'http://localhost:3000');
    
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('CORS Error');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('403'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[CORS ERROR]'));
    
    // CORS updater should log a message about the blocked origin
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Detected potentially blocked origin'));
    expect(console.log).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('add http://localhost:3000'));
  });
}); 
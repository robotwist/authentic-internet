import mongoose from 'mongoose';
import { EventEmitter } from 'events';

class ConnectionManager extends EventEmitter {
  constructor() {
    super();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectInterval = 5000; // 5 seconds
    this.healthCheckInterval = null;
    this.connectionPromise = null;
  }

  async connect(uri) {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        // Configure mongoose
        mongoose.set('strictQuery', true);
        mongoose.set('debug', process.env.NODE_ENV === 'development');

        // Setup event listeners
        mongoose.connection.on('connected', () => {
          console.log('✅ MongoDB Connected Successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHealthCheck();
          this.emit('connected');
        });

        mongoose.connection.on('error', (err) => {
          console.error('❌ MongoDB Connection Error:', err);
          this.isConnected = false;
          this.emit('error', err);
          this.handleConnectionError();
        });

        mongoose.connection.on('disconnected', () => {
          console.log('❌ MongoDB Disconnected');
          this.isConnected = false;
          this.emit('disconnected');
          this.handleConnectionError();
        });

        // Connect with robust options
        await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          maxPoolSize: 50,
          minPoolSize: 10,
          maxIdleTimeMS: 10000,
          waitQueueTimeoutMS: 10000,
          heartbeatFrequencyMS: 5000
        });

        resolve(mongoose.connection);
      } catch (error) {
        console.error('❌ Initial MongoDB Connection Failed:', error);
        this.handleConnectionError();
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  async handleConnectionError() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Giving up.');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(async () => {
      try {
        await this.connect(mongoose.connection.client.s.url);
      } catch (error) {
        console.error('❌ Reconnection attempt failed:', error);
      }
    }, this.reconnectInterval);
  }

  startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        if (!this.isConnected) return;

        const adminDb = mongoose.connection.db.admin();
        const result = await adminDb.ping();
        
        if (result.ok !== 1) {
          console.warn('⚠️ Database health check failed');
          this.handleConnectionError();
        }
      } catch (error) {
        console.error('❌ Health check failed:', error);
        this.handleConnectionError();
      }
    }, 30000); // Check every 30 seconds
  }

  async disconnect() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      this.connectionPromise = null;
      this.emit('disconnected');
      console.log('✅ MongoDB Disconnected Successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return mongoose.connection;
  }

  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export const connectionManager = new ConnectionManager();
export default connectionManager; 
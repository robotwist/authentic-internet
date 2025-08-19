import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

// Create context
const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { token, isAuthenticated } = useAuth();
  
  // Make sure to use the correct port
  const SERVER_PORT = import.meta.env.VITE_SERVER_PORT || '5001';
  const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://localhost:${SERVER_PORT}`;
  
  // Function to create a new Socket.io connection
  const connectSocket = useCallback(() => {
    if (!isAuthenticated || !token) {
      console.log('Socket.io connection not established: User not authenticated');
      return;
    }

    try {
      console.log(`Connecting to Socket.io at: ${SERVER_URL}`);
      
      // Close existing socket if it exists
      if (socket) {
        socket.disconnect();
      }
      
      // Create new Socket.io connection
      const newSocket = io(SERVER_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });
      
      // Setup event handlers
      newSocket.on('connect', () => {
        console.log('Socket.io connected');
        setIsConnected(true);
        setReconnectAttempts(0);
      });
      
      newSocket.on('disconnect', (reason) => {
        console.log(`Socket.io disconnected: ${reason}`);
        setIsConnected(false);
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
        setIsConnected(false);
      });
      
      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`Socket.io reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setReconnectAttempts(0);
      });
      
      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Socket.io reconnection attempt ${attemptNumber}`);
        setReconnectAttempts(attemptNumber);
      });
      
      newSocket.on('reconnect_failed', () => {
        console.log('Socket.io reconnection failed');
        setIsConnected(false);
      });
      
      setSocket(newSocket);
    } catch (error) {
      console.error('Error establishing Socket.io connection:', error);
    }
  }, [isAuthenticated, token, socket, SERVER_URL]);
  
  // Connect Socket.io when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket();
    }
    
    // Clean up Socket.io connection on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, token, connectSocket]);
  
  // Function to send a message through Socket.io
  const sendMessage = useCallback((event, data) => {
    if (!socket || !isConnected) {
      console.error('Socket.io is not connected');
      return false;
    }
    
    try {
      socket.emit(event, data);
      return true;
    } catch (error) {
      console.error('Error sending Socket.io message:', error);
      return false;
    }
  }, [socket, isConnected]);
  
  // Function to listen to events
  const onEvent = useCallback((event, callback) => {
    if (!socket) return;
    
    socket.on(event, callback);
    
    // Return cleanup function
    return () => {
      socket.off(event, callback);
    };
  }, [socket]);
  
  // Function to manually reconnect
  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    connectSocket();
  }, [socket, connectSocket]);
  
  // The value provided to consumers of this context
  const value = {
    socket,
    isConnected,
    sendMessage,
    onEvent,
    reconnect
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Custom hook to use WebSocket context
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export default WebSocketContext; 
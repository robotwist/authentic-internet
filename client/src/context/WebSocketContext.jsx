import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

// Create context
const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { token, isAuthenticated } = useAuth();
  
  // Make sure to use the correct port
  const SERVER_PORT = import.meta.env.VITE_SERVER_PORT || '5004';
  const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://localhost:${SERVER_PORT}`;
  const WS_URL = SERVER_URL.replace(/^http/, 'ws');
  
  // Function to create a new WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!isAuthenticated || !token) {
      console.log('WebSocket connection not established: User not authenticated');
      return;
    }

    try {
      // Create WebSocket URL with explicit host and port
      const wsHost = new URL(WS_URL).hostname;
      // Make sure the port is explicitly set and not undefined
      const wsPort = SERVER_PORT || '5004';
      const url = new URL(`ws://${wsHost}:${wsPort}`);
      
      // Add auth token as query parameter
      url.searchParams.append('token', token);
      
      console.log(`Connecting to WebSocket at: ${url.toString()}`);
      
      // Close existing socket if it exists
      if (socket) {
        socket.close();
      }
      
      // Create new WebSocket connection
      const newSocket = new WebSocket(url.toString());
      
      // Setup event handlers
      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectAttempts(0);
      };
      
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          // Handle different message types here
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      newSocket.onclose = (event) => {
        console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
        setIsConnected(false);
        
        // Try to reconnect if not a normal closure
        if (event.code !== 1000) {
          const maxReconnectAttempts = 5;
          if (reconnectAttempts < maxReconnectAttempts) {
            const timeout = Math.min(1000 * (2 ** reconnectAttempts), 30000);
            console.log(`Attempting to reconnect in ${timeout}ms...`);
            setTimeout(() => {
              setReconnectAttempts(prev => prev + 1);
              connectWebSocket();
            }, timeout);
          } else {
            console.log('Maximum reconnection attempts reached');
          }
        }
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      setSocket(newSocket);
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
    }
  }, [isAuthenticated, token, socket, reconnectAttempts, WS_URL, SERVER_PORT]);
  
  // Connect WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      connectWebSocket();
    }
    
    // Clean up WebSocket connection on unmount
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [isAuthenticated, token, connectWebSocket]);
  
  // Function to send a message through the WebSocket
  const sendMessage = useCallback((messageType, data) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }
    
    try {
      const message = JSON.stringify({
        type: messageType,
        data,
        timestamp: new Date().toISOString()
      });
      
      socket.send(message);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }, [socket]);
  
  // Function to manually reconnect
  const reconnect = useCallback(() => {
    if (socket) {
      socket.close();
    }
    connectWebSocket();
  }, [socket, connectWebSocket]);
  
  // The value provided to consumers of this context
  const value = {
    socket,
    isConnected,
    sendMessage,
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
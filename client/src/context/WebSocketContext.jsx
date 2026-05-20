import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { io } from "socket.io-client";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);

  const SERVER_PORT = import.meta.env.VITE_SERVER_PORT || "5001";
  const SERVER_URL =
    import.meta.env.VITE_SERVER_URL || `http://localhost:${SERVER_PORT}`;

  const connectSocket = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!isAuthenticated || !token) {
      return;
    }

    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const newSocket = io(SERVER_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      newSocket.on("connect", () => {
        setIsConnected(true);
        setReconnectAttempts(0);
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
      });

      newSocket.on("connect_error", () => {
        setIsConnected(false);
      });

      newSocket.on("reconnect", () => {
        setIsConnected(true);
        setReconnectAttempts(0);
      });

      newSocket.on("reconnect_attempt", (attemptNumber) => {
        setReconnectAttempts(attemptNumber);
      });

      newSocket.on("reconnect_failed", () => {
        setIsConnected(false);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    } catch (error) {
      console.error("Error establishing Socket.io connection:", error);
    }
  }, [isAuthenticated, SERVER_URL]);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, connectSocket]);

  const sendMessage = useCallback(
    (event, data) => {
      const active = socketRef.current;
      if (!active || !isConnected) {
        return false;
      }
      try {
        active.emit(event, data);
        return true;
      } catch (error) {
        console.error("Error sending Socket.io message:", error);
        return false;
      }
    },
    [isConnected],
  );

  const onEvent = useCallback((event, callback) => {
    const active = socketRef.current;
    if (!active) return undefined;

    active.on(event, callback);
    return () => {
      active.off(event, callback);
    };
  }, []);

  const reconnect = useCallback(() => {
    connectSocket();
  }, [connectSocket]);

  const value = {
    socket,
    isConnected,
    sendMessage,
    onEvent,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}

export default WebSocketContext;

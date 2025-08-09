import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface LoginApprovalNotification {
  id: string;
  vendorName: string;
  vendorEmail: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface DocumentNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  recipient: string;
  createdAt: string;
  relatedDocument?: any;
}

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  loginApprovalNotifications: LoginApprovalNotification[];
  documentNotifications: DocumentNotification[];
  addLoginApprovalNotification: (notification: LoginApprovalNotification) => void;
  addDocumentNotification: (notification: DocumentNotification) => void;
  clearNotification: (id: string) => void;
  clearDocumentNotification: (id: string) => void;
  sendLoginApprovalNotification: (notification: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  loginApprovalNotifications: [],
  documentNotifications: [],
  addLoginApprovalNotification: () => {},
  addDocumentNotification: () => {},
  clearNotification: () => {},
  clearDocumentNotification: () => {},
  sendLoginApprovalNotification: () => {},
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loginApprovalNotifications, setLoginApprovalNotifications] = useState<LoginApprovalNotification[]>([]);
  const [documentNotifications, setDocumentNotifications] = useState<DocumentNotification[]>([]);

  useEffect(() => {
    if (!user) return;

    // Get WebSocket URL from environment or use a secure fallback for production
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    const wsUrl = wsBaseUrl.replace(/^https?:/, wsProtocol) + '/ws';
    
    console.log('Connecting to WebSocket at:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      setSocket(ws);
      
      // Send authentication message
      ws.send(JSON.stringify({
        type: 'authenticate',
        userId: user.id,
        role: user.role
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);
        
        if (message.type === 'login_approval') {
          addLoginApprovalNotification(message.data);
        } else if (message.type === 'notification') {
          addDocumentNotification(message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      console.log('Cleaning up WebSocket connection');
      ws.close();
    };
  }, [user]);

  const addLoginApprovalNotification = (notification: LoginApprovalNotification) => {
    setLoginApprovalNotifications((prev) => [...prev, notification]);
  };

  const addDocumentNotification = (notification: DocumentNotification) => {
    setDocumentNotifications((prev) => [...prev, notification]);
  };

  const clearNotification = (id: string) => {
    setLoginApprovalNotifications((prev) => prev.filter(n => n.id !== id));
  };

  const clearDocumentNotification = (id: string) => {
    setDocumentNotifications((prev) => prev.filter(n => n._id !== id));
  };

  const sendLoginApprovalNotification = (notification: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: 'login_approval_notification',
        data: notification
      }));
    }
  };

return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        loginApprovalNotifications,
        documentNotifications,
        addLoginApprovalNotification,
        addDocumentNotification,
        clearNotification,
        clearDocumentNotification,
        sendLoginApprovalNotification,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
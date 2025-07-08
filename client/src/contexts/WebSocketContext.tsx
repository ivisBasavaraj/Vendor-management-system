import React, { createContext, useContext, useEffect, useState } from 'react';

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
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loginApprovalNotifications, setLoginApprovalNotifications] = useState<LoginApprovalNotification[]>([]);
  const [documentNotifications, setDocumentNotifications] = useState<DocumentNotification[]>([]);

  useEffect(() => {
    // Get WebSocket URL from environment or use a secure fallback for production
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsBaseUrl = process.env.REACT_APP_API_BASE_URL || 'https://vendor-management-system-api.herokuapp.com';
    const wsUrl = wsBaseUrl.replace(/^https?:/, wsProtocol);
    
    console.log('Connecting to WebSocket at:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'login_approval') {
        addLoginApprovalNotification(message.data);
      } else if (message.type === 'notification') {
        addDocumentNotification(message.data);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, []);

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
      type: 'login_approval',
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
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../utils/api';
import Button from '../ui/Button';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  text: string;
  sender: {
    id: string;
    name: string;
    role: 'consultant' | 'vendor';
  };
  timestamp: string;
  documentId?: string;
  read: boolean;
}

interface MessageSystemProps {
  documentId?: string;
  vendorId?: string;
  className?: string;
}

const MessageSystem: React.FC<MessageSystemProps> = ({ documentId, vendorId, className = '' }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await apiService.messages.get({
          documentId,
          vendorId,
          consultantId: user?.id
        });
        setMessages(response.data);
      } catch (err) {
        setError('Failed to load messages');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    // Set up real-time updates if needed
  }, [documentId, vendorId, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      const response = await apiService.messages.send({
        text: newMessage,
        documentId,
        vendorId,
        senderId: user?.id,
        senderRole: user?.role
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Messages</h3>
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 flex-1 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-lg px-4 py-2 ${
                      message.sender.id === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-end">
                      <div className="flex-1">
                        <p className="text-sm mb-1 font-medium">
                          {message.sender.name}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      </div>
                      <div className="ml-2">
                        <p className="text-xs opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              <PaperAirplaneIcon className="h-5 w-5" />
            </Button>
          </form>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageSystem; 
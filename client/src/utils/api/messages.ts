export interface Message {
  id: string;
  text: string;
  sender: {
    id: string;
    name: string;
    role: 'consultant' | 'vendor' | 'admin';
  };
  timestamp: string;
  documentId?: string;
  read: boolean;
}

export interface MessageResponse {
  success: boolean;
  data: Message | Message[];
  message?: string;
} 
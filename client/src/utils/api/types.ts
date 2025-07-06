import { AxiosResponse } from 'axios';
import { Message } from './messages';
import { User, LoginResult } from '../../types/auth';

export interface Document {
  _id: string;
  title: string;
  vendorName: string;
  submissionDate: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  documentType: string;
  fileCount: number;
  assignedTo: string;
  vendorId: string;
  submissionId?: string; // Added for document submission workflow
  comments: Array<{
    id: string;
    text: string;
    author: string;
    timestamp: string;
  }>;
}

// Removed local Message interface, will use the imported one from './messages'
// export interface Message {
//   id: string;
//   text: string;
//   sender: {
//     id: string;
//     name: string;
//     role: 'consultant' | 'vendor';
//   };
//   timestamp: string;
//   documentId?: string;
//   read: boolean;
// }

export interface DocumentStats {
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  assignedToMe: number;
  completedReviews: number;
}

export interface ApiService {
  setAuthToken: (token: string | null) => void;
  auth: {
    login: (email: string, password: string) => Promise<AxiosResponse<LoginResult>>;
    adminLogin: (email: string, password: string) => Promise<AxiosResponse<LoginResult>>;
    consultantLogin: (email: string, password: string) => Promise<AxiosResponse<LoginResult>>;
    vendorLogin: (email: string, password: string) => Promise<AxiosResponse<LoginResult>>;
    logout: () => Promise<AxiosResponse>;
    register: (data: any) => Promise<AxiosResponse>;
    getCurrentUser: () => Promise<AxiosResponse<{ success: boolean; data: User }>>;
    checkLoginApproval: (approvalId: string) => Promise<AxiosResponse>;
  };
  documents: {
    getAll: (params?: any) => Promise<AxiosResponse>;
    getById: (id: string) => Promise<AxiosResponse>;
    update: (id: string, data: any) => Promise<AxiosResponse>;
    delete: (id: string) => Promise<AxiosResponse>;
    upload: (formData: FormData) => Promise<AxiosResponse>;
    getAuditTrail: (id: string) => Promise<AxiosResponse>;
    sendEmailToOrganizer: (id: string, emailData: any) => Promise<AxiosResponse>;
    updateDocumentStatus: (submissionId: string, documentId: string, data: any) => Promise<AxiosResponse>;
    getConsultantSubmissions: (params?: any) => Promise<AxiosResponse>;
  };
  messages: {
    get: (params: {
      documentId?: string;
      vendorId?: string;
      consultantId?: string;
    }) => Promise<AxiosResponse<Message[]>>;
    send: (data: {
      text: string;
      documentId?: string;
      vendorId?: string;
      senderId?: string;
      senderRole?: string;
    }) => Promise<AxiosResponse<Message>>;
    getUnread: () => Promise<AxiosResponse>;
    markAsRead: (messageId: string) => Promise<AxiosResponse>;
  };
  notifications: {
    getAll: () => Promise<AxiosResponse>;
    markAsRead: (id: string) => Promise<AxiosResponse>;
    markAllAsRead: () => Promise<AxiosResponse>;
    send: (data: {
      documentId: string;
      status: string;
      comment: string;
      recipientId?: string;
    }) => Promise<AxiosResponse>;
    Email: (data: {
      documentId: string;
      status: string;
      recipientEmail: string;
      recipientName: string;
      companyName?: string;
    }) => Promise<AxiosResponse>;
  };
  vendors: {
    getAll: () => Promise<AxiosResponse>;
    getById: (id: string) => Promise<AxiosResponse>;
    update: (id: string, data: any) => Promise<AxiosResponse>;
    delete: (id: string) => Promise<AxiosResponse>;
  };
}

export type ApiServiceType = ApiService; 
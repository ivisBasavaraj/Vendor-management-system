// User role type
export type UserRole = 'admin' | 'consultant' | 'vendor' | 'cross_verifier' | 'approver' | 'imtma';

// User interface
export interface User {
  _id: string;
  id: string; // Alias for _id for compatibility
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  requiresLoginApproval?: boolean;
  agreementPeriod?: string;
}

// Login approval interface
export interface LoginApproval {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  requestToken: string;
  createdAt: string;
  expiresAt: string;
}

// Auth state interface
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  pendingLoginApproval: LoginApproval | null;
}

// Login result interface
export interface LoginResult {
  success: boolean;
  requiresApproval?: boolean;
  loginApprovalId?: string;
  token?: string;
  user?: User;
} 
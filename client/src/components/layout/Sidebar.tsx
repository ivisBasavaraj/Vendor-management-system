import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../utils/api';
import {
  HomeIcon,
  DocumentTextIcon,
  DocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  XCircleIcon,
  UsersIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [pendingLoginApprovalsCount, setPendingLoginApprovalsCount] = useState(0);

  // Fetch pending login approvals count
  useEffect(() => {
    const fetchPendingLoginApprovalsCount = async () => {
      // Only fetch for admin and consultant roles
      if (user && (user.role === 'admin' || user.role === 'consultant')) {
        try {
          const response = await apiService.loginApprovals.getPending();
          if (response.data.success) {
            setPendingLoginApprovalsCount(response.data.data.length);
          }
        } catch (error) {
          console.error('Failed to fetch pending login approvals count:', error);
          setPendingLoginApprovalsCount(0);
        }
      }
    };

    fetchPendingLoginApprovalsCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingLoginApprovalsCount, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Base menu items (accessible to all roles)
  const baseMenuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: <HomeIcon className="h-5 w-5" /> }
  ];

  // Role-specific menu items
  const roleMenuItems: Record<string, MenuItem[]> = {
    admin: [
      { name: 'Vendors', path: '/vendors', icon: <BuildingOfficeIcon className="h-5 w-5" /> },
      { name: 'Consultants', path: '/users/consultants', icon: <UserGroupIcon className="h-5 w-5" /> },
      { name: 'All Documents', path: '/documents', icon: <DocumentTextIcon className="h-5 w-5" /> },
      { name: 'Login Approvals', path: '/login-approvals', icon: <UsersIcon className="h-5 w-5" />, badge: pendingLoginApprovalsCount },
      { name: 'MIS Dashboard', path: '/reports', icon: <ChartBarIcon className="h-5 w-5" /> },
      { name: 'Reports', path: '/reports/documents', icon: <DocumentTextIcon className="h-5 w-5" /> },
      { name: 'Settings', path: '/settings', icon: <Cog6ToothIcon className="h-5 w-5" /> }
    ],
    vendor: [
      { name: 'Actions', path: '/actions', icon: <BoltIcon className="h-5 w-5" /> },
      { name: 'Contact IMTMA', path: '/contact', icon: <ChatBubbleLeftRightIcon className="h-5 w-5" /> },
      { name: 'Notifications', path: '/notifications', icon: <BellIcon className="h-5 w-5" /> }
    ],
    consultant: [
      { name: 'Dashboard', path: '/dashboard', icon: <HomeIcon className="h-5 w-5" /> },
      { name: 'Vendors List', path: '/vendors-list', icon: <BuildingOfficeIcon className="h-5 w-5" /> },
      { name: 'Document Review', path: '/review-documents', icon: <DocumentTextIcon className="h-5 w-5" /> },
      { name: 'Approved Documents', path: '/approved-documents', icon: <DocumentCheckIcon className="h-5 w-5" /> },
      { name: 'Login Approvals', path: '/login-approvals', icon: <UsersIcon className="h-5 w-5" />, badge: pendingLoginApprovalsCount },
      { name: 'Compliance', path: '/compliance-verification', icon: <DocumentMagnifyingGlassIcon className="h-5 w-5" /> },
      { name: 'Status', path: '/vendor-status', icon: <ChartBarIcon className="h-5 w-5" /> },
      { name: 'Profile', path: '/profile', icon: <UserCircleIcon className="h-5 w-5" /> },
      { name: 'Notifications', path: '/notifications', icon: <BellIcon className="h-5 w-5" /> }
    ],
    imtma: [
      { name: 'MIS Dashboard', path: '/reports', icon: <ChartBarIcon className="h-5 w-5" /> },
      { name: 'Vendor Compliance', path: '/reports/vendor-compliance', icon: <BuildingOfficeIcon className="h-5 w-5" /> },
      { name: 'Consultant Workload', path: '/reports/consultant-workload', icon: <UserGroupIcon className="h-5 w-5" /> },
      { name: 'Generate Reports', path: '/reports/generate', icon: <DocumentTextIcon className="h-5 w-5" /> },
      { name: 'Advanced Analytics', path: '/reports/advanced', icon: <ChartBarIcon className="h-5 w-5" /> },
      { name: 'Notifications', path: '/notifications', icon: <BellIcon className="h-5 w-5" /> }
    ]
  };

  // Get menu items based on user role
  const getMenuItems = () => {
    if (!user) return baseMenuItems;
    
    return [
      ...baseMenuItems,
      ...(roleMenuItems[user.role] || [])
    ];
  };

  return (
    <div className="bg-neutral-800 text-white w-64 min-h-screen flex flex-col">
      <div className="p-4 bg-neutral-900">
        <h1 className="text-xl font-bold">Vendor Management</h1>
      </div>
      
      <div className="p-4">
        <p className="text-neutral-400 text-sm">Welcome,</p>
        <p className="font-semibold">{user?.name || 'Guest'}</p>
        <p className="text-xs text-neutral-400 mt-1 capitalize">{user?.role || ''}</p>
        {user?.company && (
          <p className="text-xs text-neutral-400 mt-1">{user.company}</p>
        )}
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {getMenuItems().map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center px-4 py-2 rounded-lg transition-colors relative ${
                isActive 
                  ? 'bg-primary-600 text-white' 
                  : 'text-neutral-300 hover:bg-neutral-700'
              }`
            }
          >
            <span className="mr-3">
              {item.icon}
            </span>
            <span className="flex-1">{item.name}</span>
            {item.badge && item.badge > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[1.25rem] h-5 ml-2">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 bg-neutral-900">
        <NavLink 
          to="/profile" 
          className="flex items-center text-neutral-300 hover:text-white transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center mr-3">
            {user?.name?.charAt(0) || 'G'}
          </div>
          <div>
            <p className="text-sm font-medium">{user?.name || 'Guest'}</p>
            <p className="text-xs text-neutral-400">View Profile</p>
          </div>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
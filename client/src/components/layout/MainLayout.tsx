import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faHome, 
  faFileAlt, 
  faBell, 
  faUsers, 
  faChartBar, 
  faCog, 
  faSignOutAlt,
  faBars,
  faTimes,
  faUser,
  faDownload,
  faClipboardList,
  faHistory,
  faBuilding,
  faUserTie,
  faTrash,
  faCheckCircle,
  faSearch,
  faListAlt
} from '@fortawesome/free-solid-svg-icons';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const forceUpdate = useForceUpdate();

  // Close sidebar when route changes and force update
  useEffect(() => {
    setSidebarOpen(false);
    forceUpdate(); // Force component re-render
  }, [location.pathname, forceUpdate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    // Force navigation and ensure component re-render
    setSidebarOpen(false);
    
    // If we're already on the target path, force a refresh
    if (location.pathname === path) {
      window.location.reload();
      return;
    }
    
    // Navigate to the new path
    navigate(path, { replace: false });
    
    // Force a small delay and update to ensure proper re-rendering
    setTimeout(() => {
      forceUpdate();
    }, 50);
  };

  // Navigation items based on user role
  let navigationItems = [];
  
  if (user?.role === 'vendor') {
    navigationItems = [
      { name: 'Dashboard', path: '/dashboard', icon: <FontAwesomeIcon icon={faHome} /> },
      { name: 'Upload Documents', path: '/documents/submit', icon: <FontAwesomeIcon icon={faFileAlt} /> },
      { name: 'View Documents', path: '/documents', icon: <FontAwesomeIcon icon={faFileAlt} /> },
      { name: 'Edit Documents', path: '/documents/edit', icon: <FontAwesomeIcon icon={faFileAlt} /> },
      //{ name: 'Rejected Documents', path: '/documents/rejected', icon: <FontAwesomeIcon icon={faTrash} /> },
      { name: 'Status', path: '/documents/status', icon: <FontAwesomeIcon icon={faBell} /> },
      { name: 'Profile', path: '/profile', icon: <FontAwesomeIcon icon={faUser} /> },
      { name: 'Notifications', path: '/notifications', icon: <FontAwesomeIcon icon={faBell} /> },
    ];
  } else if (user?.role === 'consultant') {
    // Consultant-specific navigation items
    navigationItems = [
      { name: 'Dashboard', path: '/dashboard', icon: <FontAwesomeIcon icon={faHome} /> },
      { name: 'Vendors List', path: '/vendors-list', icon: <FontAwesomeIcon icon={faBuilding} /> },
      { name: 'Approved Documents', path: '/approved-documents', icon: <FontAwesomeIcon icon={faCheckCircle} /> },
      { name: 'Status ', path: '/vendor-status', icon: <FontAwesomeIcon icon={faChartBar} /> },
      { name: 'Profile', path: '/profile', icon: <FontAwesomeIcon icon={faUser} /> },
      { name: 'Notifications', path: '/notifications', icon: <FontAwesomeIcon icon={faBell} /> },
    ];
  } else if (user?.role === 'admin') {
    // Admin-specific navigation items
    navigationItems = [
      { name: 'Dashboard', path: '/dashboard', icon: <FontAwesomeIcon icon={faHome} /> },
      { name: 'User Management', path: '/users/manage', icon: <FontAwesomeIcon icon={faUsers} /> },
      { name: 'Vendors', path: '/admin/vendors', icon: <FontAwesomeIcon icon={faBuilding} /> },
      { name: 'Consultants', path: '/admin/consultants', icon: <FontAwesomeIcon icon={faUserTie} /> },
      { name: 'Activity Logs', path: '/admin/activity-logs', icon: <FontAwesomeIcon icon={faHistory} /> },
      { name: 'MIS Reports', path: '/admin/reports', icon: <FontAwesomeIcon icon={faChartBar} /> },
      { name: 'Status', path: '/admin/status', icon: <FontAwesomeIcon icon={faClipboardList} /> },
      { name: 'Downloads', path: '/admin/downloads', icon: <FontAwesomeIcon icon={faDownload} /> },
      { name: 'Notifications', path: '/notifications', icon: <FontAwesomeIcon icon={faBell} /> },
      { name: 'Settings', path: '/admin/settings', icon: <FontAwesomeIcon icon={faCog} /> }
    ];
  } else {
    // Default navigation items for other roles
    navigationItems = [
      { name: 'Dashboard', path: '/dashboard', icon: <FontAwesomeIcon icon={faHome} /> },
      { name: 'Documents', path: '/documents', icon: <FontAwesomeIcon icon={faFileAlt} /> },
      { name: 'Notifications', path: '/notifications', icon: <FontAwesomeIcon icon={faBell} /> },
      { name: 'Reports', path: '/reports', icon: <FontAwesomeIcon icon={faChartBar} /> },
      { name: 'Settings', path: '/settings', icon: <FontAwesomeIcon icon={faCog} /> }
    ];
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar for mobile and tablets */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} fixed inset-0 z-40 win-md:hidden`} role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="relative flex flex-col flex-1 w-full max-w-xs bg-white">
          <div className="absolute top-0 right-0 pt-2 -mr-12">
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <FontAwesomeIcon icon={faTimes} className="w-6 h-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                <FontAwesomeIcon icon={faBuilding} className="h-4 w-4 text-white" />
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-800">Navigation</span>
            </div>
            <nav className="px-2 mt-3 space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.path)}
                  className={`group flex items-center w-full px-2 py-2 text-base font-medium rounded-md text-left ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={`mr-4 h-6 w-6 ${
                    location.pathname === item.path ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`}>
                    {item.icon}
                  </span>
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  {user?.name?.charAt(0) || <FontAwesomeIcon icon={faUser} />}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-base font-medium text-gray-700">{user?.name}</p>
                <p className="text-sm font-medium text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop and large tablets */}
      <div className="hidden win-md:flex win-md:flex-shrink-0">
        <div className="flex flex-col w-64 min-w-64">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
            <div className="flex items-center flex-shrink-0 px-4 mb-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                <FontAwesomeIcon icon={faBuilding} className="h-4 w-4 text-white" />
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-800">Navigation</span>
            </div>
            <div className="flex flex-col flex-grow mt-3">
              <nav className="flex-1 px-2 space-y-1 bg-white">
                {navigationItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.path)}
                    className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-left ${
                      location.pathname === item.path
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      location.pathname === item.path ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex flex-shrink-0 p-4 border-t border-gray-200">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                    {user?.name?.charAt(0) || <FontAwesomeIcon icon={faUser} />}
                  </div>
                </div>
                <div className="ml-3 flex-grow">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs font-medium text-gray-500">{user?.role}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none"
                >
                  <span className="sr-only">Logout</span>
                  <FontAwesomeIcon icon={faSignOutAlt} className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Professional Top Banner */}
        <div className="relative z-10 flex-shrink-0 bg-gradient-to-r from-slate-800 via-slate-700 to-gray-800 shadow-xl border-b border-slate-600">
          {/* Main Header Bar */}
          <div className="flex h-16 w-full">
            <button
              type="button"
              className="px-4 border-r border-slate-600 text-gray-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-400 win-md:hidden transition-colors duration-200"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <FontAwesomeIcon icon={faBars} className="h-6 w-6" />
            </button>
            
            <div className="flex-1 px-6 flex justify-between items-center">
              {/* Professional Brand Section */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                    <FontAwesomeIcon icon={faBuilding} className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <h1 className="text-xl font-bold text-white tracking-wide">
                      Vendor Management System
                    </h1>
                    <p className="text-xs text-gray-300 font-medium">
                      Professional Document Management Platform
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right Side - User Info & Actions */}
              <div className="flex items-center space-x-4">
                {/* User Info */}
                <div className="hidden md:flex items-center space-x-3 bg-slate-700 bg-opacity-60 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-600">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                    <span className="text-sm font-semibold text-white">
                      {user?.name?.charAt(0) || <FontAwesomeIcon icon={faUser} className="h-4 w-4" />}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-gray-300 capitalize">{user?.role}</p>
                  </div>
                </div>
                
                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 backdrop-blur-sm border border-red-500 rounded-lg text-sm font-medium text-white hover:text-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition-all duration-200 shadow-lg"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
          
          {/* Subtle bottom border with gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50"></div>
        </div>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 
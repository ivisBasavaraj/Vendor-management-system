import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../utils/api';
import { getFullImageUrl } from '../../utils/imageUtils';
import { 
  UserPlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  phone: string;
  address: string;
  logo?: string;
  isActive: boolean;
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('vendor');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        if (activeTab === 'all') {
          response = await apiService.users.getAll();
        } else {
          response = await apiService.users.getAll({ role: activeTab });
        }
        
        if (response.data.success) {
          setUsers(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch users');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [activeTab, refreshTrigger]);

  const handleCreateUser = () => {
    navigate('/users/new');
  };

  const handleEditUser = (userId: string) => {
    navigate(`/users/edit/${userId}`);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await apiService.users.delete(userId);
      if (response.data.success) {
        setRefreshTrigger(prev => prev + 1);
      } else {
        setError(response.data.message || 'Failed to delete user');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting user');
      console.error('Error deleting user:', err);
    }
  };

  const handleToggleUserStatus = async (userId: string, isCurrentlyActive: boolean) => {
    try {
      let response;
      if (isCurrentlyActive) {
        response = await apiService.users.deactivate(userId);
      } else {
        response = await apiService.users.activate(userId);
      }
      
      if (response.data.success) {
        setRefreshTrigger(prev => prev + 1);
      } else {
        setError(response.data.message || `Failed to ${isCurrentlyActive ? 'deactivate' : 'activate'} user`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating user status');
      console.error('Error updating user status:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const renderUserList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md text-red-700 dark:text-red-400">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p className="text-gray-500 dark:text-gray-400">No users found</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={handleCreateUser}>
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Create New User
          </Button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.logo ? (
                        <img 
                          className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" 
                          src={getFullImageUrl(user.logo)} 
                          alt={user.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center ${user.logo ? 'hidden' : ''}`}>
                        <span className="text-primary-600 dark:text-primary-300 font-medium text-sm">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.company || 'No company'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{user.phone || 'No phone'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    variant={
                      user.role === 'admin' ? 'primary' :
                      user.role === 'imtma' ? 'info' :
                      user.role === 'consultant' ? 'success' :
                      user.role === 'vendor' ? 'warning' : 'default'
                    }
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={user.isActive ? 'success' : 'danger'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditUser(user._id)}
                      title="Edit User"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                      title={user.isActive ? 'Deactivate User' : 'Activate User'}
                    >
                      {user.isActive ? (
                        <XMarkIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        <CheckIcon className="h-5 w-5 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(user._id)}
                      title="Delete User"
                    >
                      <TrashIcon className="h-5 w-5 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <Button variant="primary" onClick={handleCreateUser}>
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Create New User
        </Button>
      </div>

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="vendor">Vendors</TabsTrigger>
            <TabsTrigger value="consultant">Consultants</TabsTrigger>
            <TabsTrigger value="imtma">IMTMA</TabsTrigger>
            <TabsTrigger value="admin">Admins</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            {renderUserList()}
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default UserManagement;
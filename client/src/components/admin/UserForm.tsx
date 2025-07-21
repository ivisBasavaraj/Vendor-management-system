import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../utils/api';
import { getFullImageUrl } from '../../utils/imageUtils';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon, 
  MapPinIcon,
  LockClosedIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

interface UserFormProps {
  mode: 'create' | 'edit';
}

const UserForm: React.FC<UserFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'vendor',
    company: '',
    phone: '',
    address: '',
    requiresLoginApproval: true,
    logo: null as File | null,
    assignedConsultantId: '',
    assignedVendorId: '',
    agreementPeriod: '1 April 2025 to 31 March 2026'
  });
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Array<{id: string, name: string, email: string}>>([]);
  const [consultants, setConsultants] = useState<Array<{id: string, name: string, email: string}>>([]);

  useEffect(() => {
    // Fetch vendors and consultants regardless of mode
    fetchVendors();
    fetchConsultants();
    
    if (mode === 'edit' && userId) {
      fetchUserData(userId);
    }
  }, [mode, userId]);
  
  const fetchVendors = async () => {
    try {
      const response = await apiService.users.getVendors();
      if (response.data.success) {
        setVendors(response.data.data.map((vendor: any) => ({
          id: vendor._id || vendor.id,
          name: vendor.name,
          email: vendor.email
        })));
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };
  
  const fetchConsultants = async () => {
    try {
      const response = await apiService.users.getConsultants();
      if (response.data.success) {
        setConsultants(response.data.data.map((consultant: any) => ({
          id: consultant._id || consultant.id,
          name: consultant.name,
          email: consultant.email
        })));
      }
    } catch (err) {
      console.error('Error fetching consultants:', err);
    }
  };

  const fetchUserData = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiService.users.getById(id);
      
      if (response.data.success) {
        const userData = response.data.data;
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          password: '',
          confirmPassword: '',
          role: userData.role || 'vendor',
          company: userData.company || '',
          phone: userData.phone || '',
          address: userData.address || '',
          requiresLoginApproval: userData.requiresLoginApproval !== undefined ? userData.requiresLoginApproval : true,
          logo: null,
          assignedConsultantId: userData.assignedConsultantId || userData.consultant || '',
          assignedVendorId: userData.assignedVendorId || userData.vendor || '',
          agreementPeriod: userData.agreementPeriod || '1 April 2025 to 31 March 2026'
        });
        
        if (userData.logo) {
          console.log('User logo URL:', userData.logo);
          const logoUrl = getFullImageUrl(userData.logo);
          console.log('Full logo URL:', logoUrl);
          setLogoPreview(logoUrl);
        } else {
          console.log('No logo found for user');
        }
      } else {
        setError(response.data.message || 'Failed to fetch user data');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching user data');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      setFormData(prev => ({
        ...prev,
        logo: file
      }));
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({
        ...prev,
        logo: null
      }));
      setLogoPreview(null);
    }
  };

  const validateForm = () => {
    // Reset errors
    setError(null);
    
    // Check required fields
    if (!formData.name || !formData.email || !formData.role) {
      setError('Please fill in all required fields');
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Check password for new users
    if (mode === 'create') {
      if (!formData.password) {
        setError('Password is required for new users');
        return false;
      }
      
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    } else if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Validate logo file size if present
    if (formData.logo && formData.logo.size > 5 * 1024 * 1024) {
      setError('Logo image must be less than 5MB');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Create FormData object for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('role', formData.role);
      submitData.append('company', formData.company || '');
      submitData.append('phone', formData.phone || '');
      submitData.append('address', formData.address || '');
      submitData.append('requiresLoginApproval', String(formData.requiresLoginApproval));
      
      // Add agreement period for vendors
      if (formData.role === 'vendor') {
        submitData.append('agreementPeriod', formData.agreementPeriod);
      }
      
      // Add assignment data if available
      if (formData.role === 'vendor' && formData.assignedConsultantId) {
        submitData.append('assignedConsultantId', formData.assignedConsultantId);
      }
      
      if (formData.role === 'consultant' && formData.assignedVendorId) {
        submitData.append('assignedVendorId', formData.assignedVendorId);
      }
      
      if (formData.password) {
        submitData.append('password', formData.password);
      }
      
      if (formData.logo) {
        submitData.append('logo', formData.logo);
      }
      
      let response;
      if (mode === 'create') {
        response = await apiService.users.create(submitData);
        
        // If assignment was specified and user creation was successful, make the assignment
        if (response && response.data.success) {
          const newUserId = response.data.data._id || response.data.data.id;
          
          if (formData.role === 'vendor' && formData.assignedConsultantId) {
            try {
              await apiService.users.assignConsultant(
                newUserId, 
                formData.assignedConsultantId
              );
            } catch (assignErr) {
              console.error('Error assigning consultant to vendor:', assignErr);
            }
          }
        }
      } else if (userId) {
        response = await apiService.users.update(userId, submitData);
        
        // Handle assignment updates for existing users
        if (response && response.data.success) {
          if (formData.role === 'vendor' && formData.assignedConsultantId) {
            try {
              await apiService.users.assignConsultant(
                userId, 
                formData.assignedConsultantId
              );
            } catch (assignErr) {
              console.error('Error assigning consultant to vendor:', assignErr);
            }
          }
        }
      }
      
      if (response && response.data.success) {
        setSuccess(mode === 'create' ? 'User created successfully!' : 'User updated successfully!');
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/users/manage');
        }, 1500);
      } else {
        setError((response && response.data.message) || 'Failed to save user');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
      console.error('Error saving user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/users/manage');
  };

  if (loading && mode === 'edit') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Card>
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          {mode === 'create' ? 'Create New User' : 'Edit User'}
        </h3>
        
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mt-4 bg-green-50 dark:bg-green-900/30 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* User Logo */}
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                User Logo
              </label>
              <div className="mt-1 flex items-center">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="h-24 w-24 rounded-md object-cover"
                      onError={(e) => {
                        console.error('Failed to load image:', logoPreview);
                        console.error('Image error event:', e);
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', logoPreview);
                      }}
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, logo: null }));
                        setLogoPreview(null);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="ml-5">
                  <div className="relative bg-white dark:bg-gray-800 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <label htmlFor="user-logo" className="relative text-sm font-medium text-primary-600 dark:text-primary-400 pointer-events-none">
                      <span>Upload a file</span>
                      <input
                        id="user-logo"
                        name="logo"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="sm:col-span-3">
              <Input
                label="Full Name"
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                leftIcon={<UserIcon className="h-5 w-5" />}
                placeholder="John Doe"
              />
            </div>

            <div className="sm:col-span-3">
              <Input
                label="Email Address"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                placeholder="john@example.com"
              />
            </div>

            <div className="sm:col-span-3">
              <Input
                label="Phone Number"
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                leftIcon={<PhoneIcon className="h-5 w-5" />}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="sm:col-span-3">
              <Input
                label="Company/Organization"
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleInputChange}
                leftIcon={<BuildingOfficeIcon className="h-5 w-5" />}
                placeholder="Acme Inc."
              />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  className="block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="123 Main St, City, Country"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="sm:col-span-3">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="vendor">Vendor</option>
                  <option value="consultant">Consultant</option>
                  <option value="imtma">IMTMA</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <div className="flex items-center h-full mt-6">
                <input
                  id="requiresLoginApproval"
                  name="requiresLoginApproval"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  checked={formData.requiresLoginApproval}
                  onChange={handleInputChange}
                  disabled={formData.role !== 'vendor'}
                />
                <label htmlFor="requiresLoginApproval" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Requires login approval (Vendors only)
                </label>
              </div>
            </div>
            
            {/* Agreement Period (for Vendor role) */}
            {formData.role === 'vendor' && (
              <div className="sm:col-span-6">
                <Input
                  label="Agreement Period"
                  id="agreementPeriod"
                  name="agreementPeriod"
                  type="text"
                  value={formData.agreementPeriod}
                  onChange={handleInputChange}
                  placeholder="e.g., Annual Contract, 2 Years, Project Based"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Specify the agreement period for this vendor.
                </p>
              </div>
            )}
            
            {/* Consultant Assignment (for Vendor role) */}
            {formData.role === 'vendor' && (
              <div className="sm:col-span-6">
                <label htmlFor="assignedConsultantId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assign to Consultant
                </label>
                <div className="mt-1">
                  <select
                    id="assignedConsultantId"
                    name="assignedConsultantId"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    value={formData.assignedConsultantId}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a Consultant</option>
                    {consultants.map(consultant => (
                      <option key={consultant.id} value={consultant.id}>
                        {consultant.name} ({consultant.email})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This vendor will be assigned to the selected consultant for document review.
                </p>
              </div>
            )}
            
            {/* Vendor Assignment (for Consultant role) */}
            {formData.role === 'consultant' && (
              <div className="sm:col-span-6">
                <label htmlFor="assignedVendorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assign to Vendor
                </label>
                <div className="mt-1">
                  <select
                    id="assignedVendorId"
                    name="assignedVendorId"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    value={formData.assignedVendorId}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a Vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name} ({vendor.email})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This consultant will be assigned to the selected vendor for document review.
                </p>
              </div>
            )}

            {/* Password Fields */}
            {mode === 'create' || formData.password ? (
              <>
                <div className="sm:col-span-3">
                  <Input
                    label={mode === 'create' ? 'Password' : 'New Password'}
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={mode === 'create'}
                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                    placeholder="••••••••"
                  />
                </div>

                <div className="sm:col-span-3">
                  <Input
                    label="Confirm Password"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required={mode === 'create' || !!formData.password}
                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : (
              <div className="sm:col-span-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      onClick={() => setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }))}
                    >
                      <LockClosedIcon className="h-4 w-4 mr-2" />
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
            >
              {mode === 'create' ? 'Create User' : 'Update User'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default UserForm;
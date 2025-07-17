import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../utils/api';
import {
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import MainLayout from '../../components/layout/MainLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import ProfileImageUploader from '../../components/ui/ProfileImageUploader';

const UserRegistrationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'vendor', // Default role
    company: '',
    phone: '',
    address: '',
    assignedConsultantId: '',
    assignedVendorId: '',
    requiresLoginApproval: true, // Default to true for vendors
    agreementPeriod: 'Annual Contract' // Default agreement period for vendors
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Array<{id: string, name: string, email: string}>>([]);
  const [consultants, setConsultants] = useState<Array<{id: string, name: string, email: string}>>([]);

  // Fetch vendors and consultants when component mounts
  useEffect(() => {
    fetchVendors();
    fetchConsultants();
  }, []);

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

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile image change
  const handleProfileImageChange = (file: File | null, preview: string | null) => {
    setProfileImage(file);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('role', formData.role);
      formDataToSend.append('company', formData.company);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('requiresLoginApproval', (formData.role === 'vendor' ? formData.requiresLoginApproval : false).toString());
      
      // Add agreement period for vendors
      if (formData.role === 'vendor') {
        formDataToSend.append('agreementPeriod', formData.agreementPeriod);
      }

      // Add profile image if selected
      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }

      // Add assignment data if applicable
      if (formData.role === 'vendor' && formData.assignedConsultantId) {
        formDataToSend.append('assignedConsultantId', formData.assignedConsultantId);
      }
      
      if (formData.role === 'consultant' && formData.assignedVendorId) {
        formDataToSend.append('assignedVendorId', formData.assignedVendorId);
      }
      
      // Create user using FormData to support file upload
      const response = await apiService.users.create(formDataToSend);

      if (response.data.success) {
        // Assignment is now handled directly in the create API call
        setSuccess(`User ${formData.name} has been successfully created!`);
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'vendor',
          company: '',
          phone: '',
          address: '',
          assignedConsultantId: '',
          assignedVendorId: '',
          requiresLoginApproval: true,
          agreementPeriod: 'Annual Contract'
        });
        setProfileImage(null);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/users/manage');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  // If not admin, redirect
  if (user?.role !== 'admin') {
    return (
      <MainLayout>
        <div className="p-6">
          <Card className="max-w-lg mx-auto p-6">
            <div className="text-center">
              <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h2>
              <p className="mt-1 text-sm text-gray-500">
                You don't have permission to access this page.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => navigate('/dashboard')}
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      {/* Left side - Form */}
      <div className="w-full md:w-3/5 p-8 md:p-12 lg:p-16 overflow-y-auto">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center mr-3">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New User</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Add a new vendor or consultant to your organization
            </p>
          </motion.div>

          {/* Notifications */}
          {error && (
            <motion.div
              className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <span className="text-red-700 dark:text-red-400">{error}</span>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/30 dark:border-green-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-green-700 dark:text-green-400">{success}</span>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Image */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Picture</h3>
              <div className="flex justify-center">
                <ProfileImageUploader
                  onImageChange={handleProfileImageChange}
                  size="lg"
                />
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Full Name"
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    leftIcon={<UserIcon className="h-5 w-5" />}
                    className="rounded-xl"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Input
                    label="Email Address"
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                    className="rounded-xl"
                  />
                </div>
                
                <div>
                  <Input
                    label="Password"
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                    className="rounded-xl"
                  />
                </div>
                
                <div>
                  <Input
                    label="Confirm Password"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Role & Assignment */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Role & Assignment</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="vendor">Vendor</option>
                    <option value="consultant">Consultant</option>
                  </select>
                </div>
                
                {formData.role === 'vendor' && (
                  <div className="flex items-center">
                    <input
                      id="requiresLoginApproval"
                      name="requiresLoginApproval"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                      checked={formData.requiresLoginApproval}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          requiresLoginApproval: e.target.checked
                        }));
                      }}
                    />
                    <label htmlFor="requiresLoginApproval" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Requires Login Approval
                    </label>
                  </div>
                )}
                
                {formData.role === 'vendor' && (
                  <div>
                    <Input
                      label="Agreement Period"
                      id="agreementPeriod"
                      name="agreementPeriod"
                      type="text"
                      value={formData.agreementPeriod}
                      onChange={handleChange}
                      placeholder="e.g., Annual Contract, 2 Years, Project Based"
                      className="rounded-xl"
                    />
                  </div>
                )}
                
                <div>
                  {formData.role === 'vendor' ? (
                    <>
                      <label htmlFor="assignedConsultantId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Assign to Consultant
                      </label>
                      <select
                        id="assignedConsultantId"
                        name="assignedConsultantId"
                        className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.assignedConsultantId}
                        onChange={handleChange}
                      >
                        <option value="">Select a Consultant</option>
                        {consultants.map(consultant => (
                          <option key={consultant.id} value={consultant.id}>
                            {consultant.name}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label htmlFor="assignedVendorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Assign to Vendor
                      </label>
                      <select
                        id="assignedVendorId"
                        name="assignedVendorId"
                        className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.assignedVendorId}
                        onChange={handleChange}
                      >
                        <option value="">Select a Vendor</option>
                        {vendors.map(vendor => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Company Name"
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    leftIcon={<BuildingOfficeIcon className="h-5 w-5" />}
                    className="rounded-xl"
                  />
                </div>
                
                <div>
                  <Input
                    label="Phone Number"
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    leftIcon={<PhoneIcon className="h-5 w-5" />}
                    className="rounded-xl"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    leftIcon={<MapPinIcon className="h-5 w-5" />}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/users/manage')}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={loading}
                className="rounded-xl w-full sm:w-auto py-3 px-8"
              >
                Create User
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Right side - Illustration */}
      <div className="hidden md:block md:w-2/5 bg-primary-600 relative">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md">
            <div className="text-white mb-8">
              <h2 className="text-3xl font-bold mb-4">Welcome to Vendor Management</h2>
              <p className="text-white/80 text-lg">
                Create new user accounts to expand your organization and streamline your document management workflow.
              </p>
            </div>
            
            {/* Illustration */}
            <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md mx-auto">
              <g fill="#fff" opacity="0.1">
                <circle cx="250" cy="250" r="200" />
                <circle cx="250" cy="250" r="150" />
                <circle cx="250" cy="250" r="100" />
                <circle cx="250" cy="250" r="50" />
              </g>
              <g fill="none" stroke="#fff" strokeWidth="2" opacity="0.4">
                <path d="M100,250 C100,150 150,100 250,100 C350,100 400,150 400,250 C400,350 350,400 250,400 C150,400 100,350 100,250 Z" />
                <path d="M150,250 C150,180 180,150 250,150 C320,150 350,180 350,250 C350,320 320,350 250,350 C180,350 150,320 150,250 Z" />
              </g>
              <g fill="#fff">
                <circle cx="250" cy="150" r="10" />
                <circle cx="350" cy="250" r="10" />
                <circle cx="250" cy="350" r="10" />
                <circle cx="150" cy="250" r="10" />
              </g>
              <path d="M220,200 L280,200 L280,300 L250,320 L220,300 Z" fill="#fff" opacity="0.6" />
              <rect x="240" y="160" width="20" height="40" fill="#fff" opacity="0.6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegistrationPage;
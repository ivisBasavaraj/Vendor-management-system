import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../utils/api';
import { getFullImageUrl } from '../../utils/imageUtils';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProfileImageUploader from '../../components/ui/ProfileImageUploader';
import {
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  IdentificationIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  BanknotesIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  company?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  website?: string;
  registrationNumber?: string;
  taxId?: string;
  industry?: string;
  description?: string;
  logo?: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (user) {
          try {
            // Try to fetch the full user profile from the API
            const response = await apiService.users.getById(user._id);
            const userData = response.data.data || response.data;
            
            setProfile({
              _id: userData._id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              company: userData.company || user.company || '',
              phone: userData.phone || '',
              address: userData.address || '',
              contactPerson: userData.contactPerson || userData.name,
              website: userData.website || '',
              registrationNumber: userData.registrationNumber || '',
              taxId: userData.taxId || '',
              industry: userData.industry || '',
              description: userData.description || '',
              logo: getFullImageUrl(userData.logo)
            });
          } catch (apiError) {
            console.error('Failed to fetch user profile from API:', apiError);
            
            // Fallback to user data from auth context if API call fails
            setProfile({
              _id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              company: user.company || '',
              phone: '',
              address: '',
              contactPerson: user.name,
              website: '',
              registrationNumber: '',
              taxId: '',
              industry: '',
              description: '',
              logo: ''
            });
          }
        }
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (profile) {
      setProfile({
        ...profile,
        [name]: value
      });
    }
  };

  const handleProfileImageChange = (file: File | null, preview: string | null) => {
    setProfileImage(file);
    if (profile && preview) {
      setProfile({
        ...profile,
        logo: preview
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Prepare the data to update
      let updateData: any;
      
      if (profileImage) {
        // Use FormData for file upload
        updateData = new FormData();
        updateData.append('name', profile.name);
        updateData.append('company', profile.company || '');
        updateData.append('phone', profile.phone || '');
        updateData.append('address', profile.address || '');
        updateData.append('contactPerson', profile.contactPerson || '');
        updateData.append('website', profile.website || '');
        updateData.append('registrationNumber', profile.registrationNumber || '');
        updateData.append('taxId', profile.taxId || '');
        updateData.append('industry', profile.industry || '');
        updateData.append('description', profile.description || '');
        updateData.append('profileImage', profileImage);
      } else {
        // Use regular object for text-only updates
        updateData = {
          name: profile.name,
          company: profile.company,
          phone: profile.phone,
          address: profile.address,
          contactPerson: profile.contactPerson,
          website: profile.website,
          registrationNumber: profile.registrationNumber,
          taxId: profile.taxId,
          industry: profile.industry,
          description: profile.description
        };
      }
      
      // Call the API to update the profile
      try {
        await apiService.users.update(profile._id, updateData);
        setSuccess('Profile updated successfully');
      } catch (apiError) {
        console.error('Failed to update profile via users API:', apiError);
        
        // Fallback to auth.updateDetails if users.update fails
        try {
          await apiService.auth.updateDetails(updateData);
          setSuccess('Profile updated successfully');
        } catch (authError) {
          console.error('Failed to update profile via auth API:', authError);
          throw new Error('Failed to update profile. Please try again later.');
        }
      }
      
      setEditMode(false);
      setSaving(false);
      setProfileImage(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error && !profile) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <Card className="max-w-md mx-auto mt-8">
            <div className="p-6 text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Profile</h2>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
              <p className="text-blue-100">Manage your account information</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6 relative z-10">
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded-md">
              <div className="flex">
                <CheckIcon className="h-6 w-6 text-green-500 mr-3" />
                <span className="text-green-700 dark:text-green-400">{success}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <XMarkIcon className="h-6 w-6 text-red-500 mr-3" />
                <span className="text-red-700 dark:text-red-400">{error}</span>
              </div>
            </div>
          )}

          {profile && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <Card className="sticky top-8">
                  <div className="p-6 text-center">
                    {/* Profile Picture */}
                    <div className="relative mb-4">
                      {editMode ? (
                        <ProfileImageUploader
                          currentImage={profile.logo}
                          onImageChange={handleProfileImageChange}
                          size="lg"
                        />
                      ) : (
                        <>
                          {profile.logo ? (
                            <img
                              className="h-32 w-32 rounded-full object-cover mx-auto shadow-lg"
                              src={profile.logo}
                              alt={profile.name}
                            />
                          ) : (
                            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mx-auto shadow-lg">
                              {profile.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Profile Info */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{profile.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-2 capitalize">{profile.role}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{profile.company || 'No company specified'}</p>
                    
                    {/* Action Button */}
                    <Button
                      onClick={() => setEditMode(!editMode)}
                      variant={editMode ? "outline" : "primary"}
                      className="w-full"
                      leftIcon={editMode ? <XMarkIcon className="h-4 w-4" /> : <PencilSquareIcon className="h-4 w-4" />}
                    >
                      {editMode ? 'Cancel Edit' : 'Edit Profile'}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Information Cards */}
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {editMode ? (
                    /* Edit Form */
                    <Card>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Profile Information</h3>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Personal Information Section */}
                          <div>
                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                              <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
                              Personal Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Full Name *
                                </label>
                                <input
                                  type="text"
                                  name="name"
                                  value={profile.name}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Email Address
                                </label>
                                <input
                                  type="email"
                                  name="email"
                                  value={profile.email}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                  disabled
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Phone Number
                                </label>
                                <input
                                  type="text"
                                  name="phone"
                                  value={profile.phone}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                                  placeholder="Enter phone number"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Company Information Section */}
                          <div>
                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                              <BuildingOfficeIcon className="h-5 w-5 mr-2 text-green-500" />
                              Company Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Company Name
                                </label>
                                <input
                                  type="text"
                                  name="company"
                                  value={profile.company}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                                  placeholder="Enter company name"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Industry
                                </label>
                                <input
                                  type="text"
                                  name="industry"
                                  value={profile.industry}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                                  placeholder="Enter industry"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Registration Number
                                </label>
                                <input
                                  type="text"
                                  name="registrationNumber"
                                  value={profile.registrationNumber}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                                  placeholder="Enter registration number"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Tax ID
                                </label>
                                <input
                                  type="text"
                                  name="taxId"
                                  value={profile.taxId}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                                  placeholder="Enter tax ID"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Website
                                </label>
                                <input
                                  type="url"
                                  name="website"
                                  value={profile.website}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                                  placeholder="https://example.com"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Address & Description */}
                          <div>
                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                              <MapPinIcon className="h-5 w-5 mr-2 text-purple-500" />
                              Additional Information
                            </h4>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Address
                                </label>
                                <input
                                  type="text"
                                  name="address"
                                  value={profile.address}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                                  placeholder="Enter your address"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Company Description
                                </label>
                                <textarea
                                  name="description"
                                  value={profile.description}
                                  onChange={handleInputChange}
                                  rows={4}
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors resize-none"
                                  placeholder="Tell us about your company..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditMode(false)}
                            >
                              Cancel
                            </Button>
                              <Button
                              type="submit"
                              isLoading={saving}
                              leftIcon={<CheckIcon className="h-4 w-4" />}
                            >
                              {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </Card>
                  ) : (
                    /* View Mode */
                    <div className="space-y-6">
                      {/* Personal Information Card */}
                      <Card>
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                            <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
                            Personal Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoItem
                              icon={<UserIcon className="h-5 w-5" />}
                              label="Full Name"
                              value={profile.name}
                            />
                            <InfoItem
                              icon={<EnvelopeIcon className="h-5 w-5" />}
                              label="Email Address"
                              value={profile.email}
                            />
                            <InfoItem
                              icon={<PhoneIcon className="h-5 w-5" />}
                              label="Phone Number"
                              value={profile.phone || 'Not provided'}
                            />
                          </div>
                        </div>
                      </Card>

                      {/* Company Information Card */}
                      <Card>
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-green-500" />
                            Company Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoItem
                              icon={<BuildingOfficeIcon className="h-5 w-5" />}
                              label="Company Name"
                              value={profile.company || 'Not provided'}
                            />
                           
                          </div>
                        </div>
                      </Card>

                      {/* Additional Information Card */}
                      <Card>
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                            <MapPinIcon className="h-5 w-5 mr-2 text-purple-500" />
                            Additional Information
                          </h3>
                          <div className="space-y-6">
                            <InfoItem
                              icon={<MapPinIcon className="h-5 w-5" />}
                              label="Address"
                              value={profile.address || 'Not provided'}
                            />
                            {profile.description && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Description</h4>
                                <p className="text-gray-900 dark:text-white leading-relaxed">{profile.description}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

// Helper component for info items
const InfoItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start space-x-3">
    <div className="flex-shrink-0 mt-1 text-gray-400 dark:text-gray-500">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-gray-900 dark:text-white break-words">{value}</p>
    </div>
  </div>
);

export default ProfilePage;
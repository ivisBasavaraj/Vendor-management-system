import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faArrowLeft,
  faSave,
  faUser,
  faEnvelope,
  faPhone,
  faBuilding,
  faMapMarkerAlt,
  faIdCard,
  faGlobe,
  faUserTie,
  faCalendarAlt,
  faFileContract
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import apiService from '../../utils/api';

interface VendorFormData {
  name: string;
  email: string;
  phone: string;
  status: string;
  industry: string;
  location: string;
  companyName: string;
  contactPerson: string;
  address: string;
  website: string;
  taxId: string;
  registrationNumber: string;
  assignedConsultant: string;
  workLocation: string;
  agreementPeriod: string;
  companyRegNo: string;
  logo?: string;
}

interface Consultant {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

const VendorEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  
  const [formData, setFormData] = useState<VendorFormData>({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    industry: '',
    location: '',
    companyName: '',
    contactPerson: '',
    address: '',
    website: '',
    taxId: '',
    registrationNumber: '',
    assignedConsultant: '',
    workLocation: '',
    agreementPeriod: '',
    companyRegNo: ''
  });

  const [errors, setErrors] = useState<Partial<VendorFormData>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVendorDetails();
      fetchConsultants();
    }
  }, [id]);

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.users.getById(id!);
      const vendor = response.data.data;
      
      setFormData({
        name: vendor.name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        status: vendor.status || 'active',
        industry: vendor.industry || '',
        location: vendor.location || '',
        companyName: vendor.company || '',
        contactPerson: vendor.contactPerson || '',
        address: vendor.address || '',
        website: vendor.website || '',
        taxId: vendor.taxId || '',
        registrationNumber: vendor.companyRegNo || '',
        assignedConsultant: vendor.assignedConsultant?._id || '',
        workLocation: vendor.workLocation || '',
        agreementPeriod: vendor.agreementPeriod || '',
        companyRegNo: vendor.companyRegNo || ''
      });
    } catch (error: any) {
      console.error('Error fetching vendor details:', error);
      setError(error?.response?.data?.message || 'Failed to fetch vendor details');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultants = async () => {
    try {
      const response = await apiService.users.getConsultants();
      setConsultants(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching consultants:', error);
      // Don't set error state for this as it's not critical
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<VendorFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof VendorFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Separate the assignedConsultant from other form data
      const { assignedConsultant, ...vendorData } = formData;

      // Update vendor basic information
      await apiService.users.update(id!, vendorData);
      
      // Handle consultant assignment separately if changed
      if (assignedConsultant) {
        await apiService.users.assignConsultant(id!, assignedConsultant);
      }
      
      setSuccess('Vendor updated successfully!');
      
      // Redirect to vendor details page after a short delay
      setTimeout(() => {
        navigate(`/admin/vendors/${id}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error updating vendor:', error);
      setError(error?.response?.data?.message || 'Failed to update vendor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <CircularProgress />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="outlined"
              startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
              onClick={() => navigate(`/admin/vendors/${id}`)}
              className="shrink-0"
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Edit Vendor
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                Update vendor information and settings
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" className="mb-4" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card className="mb-6">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        error={!!errors.name}
                        helperText={errors.name}
                        required
                        InputProps={{
                          startAdornment: (
                            <FontAwesomeIcon icon={faUser} className="text-neutral-500 mr-2" />
                          ),
                        }}
                      />
                    </div>

                    <div>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        error={!!errors.email}
                        helperText={errors.email}
                        required
                        InputProps={{
                          startAdornment: (
                            <FontAwesomeIcon icon={faEnvelope} className="text-neutral-500 mr-2" />
                          ),
                        }}
                      />
                    </div>

                    <div>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={formData.phone}
                        onChange={handleInputChange('phone')}
                        InputProps={{
                          startAdornment: (
                            <FontAwesomeIcon icon={faPhone} className="text-neutral-500 mr-2" />
                          ),
                        }}
                      />
                    </div>

                    <div>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={formData.status}
                          onChange={handleInputChange('status')}
                          label="Status"
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                          <MenuItem value="pending">Pending</MenuItem>
                        </Select>
                      </FormControl>
                    </div>

                    <div>
                      <TextField
                        fullWidth
                        label="Industry"
                        value={formData.industry}
                        onChange={handleInputChange('industry')}
                        InputProps={{
                          startAdornment: (
                            <FontAwesomeIcon icon={faBuilding} className="text-neutral-500 mr-2" />
                          ),
                        }}
                      />
                    </div>

                    <div>
                      <TextField
                        fullWidth
                        label="Location"
                        value={formData.location}
                        onChange={handleInputChange('location')}
                        InputProps={{
                          startAdornment: (
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-neutral-500 mr-2" />
                          ),
                        }}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormControl fullWidth>
                        <InputLabel>Assigned Consultant</InputLabel>
                        <Select
                          value={formData.assignedConsultant}
                          onChange={handleInputChange('assignedConsultant')}
                          label="Assigned Consultant"
                        >
                          <MenuItem value="">
                            <em>No consultant assigned</em>
                          </MenuItem>
                          {consultants.map((consultant) => (
                            <MenuItem key={consultant._id} value={consultant._id}>
                              {consultant.name} ({consultant.email})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Company Information */}
              <Card className="mb-6">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    Company Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <TextField
                        fullWidth
                        label="Company Name"
                        value={formData.companyName}
                        onChange={handleInputChange('companyName')}
                        InputProps={{
                          startAdornment: (
                            <FontAwesomeIcon icon={faBuilding} className="text-neutral-500 mr-2" />
                          ),
                        }}
                      />
                    </div>

                    <div>
                      <TextField
                        fullWidth
                        label="Contact Person"
                        value={formData.contactPerson}
                        onChange={handleInputChange('contactPerson')}
                        InputProps={{
                          startAdornment: (
                            <FontAwesomeIcon icon={faUser} className="text-neutral-500 mr-2" />
                          ),
                        }}
                      />
                    </div>

                    <div>
                      <TextField
                        fullWidth
                        label="Registration Number"
                        value={formData.registrationNumber}
                        onChange={handleInputChange('registrationNumber')}
                        InputProps={{
                          startAdornment: (
                            <FontAwesomeIcon icon={faIdCard} className="text-neutral-500 mr-2" />
                          ),
                        }}
                      />
                    </div>

                    <div>
                      <TextField
                        fullWidth
                        label="Tax ID"
                        value={formData.taxId}
                        onChange={handleInputChange('taxId')}
                        InputProps={{
                          startAdornment: (
                            <FontAwesomeIcon icon={faIdCard} className="text-neutral-500 mr-2" />
                          ),
                        }}
                      />
                    </div>

                    <div>
                      <TextField
                        fullWidth
                        label="Website"
                        value={formData.website}
                        onChange={handleInputChange('website')}
                        InputProps={{
                          startAdornment: (
                            <FontAwesomeIcon icon={faGlobe} className="text-neutral-500 mr-2" />
                          ),
                        }}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <TextField
                        fullWidth
                        label="Address"
                        multiline
                        rows={3}
                        value={formData.address}
                        onChange={handleInputChange('address')}
                        InputProps={{
                          startAdornment: (
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-neutral-500 mr-2 mt-2" />
                          ),
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Agreement Management */}
              <Card className="mb-6">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    <FontAwesomeIcon icon={faFileContract} className="mr-2 text-primary-600" />
                    Agreement Management
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FormControl fullWidth>
                        <InputLabel>Agreement Period</InputLabel>
                        <Select
                          value={formData.agreementPeriod}
                          onChange={handleInputChange('agreementPeriod')}
                          label="Agreement Period"
                        >
                          <MenuItem value="Annual Contract">Annual Contract</MenuItem>
                          <MenuItem value="Bi-Annual Contract">Bi-Annual Contract</MenuItem>
                          <MenuItem value="Quarterly Contract">Quarterly Contract</MenuItem>
                          <MenuItem value="Monthly Contract">Monthly Contract</MenuItem>
                          <MenuItem value="Project Based">Project Based</MenuItem>
                          <MenuItem value="Long Term Contract">Long Term Contract (2+ Years)</MenuItem>
                          <MenuItem value="Short Term Contract">Short Term Contract (&lt; 1 Year)</MenuItem>
                        </Select>
                      </FormControl>
                    </div>

                    <div>
                      <TextField
                        fullWidth
                        label="Work Location"
                        value={formData.workLocation}
                        onChange={handleInputChange('workLocation')}
                        placeholder="e.g., Bangalore, Mumbai, Remote"
                        InputProps={{
                          startAdornment: (
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-neutral-500 mr-2" />
                          ),
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-600 mr-2 mt-1" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Agreement Period Information
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          The agreement period determines the contract duration and renewal schedule for this vendor. 
                          This setting affects compliance tracking and renewal notifications.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Actions */}
            <div>
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    Actions
                  </h3>
                  
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={20} /> : <FontAwesomeIcon icon={faSave} />}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate(`/admin/vendors/${id}`)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    <p className="mb-2">
                      <strong>Note:</strong> Changes will be saved immediately and the vendor will be notified if their status changes.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default VendorEditPage;
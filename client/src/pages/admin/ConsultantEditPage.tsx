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
  faMapMarkerAlt,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import apiService from '../../utils/api';

// Mock data for development fallback
const mockConsultants = [
  { 
    _id: '1',
    id: '1', 
    name: 'John Smith', 
    email: 'john.smith@example.com', 
    phone: '+91 9876543210', 
    department: 'Engineering',
    documentsReviewed: 45,
    lastActivity: '2023-06-15',
    avatar: undefined,
    role: 'Senior Consultant',
    status: 'active',
    address: '123 Main St, City, State 12345',
    website: 'https://johnsmith.com',
    taxId: 'TAX123456',
    registrationNumber: 'REG789012'
  },
  { 
    _id: '2',
    id: '2', 
    name: 'Sarah Johnson', 
    email: 'sarah.johnson@example.com', 
    phone: '+91 8765432109', 
    department: 'Quality Control',
    documentsReviewed: 32,
    lastActivity: '2023-06-14',
    avatar: undefined,
    role: 'Quality Analyst',
    status: 'active',
    address: '456 Oak Ave, City, State 67890',
    website: 'https://sarahjohnson.com',
    taxId: 'TAX654321',
    registrationNumber: 'REG210987'
  },
  { 
    _id: '3',
    id: '3', 
    name: 'Michael Brown', 
    email: 'michael.brown@example.com', 
    phone: '+91 7654321098', 
    department: 'Finance',
    documentsReviewed: 18,
    lastActivity: '2023-06-12',
    avatar: undefined,
    role: 'Financial Advisor',
    status: 'inactive',
    address: '789 Pine St, City, State 54321',
    website: '',
    taxId: 'TAX987654',
    registrationNumber: 'REG543210'
  }
];

interface ConsultantFormData {
  name: string;
  email: string;
  phone: string;
  status: string;
  address: string;
  website: string;
}

const ConsultantEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ConsultantFormData>({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    address: '',
    website: ''
  });

  const [errors, setErrors] = useState<Partial<ConsultantFormData>>({});



  useEffect(() => {
    if (id) {
      fetchConsultantDetails();
    }
  }, [id]);

  const fetchConsultantDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching consultant for edit with ID:', id);
      const response = await apiService.users.getById(id!);
      const consultant = response.data.data;
      
      setFormData({
        name: consultant.name || '',
        email: consultant.email || '',
        phone: consultant.phone || '',
        status: consultant.status || 'active',
        address: consultant.address || '',
        website: consultant.website || ''
      });
    } catch (error: any) {
      console.error('Error fetching consultant details:', error);
      
      // Try to find in mock data as fallback
      const mockConsultant = mockConsultants.find(c => c.id === id || c._id === id);
      if (mockConsultant) {
        console.log('Using mock consultant data for edit:', mockConsultant);
        setFormData({
          name: mockConsultant.name || '',
          email: mockConsultant.email || '',
          phone: mockConsultant.phone || '',
          status: mockConsultant.status || 'active',
          address: mockConsultant.address || '',
          website: mockConsultant.website || ''
        });
      } else {
        setError(error?.response?.data?.message || 'Failed to fetch consultant details');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ConsultantFormData> = {};

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

  const handleInputChange = (field: keyof ConsultantFormData) => (
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

      await apiService.users.update(id!, formData);
      
      setSuccess('Consultant updated successfully!');
      
      // Redirect to consultant details page after a short delay
      setTimeout(() => {
        navigate(`/admin/consultants/${id}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error updating consultant:', error);
      setError(error?.response?.data?.message || 'Failed to update consultant');
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
              onClick={() => navigate(`/admin/consultants/${id}`)}
              className="shrink-0"
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Edit Consultant
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                Update consultant information and settings
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
                      <FormControl fullWidth error={!!errors.status}>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={formData.status}
                          label="Status"
                          onChange={handleInputChange('status')}
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
                      onClick={() => navigate(`/admin/consultants/${id}`)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    <p className="mb-2">
                      <strong>Note:</strong> Changes will be saved immediately and the consultant will be notified if their status changes.
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

export default ConsultantEditPage;
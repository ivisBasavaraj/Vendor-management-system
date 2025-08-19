import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  TextField,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Switch,
  FormControlLabel,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Stack,
  Tooltip,
  Alert,
  Chip,
  GridLegacy as Grid,
  Badge,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  FormGroup,

  Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import apiService from '../../utils/api';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faSave, 
  faKey,
  faUserCog,
  faEnvelope,
  faLock,
  faEdit,
  faCog,
  faShieldAlt,
  faBell,
  faDatabase,
  faClock,
  faRefresh,
  faCheck,
  faExclamationTriangle,
  faUsers,
  faServer,
  faUserShield,
  faChevronDown,
  faEye,
  faEyeSlash,
  faCloudUpload,
  faFileAlt,
  faCalendarAlt,
  faGlobe,
  faLanguage,
  faPalette,
  faDownload,
  faTrash,
  faPlus,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Mock data for users
const mockVendors = [
  { id: '1', name: 'ABC Supplies', email: 'contact@abcsupplies.com', lastLogin: '2023-06-15 14:30:22' },
  { id: '2', name: 'XYZ Manufacturing', email: 'info@xyzmanufacturing.com', lastLogin: '2023-06-14 10:15:45' },
  { id: '3', name: 'Global Logistics', email: 'support@globallogistics.com', lastLogin: '2023-06-12 09:20:18' },
  { id: '4', name: 'Tech Solutions', email: 'help@techsolutions.com', lastLogin: '2023-06-10 16:40:33' },
  { id: '5', name: 'Industrial Parts', email: 'sales@industrialparts.com', lastLogin: '2023-06-08 11:25:50' },
];

const mockConsultants = [
  { id: '1', name: 'John Smith', email: 'john.smith@example.com', lastLogin: '2023-06-15 15:45:10' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@example.com', lastLogin: '2023-06-14 12:30:22' },
  { id: '3', name: 'Michael Brown', email: 'michael.brown@example.com', lastLogin: '2023-06-13 09:15:40' },
  { id: '4', name: 'Emily Davis', email: 'emily.davis@example.com', lastLogin: '2023-06-11 14:20:55' },
  { id: '5', name: 'Robert Wilson', email: 'robert.wilson@example.com', lastLogin: '2023-06-09 10:35:18' },
];

// Styled Components
const StatsCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '16px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
  },
}));

const SettingsCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '20px',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
  },
}));

const ModernTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    height: '3px',
    borderRadius: '3px',
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    minHeight: '64px',
    '&.Mui-selected': {
      color: '#667eea',
    },
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  padding: '12px 24px',
  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
  '&:hover': {
    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
  },
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '12px !important',
  marginBottom: '16px',
  '&:before': {
    display: 'none',
  },
  '&.Mui-expanded': {
    margin: '0 0 16px 0',
  },
}));

const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [userType, setUserType] = useState('vendor');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  
  // Reset password form state
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  
  // System settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [documentExpiryDays, setDocumentExpiryDays] = useState('30');
  const [autoArchiveDays, setAutoArchiveDays] = useState('90');
  const [maxFileSize, setMaxFileSize] = useState(10);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowedFileTypes, setAllowedFileTypes] = useState(['pdf', 'doc', 'docx', 'jpg', 'png']);
  const [systemLanguage, setSystemLanguage] = useState('en');
  const [timeZone, setTimeZone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [theme, setTheme] = useState('light');
  
  // Admin settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUserTypeChange = (event: SelectChangeEvent) => {
    setUserType(event.target.value);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleFileTypeToggle = (fileType: string) => {
    setAllowedFileTypes(prev => 
      prev.includes(fileType) 
        ? prev.filter(type => type !== fileType)
        : [...prev, fileType]
    );
  };
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        if (userType === 'vendor') {
          const response = await axios.get('/api/users/vendors');
          setVendors(response.data.data || []);
        } else {
          const response = await axios.get('/api/users/consultants');
          setConsultants(response.data.data || []);
        }
        setLoading(false);
      } catch (error: any) {
        console.error(`Error fetching ${userType}s:`, error);
        setLoading(false);
        // If API fails, fall back to mock data for development
        if (process.env.NODE_ENV === 'development') {
          if (userType === 'vendor') {
            setVendors(mockVendors);
          } else {
            setConsultants(mockConsultants);
          }
        }
      }
    };

    fetchUsers();
  }, [userType]);

  const handleResetPassword = (user: any) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPasswordConfirm = async () => {
    if (!selectedUser) return;
    
    // Validate passwords
    if (!resetNewPassword || !resetConfirmPassword) {
      showSnackbar('Please fill in both password fields', 'error');
      return;
    }
    
    if (resetNewPassword !== resetConfirmPassword) {
      showSnackbar('Passwords do not match', 'error');
      return;
    }
    
    if (resetNewPassword.length < 8) {
      showSnackbar('Password must be at least 8 characters long', 'error');
      return;
    }
    
    try {
      setResetLoading(true);
      
      // Call the admin password reset API with custom password
      const response = await apiService.users.resetPassword(selectedUser._id || selectedUser.id, {
        newPassword: resetNewPassword,
        confirmPassword: resetConfirmPassword
      });
      
      if (response.data.success) {
        showSnackbar(`Password updated successfully for ${selectedUser.name}!`, 'success');
        
        // Refresh the user list to update last login info if needed
        const fetchUsers = async () => {
          try {
            if (userType === 'vendor') {
              const response = await axios.get('/api/users/vendors');
              setVendors(response.data.data || []);
            } else {
              const response = await axios.get('/api/users/consultants');
              setConsultants(response.data.data || []);
            }
          } catch (error: any) {
            console.error(`Error refreshing ${userType}s:`, error);
          }
        };
        
        await fetchUsers();
      } else {
        showSnackbar(`Failed to reset password: ${response.data.message}`, 'error');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
      showSnackbar(`Error: ${errorMessage}`, 'error');
    } finally {
      setResetLoading(false);
      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
      setResetNewPassword('');
      setResetConfirmPassword('');
      setShowResetPassword(false);
      setShowResetConfirmPassword(false);
    }
  };

  const handleResetPasswordCancel = () => {
    setResetPasswordDialogOpen(false);
    setSelectedUser(null);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
  };

  const handleTestLogin = async (user: any) => {
    try {
      const response = await axios.post(`/api/users/${user._id || user.id}/test-login`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        showSnackbar(`Login timestamp updated for ${user.name}!`, 'success');
        
        // Refresh the user list
        const fetchUsers = async () => {
          try {
            if (userType === 'vendor') {
              const response = await axios.get('/api/users/vendors');
              setVendors(response.data.data || []);
            } else {
              const response = await axios.get('/api/users/consultants');
              setConsultants(response.data.data || []);
            }
          } catch (error: any) {
            console.error(`Error refreshing ${userType}s:`, error);
          }
        };
        
        await fetchUsers();
      } else {
        showSnackbar(`Failed to update login timestamp: ${response.data.message}`, 'error');
      }
    } catch (error: any) {
      console.error('Test login error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update login timestamp';
      showSnackbar(`Error: ${errorMessage}`, 'error');
    }
  };

  const handleSaveSystemSettings = async () => {
    try {
      // In a real app, this would save the settings to the server
      console.log('Saving system settings');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSnackbar('System settings saved successfully!', 'success');
    } catch (error) {
      showSnackbar('Failed to save system settings', 'error');
    }
  };

  const handleSaveAdminPassword = async () => {
    try {
      if (newPassword !== confirmPassword) {
        showSnackbar('Passwords do not match', 'error');
        return;
      }
      
      if (newPassword.length < 8) {
        showSnackbar('Password must be at least 8 characters long', 'error');
        return;
      }
      
      // In a real app, this would update the admin password
      console.log('Updating admin password');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSnackbar('Password updated successfully!', 'success');
    } catch (error) {
      showSnackbar('Failed to update password', 'error');
    }
  };

  const handleExportSettings = () => {
    const settings = {
      emailNotifications,
      smsNotifications,
      pushNotifications,
      documentExpiryDays,
      autoArchiveDays,
      maxFileSize,
      sessionTimeout,
      allowedFileTypes,
      systemLanguage,
      timeZone,
      dateFormat,
      theme,
      maintenanceMode
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `system-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showSnackbar('Settings exported successfully!', 'success');
  };

  return (
    <MainLayout>
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        p: 3 
      }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                System Settings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Configure and manage your system preferences and security settings
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Tooltip title="Export Settings">
                <IconButton 
                  onClick={handleExportSettings}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': { bgcolor: 'white' }
                  }}
                >
                  <FontAwesomeIcon icon={faDownload} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh Settings">
                <IconButton 
                  onClick={() => window.location.reload()}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': { bgcolor: 'white' }
                  }}
                >
                  <FontAwesomeIcon icon={faRefresh} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Box>

        {/* Settings Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#374151', mb: 1 }}>
                      {vendors.length + consultants.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      color: '#667eea',
                      width: 56,
                      height: 56,
                    }}
                  >
                    <FontAwesomeIcon icon={faUsers} size="lg" />
                  </Avatar>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#374151', mb: 1 }}>
                      {emailNotifications ? 'ON' : 'OFF'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Notifications
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      width: 56,
                      height: 56,
                    }}
                  >
                    <FontAwesomeIcon icon={faBell} size="lg" />
                  </Avatar>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#374151', mb: 1 }}>
                      {maxFileSize}MB
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Max File Size
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      width: 56,
                      height: 56,
                    }}
                  >
                    <FontAwesomeIcon icon={faFileAlt} size="lg" />
                  </Avatar>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#374151', mb: 1 }}>
                      {sessionTimeout}min
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Session Timeout
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(245, 158, 11, 0.1)',
                      color: '#f59e0b',
                      width: 56,
                      height: 56,
                    }}
                  >
                    <FontAwesomeIcon icon={faCalendarAlt} size="lg" />
                  </Avatar>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
        </Grid>

        {/* Main Settings Panel */}
        <SettingsCard>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <ModernTabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
              <Tab 
                label="User Management" 
                icon={<FontAwesomeIcon icon={faUsers} />}
                iconPosition="start"
              />
              <Tab 
                label="System Settings" 
                icon={<FontAwesomeIcon icon={faCog} />}
                iconPosition="start"
              />
              <Tab 
                label="Admin Account" 
                icon={<FontAwesomeIcon icon={faUserShield} />}
                iconPosition="start"
              />
            </ModernTabs>
          </Box>
          
          {/* User Management Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#374151', mb: 3 }}>
                User Management
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="user-type-label">User Type</InputLabel>
                    <Select
                      labelId="user-type-label"
                      value={userType}
                      label="User Type"
                      onChange={handleUserTypeChange}
                      sx={{
                        borderRadius: '12px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea',
                        },
                      }}
                    >
                      <MenuItem value="vendor">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FontAwesomeIcon icon={faUsers} />
                          Vendors
                        </Box>
                      </MenuItem>
                      <MenuItem value="consultant">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FontAwesomeIcon icon={faUserCog} />
                          Consultants
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      startIcon={<FontAwesomeIcon icon={faRefresh} />}
                      onClick={() => window.location.reload()}
                      sx={{
                        borderRadius: '12px',
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': {
                          borderColor: '#5a67d8',
                          bgcolor: 'rgba(102, 126, 234, 0.04)',
                        }
                      }}
                    >
                      Refresh
                    </Button>
                    <GradientButton
                      startIcon={<FontAwesomeIcon icon={faPlus} />}
                      onClick={() => console.log('Add user')}
                    >
                      Add {userType === 'vendor' ? 'Vendor' : 'Consultant'}
                    </GradientButton>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                    <CircularProgress size={60} />
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {(userType === 'vendor' ? vendors : consultants).map((user) => (
                      <Grid item xs={12} key={user.id}>
                        <Card sx={{ 
                          borderRadius: '12px',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          '&:hover': {
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.3s ease'
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar
                                  sx={{
                                    bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    width: 48,
                                    height: 48,
                                  }}
                                >
                                  {user.name.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                                    {user.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {user.email}
                                  </Typography>
                                  <Chip
                                    label={`Last login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}`}
                                    size="small"
                                    sx={{
                                      bgcolor: user.lastLogin ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                      color: user.lastLogin ? '#10b981' : '#ef4444',
                                      fontWeight: 500
                                    }}
                                  />
                                </Box>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="View Details">
                                  <IconButton
                                    sx={{
                                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                                      color: '#667eea',
                                      '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' }
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faEye} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reset Password">
                                  <IconButton
                                    onClick={() => handleResetPassword(user)}
                                    sx={{
                                      bgcolor: 'rgba(245, 158, 11, 0.1)',
                                      color: '#f59e0b',
                                      '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.2)' }
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faKey} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Test Login Update">
                                  <IconButton
                                    onClick={() => handleTestLogin(user)}
                                    sx={{
                                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                                      color: '#3b82f6',
                                      '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' }
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faClock} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit User">
                                  <IconButton
                                    sx={{
                                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                                      color: '#10b981',
                                      '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' }
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                    {(userType === 'vendor' ? vendors : consultants).length === 0 && (
                      <Grid item xs={12}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          py: 6,
                          bgcolor: 'rgba(255, 255, 255, 0.5)',
                          borderRadius: '12px',
                          border: '2px dashed rgba(0, 0, 0, 0.1)'
                        }}>
                          <Avatar
                            sx={{
                              bgcolor: 'rgba(156, 163, 175, 0.1)',
                              color: '#9ca3af',
                              width: 64,
                              height: 64,
                              mx: 'auto',
                              mb: 2
                            }}
                          >
                            <FontAwesomeIcon icon={faUsers} size="lg" />
                          </Avatar>
                          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                            No {userType}s found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Try refreshing the page or check your connection
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                )}
              </Box>
            </Box>
          </TabPanel>
          
          {/* System Settings Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#374151', mb: 3 }}>
                System Configuration
              </Typography>

              {/* Notifications Section */}
              <StyledAccordion defaultExpanded>
                <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: 32, height: 32 }}>
                      <FontAwesomeIcon icon={faBell} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Notification Settings
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={emailNotifications} 
                            onChange={(e) => setEmailNotifications(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Email Notifications"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={smsNotifications} 
                            onChange={(e) => setSmsNotifications(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="SMS Notifications"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={pushNotifications} 
                            onChange={(e) => setPushNotifications(e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Push Notifications"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </StyledAccordion>

              {/* Document Management Section */}
              <StyledAccordion>
                <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)', color: '#667eea', width: 32, height: 32 }}>
                      <FontAwesomeIcon icon={faFileAlt} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Document Management
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Document Expiry Warning (Days)"
                        fullWidth
                        value={documentExpiryDays}
                        onChange={(e) => setDocumentExpiryDays(e.target.value)}
                        type="number"
                        InputProps={{ inputProps: { min: 1, max: 90 } }}
                        helperText="Number of days before expiry to send notifications"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Auto-Archive Documents (Days)"
                        fullWidth
                        value={autoArchiveDays}
                        onChange={(e) => setAutoArchiveDays(e.target.value)}
                        type="number"
                        InputProps={{ inputProps: { min: 30, max: 365 } }}
                        helperText="Number of days after which documents are archived"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>Max File Size (MB): {maxFileSize}</Typography>
                      <Slider
                        value={maxFileSize}
                        onChange={(e, value) => setMaxFileSize(value as number)}
                        min={1}
                        max={100}
                        marks={[
                          { value: 1, label: '1MB' },
                          { value: 25, label: '25MB' },
                          { value: 50, label: '50MB' },
                          { value: 100, label: '100MB' }
                        ]}
                        valueLabelDisplay="auto"
                        sx={{
                          '& .MuiSlider-thumb': {
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          },
                          '& .MuiSlider-track': {
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>Allowed File Types</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {['pdf', 'doc', 'docx', 'jpg', 'png', 'xlsx', 'ppt', 'txt'].map((type) => (
                          <Chip
                            key={type}
                            label={type.toUpperCase()}
                            onClick={() => handleFileTypeToggle(type)}
                            color={allowedFileTypes.includes(type) ? 'primary' : 'default'}
                            variant={allowedFileTypes.includes(type) ? 'filled' : 'outlined'}
                            sx={{ textTransform: 'uppercase', fontWeight: 600 }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </StyledAccordion>

              {/* System Preferences Section */}
              <StyledAccordion>
                <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: 32, height: 32 }}>
                      <FontAwesomeIcon icon={faGlobe} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      System Preferences
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>System Language</InputLabel>
                        <Select
                          value={systemLanguage}
                          label="System Language"
                          onChange={(e) => setSystemLanguage(e.target.value)}
                          sx={{ borderRadius: '12px' }}
                        >
                          <MenuItem value="en">English</MenuItem>
                          <MenuItem value="es">Spanish</MenuItem>
                          <MenuItem value="fr">French</MenuItem>
                          <MenuItem value="de">German</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Time Zone</InputLabel>
                        <Select
                          value={timeZone}
                          label="Time Zone"
                          onChange={(e) => setTimeZone(e.target.value)}
                          sx={{ borderRadius: '12px' }}
                        >
                          <MenuItem value="UTC">UTC</MenuItem>
                          <MenuItem value="EST">Eastern Time</MenuItem>
                          <MenuItem value="PST">Pacific Time</MenuItem>
                          <MenuItem value="CST">Central Time</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Date Format</InputLabel>
                        <Select
                          value={dateFormat}
                          label="Date Format"
                          onChange={(e) => setDateFormat(e.target.value)}
                          sx={{ borderRadius: '12px' }}
                        >
                          <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                          <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                          <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography gutterBottom>Session Timeout (minutes): {sessionTimeout}</Typography>
                      <Slider
                        value={sessionTimeout}
                        onChange={(e, value) => setSessionTimeout(value as number)}
                        min={5}
                        max={120}
                        marks={[
                          { value: 5, label: '5min' },
                          { value: 30, label: '30min' },
                          { value: 60, label: '1hr' },
                          { value: 120, label: '2hr' }
                        ]}
                        valueLabelDisplay="auto"
                        sx={{
                          '& .MuiSlider-thumb': {
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          },
                          '& .MuiSlider-track': {
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={maintenanceMode} 
                            onChange={(e) => setMaintenanceMode(e.target.checked)}
                            color="warning"
                          />
                        }
                        label="Maintenance Mode"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Enable to restrict system access for maintenance
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </StyledAccordion>

              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<FontAwesomeIcon icon={faRefresh} />}
                  onClick={() => window.location.reload()}
                  sx={{
                    borderRadius: '12px',
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5a67d8',
                      bgcolor: 'rgba(102, 126, 234, 0.04)',
                    }
                  }}
                >
                  Reset
                </Button>
                <GradientButton
                  startIcon={<FontAwesomeIcon icon={faSave} />}
                  onClick={handleSaveSystemSettings}
                >
                  Save Settings
                </GradientButton>
              </Box>
            </Box>
          </TabPanel>


          
          {/* Admin Account Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#374151', mb: 3 }}>
                Admin Account Management
              </Typography>

              {/* Admin Profile Section */}
              <StyledAccordion defaultExpanded>
                <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)', color: '#667eea', width: 32, height: 32 }}>
                      <FontAwesomeIcon icon={faUserShield} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Admin Profile Information
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Full Name"
                        fullWidth
                        defaultValue="System Administrator"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <FontAwesomeIcon icon={faUserCog} style={{ color: '#9CA3AF' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Email Address"
                        fullWidth
                        defaultValue="admin@vendormanagement.com"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <FontAwesomeIcon icon={faEnvelope} style={{ color: '#9CA3AF' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="info">
                        <Typography variant="body2">
                          Profile changes will require email verification before taking effect.
                        </Typography>
                      </Alert>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </StyledAccordion>

              {/* Password Change Section */}
              <StyledAccordion>
                <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: 32, height: 32 }}>
                      <FontAwesomeIcon icon={faLock} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Change Password
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Alert severity="warning" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                          Changing your password will log you out of all active sessions.
                        </Typography>
                      </Alert>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Current Password"
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <FontAwesomeIcon icon={faLock} style={{ color: '#9CA3AF' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={handleTogglePasswordVisibility}
                                edge="end"
                              >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="New Password"
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <FontAwesomeIcon icon={faLock} style={{ color: '#9CA3AF' }} />
                            </InputAdornment>
                          ),
                        }}
                        helperText="Password must be at least 8 characters long"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Confirm New Password"
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={newPassword !== confirmPassword && confirmPassword !== ''}
                        helperText={
                          newPassword !== confirmPassword && confirmPassword !== ''
                            ? 'Passwords do not match'
                            : 'Re-enter your new password'
                        }
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <FontAwesomeIcon icon={faLock} style={{ color: '#9CA3AF' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'rgba(102, 126, 234, 0.05)', borderRadius: '12px' }}>
                        <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#667eea' }} />
                        <Typography variant="body2" color="text.secondary">
                          Password strength: {newPassword.length >= 8 ? 'Strong' : newPassword.length >= 6 ? 'Medium' : 'Weak'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </StyledAccordion>

              {/* Session Management Section */}
              <StyledAccordion>
                <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: 32, height: 32 }}>
                      <FontAwesomeIcon icon={faServer} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Active Sessions
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Card sx={{ p: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: 32, height: 32 }}>
                              <FontAwesomeIcon icon={faCheck} />
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                Current Session
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Chrome on Windows • Started 2 hours ago
                              </Typography>
                            </Box>
                          </Box>
                          <Chip label="Active" color="success" size="small" />
                        </Box>
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<FontAwesomeIcon icon={faTrash} />}
                        sx={{
                          borderRadius: '12px',
                          textTransform: 'none',
                        }}
                      >
                        Terminate All Other Sessions
                      </Button>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </StyledAccordion>

              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<FontAwesomeIcon icon={faRefresh} />}
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  sx={{
                    borderRadius: '12px',
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5a67d8',
                      bgcolor: 'rgba(102, 126, 234, 0.04)',
                    }
                  }}
                >
                  Reset Form
                </Button>
                <GradientButton
                  startIcon={<FontAwesomeIcon icon={faSave} />}
                  onClick={handleSaveAdminPassword}
                  disabled={
                    !currentPassword || 
                    !newPassword || 
                    !confirmPassword || 
                    newPassword !== confirmPassword ||
                    newPassword.length < 8
                  }
                >
                  Update Password
                </GradientButton>
              </Box>
            </Box>
          </TabPanel>
        </SettingsCard>
      </Box>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onClose={handleResetPasswordCancel}
        aria-labelledby="reset-password-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="reset-password-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FontAwesomeIcon icon={faKey} className="text-primary-600" />
            Set New Password for {selectedUser?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Create a new permanent password for <strong>{selectedUser?.name}</strong> ({selectedUser?.email}).
            The user will be able to log in immediately with this new password.
          </DialogContentText>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              fullWidth
              label="New Password"
              type={showResetPassword ? 'text' : 'password'}
              value={resetNewPassword}
              onChange={(e) => setResetNewPassword(e.target.value)}
              required
              helperText="Password must be at least 8 characters long"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FontAwesomeIcon icon={faLock} className="text-neutral-500" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      edge="end"
                    >
                      <FontAwesomeIcon icon={showResetPassword ? faEyeSlash : faEye} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showResetConfirmPassword ? 'text' : 'password'}
              value={resetConfirmPassword}
              onChange={(e) => setResetConfirmPassword(e.target.value)}
              required
              error={resetConfirmPassword !== '' && resetNewPassword !== resetConfirmPassword}
              helperText={
                resetConfirmPassword !== '' && resetNewPassword !== resetConfirmPassword
                  ? 'Passwords do not match'
                  : 'Re-enter the password to confirm'
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FontAwesomeIcon icon={faLock} className="text-neutral-500" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                      edge="end"
                    >
                      <FontAwesomeIcon icon={showResetConfirmPassword ? faEyeSlash : faEye} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleResetPasswordCancel} 
            color="inherit"
            disabled={resetLoading}
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleResetPasswordConfirm} 
            color="primary" 
            variant="contained"
            disabled={
              resetLoading || 
              !resetNewPassword || 
              !resetConfirmPassword || 
              resetNewPassword !== resetConfirmPassword ||
              resetNewPassword.length < 8
            }
            startIcon={resetLoading ? <CircularProgress size={20} /> : <FontAwesomeIcon icon={faSave} />}
            sx={{ 
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              }
            }}
          >
            {resetLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
};

export default SettingsPage;
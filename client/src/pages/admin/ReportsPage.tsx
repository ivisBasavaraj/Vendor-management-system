import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab,
  Card,
  CardContent,
  GridLegacy as Grid,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
  Badge,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faSearch, 
  faFilter,
  faDownload,
  faChartBar,
  faFileAlt,
  faUsers,
  faCheckCircle,
  faExclamationTriangle,
  faRefresh,
  faFileExport,
  faArrowTrendUp,
  faCalendarAlt,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import apiService from '../../utils/api';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

// Mock data for vendor aging report
const mockAgingReport = [
  { 
    id: '1', 
    vendorName: 'ABC Supplies',
    vendorId: 'VND001',
    company: 'ABC Supplies Ltd.',
    email: 'contact@abcsupplies.com',
    assignedConsultant: 'John Smith',
    lastDocumentUploadDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    daysSinceLastUpload: 15,
    status: 'Compliant',
    lastDocumentType: 'Quality Certificate'
  },
  { 
    id: '2', 
    vendorName: 'XYZ Manufacturing',
    vendorId: 'VND002',
    company: 'XYZ Manufacturing Inc.',
    email: 'info@xyzmanufacturing.com',
    assignedConsultant: 'Sarah Johnson',
    lastDocumentUploadDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    daysSinceLastUpload: 45,
    status: 'Non-Compliant',
    lastDocumentType: 'Compliance Certificate'
  },
  { 
    id: '3', 
    vendorName: 'Global Logistics',
    vendorId: 'VND003',
    company: 'Global Logistics Corp.',
    email: 'admin@globallogistics.com',
    assignedConsultant: 'Michael Brown',
    lastDocumentUploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    daysSinceLastUpload: 7,
    status: 'Compliant',
    lastDocumentType: 'Quality Certificate'
  },
  { 
    id: '4', 
    vendorName: 'Tech Solutions',
    vendorId: 'VND004',
    company: 'Tech Solutions Ltd.',
    email: 'support@techsolutions.com',
    assignedConsultant: 'Emily Davis',
    lastDocumentUploadDate: null,
    daysSinceLastUpload: 'N/A',
    status: 'Non-Compliant',
    lastDocumentType: 'N/A'
  },
  { 
    id: '5', 
    vendorName: 'Industrial Parts',
    vendorId: 'VND005',
    company: 'Industrial Parts Co.',
    email: 'orders@industrialparts.com',
    assignedConsultant: 'Robert Wilson',
    lastDocumentUploadDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    daysSinceLastUpload: 60,
    status: 'Non-Compliant',
    lastDocumentType: 'Compliance Certificate'
  },
];

// Mock data for charts
const documentStatusData = [
  { name: 'Pending from Consultant', value: 25 },
  { name: 'Pending from Vendor', value: 18 },
  { name: 'Approved', value: 45 },
  { name: 'Rejected', value: 12 }
];

const monthlySubmissionsData = [
  { name: 'Jan', count: 12 },
  { name: 'Feb', count: 15 },
  { name: 'Mar', count: 18 },
  { name: 'Apr', count: 22 },
  { name: 'May', count: 25 },
  { name: 'Jun', count: 30 }
];

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

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

const ChartCard = styled(Card)(({ theme }) => ({
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

const ModernTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
}));

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [agingReport, setAgingReport] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [documentStatusData, setDocumentStatusData] = useState([] as any[]);
  const [monthlySubmissionsData, setMonthlySubmissionsData] = useState([] as any[]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        console.log('Token exists:', !!token);
        console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
        
        // Fetch vendor aging report data
        console.log('Fetching vendor aging report...');
        const agingResponse = await apiService.reports.getAgingReport();
        console.log('Aging report response:', agingResponse);
        console.log('Aging report response data:', agingResponse.data);
        
        if (agingResponse.data && agingResponse.data.success && agingResponse.data.data) {
          console.log('Setting aging report data:', agingResponse.data.data.vendors);
          setAgingReport(agingResponse.data.data.vendors || []);
        } else {
          console.log('No aging report data found, response:', agingResponse.data);
          console.log('Using mock data as fallback');
          setAgingReport(mockAgingReport);
        }
        
        // Fetch document status distribution data
        try {
          const statusResponse = await apiService.reports.getDocumentStatusDistribution();
          if (statusResponse.data.data) {
            setDocumentStatusData(statusResponse.data.data);
          } else {
            // Fallback to mock data if API doesn't return expected format
            setDocumentStatusData([
              { name: 'Pending from Consultant', value: 25 },
              { name: 'Pending from Vendor', value: 18 },
              { name: 'Approved', value: 45 },
              { name: 'Rejected', value: 12 }
            ]);
          }
        } catch (statusError) {
          console.log('Status distribution API not available, using mock data');
          setDocumentStatusData([
            { name: 'Pending from Consultant', value: 25 },
            { name: 'Pending from Vendor', value: 18 },
            { name: 'Approved', value: 45 },
            { name: 'Rejected', value: 12 }
          ]);
        }
        
        // Fetch monthly submissions data
        try {
          const monthlyResponse = await apiService.reports.getMonthlySubmissions();
          if (monthlyResponse.data.data) {
            setMonthlySubmissionsData(monthlyResponse.data.data);
          } else {
            // Fallback to mock data if API doesn't return expected format
            setMonthlySubmissionsData([
              { name: 'Jan', count: 12 },
              { name: 'Feb', count: 15 },
              { name: 'Mar', count: 18 },
              { name: 'Apr', count: 22 },
              { name: 'May', count: 25 },
              { name: 'Jun', count: 30 }
            ]);
          }
        } catch (monthlyError) {
          console.log('Monthly submissions API not available, using mock data');
          setMonthlySubmissionsData([
            { name: 'Jan', count: 12 },
            { name: 'Feb', count: 15 },
            { name: 'Mar', count: 18 },
            { name: 'Apr', count: 22 },
            { name: 'May', count: 25 },
            { name: 'Jun', count: 30 }
          ]);
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching reports:', error);
        
        // Check if it's an authentication error
        if (error?.response?.status === 401) {
          console.error('Authentication error - user may need to log in again');
        } else if (error?.response?.status === 403) {
          console.error('Authorization error - user may not have permission');
        } else {
          console.error('API error details:', error?.response?.data || error?.message);
        }
        
        setLoading(false);
        
        // Temporarily disable fallback to mock data to see actual errors
        console.log('API error occurred, not using mock data to debug the issue');
        // setAgingReport(mockAgingReport);
      }
    };

    fetchReports();
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExportVendorAgingReport = () => {
    // Prepare data for Excel export
    const exportData = filteredReport.map(report => ({
      'Vendor Name': report.vendorName || '',
      'Vendor ID': report.vendorId || '',
      'Company': report.company || '',
      'Email': report.email || '',
      'Assigned Consultant': report.assignedConsultant || '',
      'Last Document Upload Date': formatDate(report.lastDocumentUploadDate),
      'Days Since Last Upload': formatDaysSince(report.daysSinceLastUpload),
      'Status': report.status || '',
      'Last Document Type': report.lastDocumentType || ''
    }));

    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for better formatting
    const columnWidths = [
      { wch: 25 }, // Vendor Name
      { wch: 15 }, // Vendor ID
      { wch: 30 }, // Company
      { wch: 30 }, // Email
      { wch: 20 }, // Assigned Consultant
      { wch: 20 }, // Last Document Upload Date
      { wch: 20 }, // Days Since Last Upload
      { wch: 15 }, // Status
      { wch: 25 }  // Last Document Type
    ];
    worksheet['!cols'] = columnWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendor Aging Report');

    // Generate filename with current date
    const filename = `vendor-aging-report-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Write and download the Excel file
    XLSX.writeFile(workbook, filename);
  };

  const filteredReport = agingReport.filter(report => {
    // Search term filter
    const matchesSearch = 
      ((report.vendorName?.toLowerCase() || '').includes(searchTerm.toLowerCase())) ||
      ((report.vendorId?.toLowerCase() || '').includes(searchTerm.toLowerCase())) ||
      ((report.company?.toLowerCase() || '').includes(searchTerm.toLowerCase())) ||
      ((report.assignedConsultant?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    if (!status) return 'Unknown';
    
    switch (status) {
      case 'Compliant':
        return 'Compliant';
      case 'Non-Compliant':
        return 'Non-Compliant';
      case 'Error':
        return 'Error';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Compliant':
        return 'success';
      case 'Non-Compliant':
        return 'error';
      case 'Error':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDaysSince = (days: number | string) => {
    if (days === 'N/A' || days === 'Error') return days;
    if (typeof days === 'number') {
      return `${days} days`;
    }
    return 'N/A';
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
                MIS Reports
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive analytics and reporting dashboard
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Tooltip title="Refresh Data">
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
              <Button 
                variant="contained" 
                size="large"
                startIcon={<FontAwesomeIcon icon={faFileExport} />}
                onClick={handleExportVendorAgingReport}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                  }
                }}
              >
                Export Report
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Tabs Section */}
        <StatsCard sx={{ mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="report tabs"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  minHeight: 64,
                  '&.Mui-selected': {
                    color: '#667eea',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#667eea',
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              }}
            >
              <Tab 
                label="Vendor Aging Report" 
                icon={<FontAwesomeIcon icon={faUsers} />}
                iconPosition="start"
              />
              <Tab 
                label="Document Status" 
                icon={<FontAwesomeIcon icon={faChartBar} />}
                iconPosition="start"
              />
              <Tab 
                label="Monthly Submissions" 
                icon={<FontAwesomeIcon icon={faArrowTrendUp} />}
                iconPosition="start"
              />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            {/* Summary Cards */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
                <StatsCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                          {filteredReport.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Total Vendors
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
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
                <StatsCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#10B981', mb: 1 }}>
                          {filteredReport.filter(v => v.status === 'Compliant').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Compliant Vendors
                        </Typography>
                      </Box>
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(16, 185, 129, 0.1)',
                          color: '#10B981',
                          width: 56,
                          height: 56,
                        }}
                      >
                        <FontAwesomeIcon icon={faCheckCircle} size="lg" />
                      </Avatar>
                    </Box>
                  </CardContent>
                </StatsCard>
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
                <StatsCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#EF4444', mb: 1 }}>
                          {filteredReport.filter(v => v.status === 'Non-Compliant').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Non-Compliant Vendors
                        </Typography>
                      </Box>
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444',
                          width: 56,
                          height: 56,
                        }}
                      >
                        <FontAwesomeIcon icon={faExclamationTriangle} size="lg" />
                      </Avatar>
                    </Box>
                  </CardContent>
                </StatsCard>
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
                <StatsCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#F59E0B', mb: 1 }}>
                          {Math.round((filteredReport.filter(v => v.status === 'Compliant').length / filteredReport.length) * 100) || 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Compliance Rate
                        </Typography>
                      </Box>
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(245, 158, 11, 0.1)',
                          color: '#F59E0B',
                          width: 56,
                          height: 56,
                        }}
                      >
                        <FontAwesomeIcon icon={faArrowTrendUp} size="lg" />
                      </Avatar>
                    </Box>
                  </CardContent>
                </StatsCard>
              </Box>
            </Box>

            {/* Filters Section */}
            <StatsCard sx={{ mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#374151' }}>
                  Filter Vendor Reports
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ width: { xs: '100%', md: '48%' } }}>
                    <TextField
                      label="Search Vendors or Consultants"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={searchTerm}
                      onChange={handleSearch}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FontAwesomeIcon icon={faSearch} style={{ color: '#9CA3AF' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                          },
                        },
                      }}
                    />
                  </Box>
                  <Box sx={{ width: { xs: '100%', md: '32%' } }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        label="Status"
                        onChange={handleStatusFilterChange}
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
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="Compliant">Compliant</MenuItem>
                        <MenuItem value="Non-Compliant">Non-Compliant</MenuItem>
                        <MenuItem value="Error">Error</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ width: { xs: '100%', md: '15%' } }}>
                    <Button 
                      variant="outlined" 
                      fullWidth
                      size="small"
                      startIcon={<FontAwesomeIcon icon={faFilter} />}
                      sx={{
                        borderRadius: '12px',
                        borderColor: '#667eea',
                        color: '#667eea',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: '#5a67d8',
                          bgcolor: 'rgba(102, 126, 234, 0.04)',
                        }
                      }}
                    >
                      Filter
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </StatsCard>

            {/* Vendor Aging Report Table */}
            <StatsCard>
              <CardContent sx={{ p: 0 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                    <CircularProgress size={40} sx={{ color: '#667eea' }} />
                  </Box>
                ) : (
                  <>
                    <ModernTableContainer>
                      <Table sx={{ minWidth: 750 }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'rgba(102, 126, 234, 0.04)' }}>
                            <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Vendor Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Vendor ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Assigned Consultant</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Last Upload Date</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Days Since Upload</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredReport
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((report, index) => (
                              <TableRow
                                hover
                                key={report.id}
                                sx={{ 
                                  '&:hover': { 
                                    bgcolor: 'rgba(102, 126, 234, 0.02)',
                                    transform: 'scale(1.001)',
                                    transition: 'all 0.2s ease-in-out'
                                  },
                                  borderBottom: index === filteredReport.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.06)'
                                }}
                              >
                                <TableCell sx={{ py: 2.5 }}>
                                  <Box>
                                    <Typography variant="body2" fontWeight="600">
                                      {report.vendorName || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {report.company || 'N/A'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ py: 2.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {report.vendorId || 'N/A'}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 2.5 }}>
                                  <Typography variant="body2">
                                    {report.assignedConsultant || 'Unassigned'}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 2.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDate(report.lastDocumentUploadDate)}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 2.5 }}>
                                  <Chip 
                                    label={formatDaysSince(report.daysSinceLastUpload)} 
                                    color={
                                      typeof report.daysSinceLastUpload === 'number' && report.daysSinceLastUpload > 30 
                                        ? 'error' 
                                        : typeof report.daysSinceLastUpload === 'number' && report.daysSinceLastUpload > 14
                                        ? 'warning'
                                        : 'success'
                                    }
                                    size="small"
                                    sx={{ 
                                      fontWeight: 500,
                                      borderRadius: '8px',
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ py: 2.5 }}>
                                  <Chip 
                                    label={getStatusLabel(report.status)} 
                                    color={getStatusColor(report.status || 'unknown') as any}
                                    size="small"
                                    sx={{ 
                                      fontWeight: 500,
                                      borderRadius: '8px',
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ py: 2.5 }}>
                                  <Tooltip title="View Details">
                                    <IconButton size="small" sx={{ color: '#667eea' }}>
                                      <FontAwesomeIcon icon={faEye} />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          {filteredReport.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h6" color="text.secondary" gutterBottom>
                                    No Vendor Reports Found
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    There are no vendor aging reports matching your current filters.
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ModernTableContainer>
                    <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={filteredReport.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        sx={{
                          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                            fontWeight: 500,
                            color: '#6B7280',
                          },
                          '& .MuiTablePagination-select': {
                            borderRadius: '8px',
                          },
                        }}
                      />
                    </Box>
                  </>
                )}
              </CardContent>
            </StatsCard>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <ChartCard>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      color: '#667eea',
                      mr: 2,
                    }}
                  >
                    <FontAwesomeIcon icon={faChartBar} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#374151' }}>
                      Document Status Distribution
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overview of document processing status across the system
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ height: 450 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      {documentStatusData.length > 0 ? (
                        <Pie
                          data={documentStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={160}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {documentStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      ) : (
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#9CA3AF">
                          No data available
                        </text>
                      )}
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend 
                        wrapperStyle={{
                          paddingTop: '20px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </ChartCard>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <ChartCard>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(245, 158, 11, 0.1)',
                      color: '#F59E0B',
                      mr: 2,
                    }}
                  >
                    <FontAwesomeIcon icon={faArrowTrendUp} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#374151' }}>
                      Monthly Document Submissions (2023)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Track document submission trends throughout the year
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ height: 450 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlySubmissionsData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <defs>
                        <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6B7280"
                        fontSize={12}
                        fontWeight={500}
                      />
                      <YAxis 
                        stroke="#6B7280"
                        fontSize={12}
                        fontWeight={500}
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend />
                      {monthlySubmissionsData.length > 0 ? (
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#667eea" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorSubmissions)" 
                          name="Documents Submitted"
                        />
                      ) : (
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#9CA3AF">
                          No data available
                        </text>
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </ChartCard>
          </TabPanel>
        </StatsCard>
      </Box>
    </MainLayout>
  );
};

export default ReportsPage;
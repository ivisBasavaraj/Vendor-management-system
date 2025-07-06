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
  IconButton,
  Card,
  CardContent,
  GridLegacy as Grid,
  Avatar,
  Stack,
  Tooltip,
  Badge
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faSearch, 
  faFilter,
  faEye,
  faDownload,
  faCalendarAlt,
  faFileAlt,
  faUsers,
  faCheckCircle,
  faExclamationTriangle,
  faRefresh,
  faFileExport,
  faClock,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import axios from 'axios';
import apiService from '../../utils/api';
import { useNavigate } from 'react-router-dom';



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

const ModernTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
}));

// Transform submission data to vendor-centric month-wise view
const transformSubmissionData = (submissions: any[]) => {
  const vendorMap = new Map();
  
  submissions.forEach((submission: any) => {
    // Get vendor information
    const vendorName = submission.vendor?.name || submission.vendor?.company || 'Unknown Vendor';
    const vendorId = submission.vendor?._id || submission.vendor?.id || 'unknown';
    const consultantName = submission.consultant?.name || submission.consultant?.email || 'Unassigned';
    const month = submission.uploadPeriod?.month || 'N/A';
    const year = submission.uploadPeriod?.year || new Date().getFullYear();
    const monthYear = `${month} ${year}`;
    
    // Create vendor key
    const vendorKey = `${vendorId}_${vendorName}`;
    
    if (!vendorMap.has(vendorKey)) {
      vendorMap.set(vendorKey, {
        vendorId: vendorId,
        vendorName: vendorName,
        consultant: consultantName,
        submissions: new Map()
      });
    }
    
    const vendor = vendorMap.get(vendorKey);
    
    // Calculate submission status
    let overallStatus = submission.submissionStatus || 'draft';
    let totalDocuments = 0;
    let approvedDocuments = 0;
    let rejectedDocuments = 0;
    let pendingDocuments = 0;
    
    if (submission.documents && Array.isArray(submission.documents)) {
      totalDocuments = submission.documents.length;
      submission.documents.forEach((doc: any) => {
        switch (doc.status) {
          case 'approved':
          case 'fully_approved':
            approvedDocuments++;
            break;
          case 'rejected':
            rejectedDocuments++;
            break;
          default:
            pendingDocuments++;
        }
      });
      
      // Determine overall status based on document statuses
      if (rejectedDocuments > 0) {
        overallStatus = 'requires_resubmission';
      } else if (approvedDocuments === totalDocuments && totalDocuments > 0) {
        overallStatus = 'fully_approved';
      } else if (approvedDocuments > 0) {
        overallStatus = 'partially_approved';
      } else if (pendingDocuments > 0) {
        overallStatus = 'under_review';
      }
    }
    
    // Format dates
    const submittedDate = submission.submissionDate 
      ? new Date(submission.submissionDate).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      : (submission.createdAt 
          ? new Date(submission.createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })
          : 'N/A');
    
    const approvedDate = submission.consultantApproval?.approvalDate
      ? new Date(submission.consultantApproval.approvalDate).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      : 'N/A';
    
    // Add submission to vendor's submissions map
    vendor.submissions.set(monthYear, {
      id: submission._id,
      submissionId: submission._id,
      month: month,
      year: year,
      monthYear: monthYear,
      status: overallStatus,
      submittedDate: submittedDate,
      approvedDate: approvedDate,
      totalDocuments: totalDocuments,
      approvedDocuments: approvedDocuments,
      rejectedDocuments: rejectedDocuments,
      pendingDocuments: pendingDocuments,
      lastUpdated: submission.lastModifiedDate 
        ? new Date(submission.lastModifiedDate).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        : submittedDate,
      reviewNotes: submission.consultantApproval?.remarks || ''
    });
  });
  
  // Convert to array format for table display
  const transformedData: any[] = [];
  
  vendorMap.forEach((vendor) => {
    vendor.submissions.forEach((submission: any) => {
      transformedData.push({
        id: `${vendor.vendorId}_${submission.monthYear}`,
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
        consultant: vendor.consultant,
        month: submission.month,
        year: submission.year,
        monthYear: submission.monthYear,
        status: submission.status,
        submittedDate: submission.submittedDate,
        approvedDate: submission.approvedDate,
        totalDocuments: submission.totalDocuments,
        approvedDocuments: submission.approvedDocuments,
        rejectedDocuments: submission.rejectedDocuments,
        pendingDocuments: submission.pendingDocuments,
        lastUpdated: submission.lastUpdated,
        reviewNotes: submission.reviewNotes,
        submissionId: submission.submissionId
      });
    });
  });
  
  return transformedData.sort((a, b) => {
    // Sort by vendor name first, then by year and month
    if (a.vendorName !== b.vendorName) {
      return a.vendorName.localeCompare(b.vendorName);
    }
    if (a.year !== b.year) {
      return b.year - a.year; // Latest year first
    }
    // Sort months in chronological order
    const monthOrder = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
  });
};

// Helper function to get readable document type names
const getDocumentTypeName = (documentType: string) => {
  if (!documentType) return 'Unknown Document';
  
  const typeNames: { [key: string]: string } = {
    // Lowercase versions (frontend)
    'invoice': 'Invoice',
    'form_t_muster_roll': 'Form T Combined Muster Roll Cum Register of Wages',
    'bank_statement': 'Bank Statement',
    'ecr': 'Electronic Challan Cum Return (ECR)',
    'pf_combined_challan': 'Combined Challan of A/C NO. 01, 02, 10, 21 & 22 (EPFO)',
    'pf_trrn_details': 'Provident Fund TRRN Details',
    'esi_contribution_history': 'ESIC Contribution History Statement',
    'esi_challan': 'ESIC Challan',
    'professional_tax_returns': 'Professional Tax Returns – Form 5A',
    'labour_welfare_fund': 'Labour Welfare Fund Form-D_Statement',
    'labour_welfare_fund_december': 'Labour Welfare Fund Form-D_Statement',
    'vendor_agreement': 'Copy of Agreement (Vendors)',
    'epf_code_letter': 'EPF Code Allotment Letter',
    'epf_form_5a': 'EPF Form – 5A',
    'esic_registration': 'ESIC Registration Certificate – Form C11',
    'pt_registration': 'Professional Tax Registration Certificate – Form 3',
    'pt_enrollment': 'Professional Tax Enrollment Certificate – Form 4',
    'contract_labour_license': 'Contract Labour License',
    
    // Uppercase versions (backend)
    'INVOICE': 'Invoice',
    'FORM_T_MUSTER_ROLL': 'Form T Combined Muster Roll Cum Register of Wages',
    'BANK_STATEMENT': 'Bank Statement',
    'ECR': 'Electronic Challan Cum Return (ECR)',
    'PF_COMBINED_CHALLAN': 'Combined Challan of A/C NO. 01, 02, 10, 21 & 22 (EPFO)',
    'PF_TRRN_DETAILS': 'Provident Fund TRRN Details',
    'ESI_CONTRIBUTION_HISTORY': 'ESIC Contribution History Statement',
    'ESI_CHALLAN': 'ESIC Challan',
    'PROFESSIONAL_TAX_RETURNS': 'Professional Tax Returns – Form 5A',
    'LABOUR_WELFARE_FUND': 'Labour Welfare Fund Form-D_Statement',
    'LABOUR_WELFARE_FUND_DECEMBER': 'Labour Welfare Fund Form-D_Statement',
    'VENDOR_AGREEMENT': 'Copy of Agreement (Vendors)',
    'EPF_CODE_LETTER': 'EPF Code Allotment Letter',
    'EPF_FORM_5A': 'EPF Form – 5A',
    'ESIC_REGISTRATION': 'ESIC Registration Certificate – Form C11',
    'PT_REGISTRATION': 'Professional Tax Registration Certificate – Form 3',
    'PT_ENROLLMENT': 'Professional Tax Enrollment Certificate – Form 4',
    'CONTRACT_LABOUR_LICENSE': 'Contract Labour License'
  };
  
  return typeNames[documentType] || documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const StatusPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('2025');
  const [monthFilter, setMonthFilter] = useState('all');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        // Use the API service to fetch real document submission data
        const params = {
          year: yearFilter !== 'all' ? yearFilter : undefined,
          month: monthFilter !== 'all' ? monthFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        };
        
        console.log('Fetching submissions with params:', params);
        // Add limit parameter to get more data
        const apiParams = { ...params, limit: 100 };
        const response = await apiService.documents.getAllSubmissions(apiParams);
        console.log('API Response:', response.data);
        
        if (response.data.success && response.data.data) {
          console.log('Raw submission data:', response.data.data);
          // Transform the submission data to match the expected format
          const transformedData = transformSubmissionData(response.data.data);
          console.log('Transformed data:', transformedData);
          setDocuments(transformedData);
        } else {
          console.warn('No data received from API, response:', response.data);
          setDocuments([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching document status:', error);
        setLoading(false);
        // Don't use mock data, show empty state
        console.log('API error, showing empty state');
        setDocuments([]);
      }
    };

    fetchDocuments();
  }, [yearFilter, monthFilter, statusFilter]);

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

  const handleYearFilterChange = (event: SelectChangeEvent) => {
    setYearFilter(event.target.value);
    setPage(0);
  };

  const handleMonthFilterChange = (event: SelectChangeEvent) => {
    setMonthFilter(event.target.value);
    setPage(0);
  };

  const filteredDocuments = documents.filter(doc => {
    // Search term filter - search by vendor name and consultant
    const matchesSearch = searchTerm === '' ||
      ((doc.vendorName?.toLowerCase() || '').includes(searchTerm.toLowerCase())) ||
      ((doc.consultant?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    // Year filter - use the year field directly from the transformed data
    const matchesYear = yearFilter === 'all' || doc.year?.toString() === yearFilter;
    
    // Month filter - use the month field directly from the transformed data
    const matchesMonth = monthFilter === 'all' || doc.month === monthFilter;
    
    return matchesSearch && matchesStatus && matchesYear && matchesMonth;
  });

  const getStatusLabel = (status: string) => {
    if (!status) return 'Unknown';
    
    switch (status) {
      // Frontend status values
      case 'pending_consultant':
        return 'Pending from Consultant';
      case 'pending_vendor':
        return 'Pending from Vendor';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      
      // Backend status values
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'under_review':
        return 'Under Review';
      case 'partially_approved':
        return 'Partially Approved';
      case 'fully_approved':
        return 'Fully Approved';
      case 'requires_resubmission':
        return 'Requires Resubmission';
      case 'uploaded':
        return 'Uploaded';
      case 'resubmitted':
        return 'Resubmitted';
      
      default:
        try {
          return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } catch (error) {
          return 'Unknown';
        }
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      // Frontend status values
      case 'pending_consultant':
        return 'warning';
      case 'pending_vendor':
        return 'info';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      
      // Backend status values
      case 'draft':
        return 'default';
      case 'submitted':
        return 'info';
      case 'under_review':
        return 'warning';
      case 'partially_approved':
        return 'primary';
      case 'fully_approved':
        return 'success';
      case 'requires_resubmission':
        return 'error';
      case 'uploaded':
        return 'info';
      case 'resubmitted':
        return 'warning';
      
      default:
        return 'default';
    }
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
                Document Status
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track and monitor document processing status across all vendors
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

        {/* Status Summary Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
            <StatsCard>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                      {filteredDocuments.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Total Submissions
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
                    <FontAwesomeIcon icon={faFileAlt} size="lg" />
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
                      {filteredDocuments.filter(d => d.status === 'fully_approved' || d.status === 'approved').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Approved Submissions
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
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#F59E0B', mb: 1 }}>
                      {filteredDocuments.filter(d => 
                        d.status === 'under_review' || 
                        d.status === 'submitted' || 
                        d.status === 'partially_approved' ||
                        d.status === 'pending_consultant' || 
                        d.status === 'pending_vendor'
                      ).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Pending Submissions
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
                    <FontAwesomeIcon icon={faClock} size="lg" />
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
                      {filteredDocuments.filter(d => d.status === 'rejected' || d.status === 'requires_resubmission').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Rejected Submissions
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
                    <FontAwesomeIcon icon={faTimesCircle} size="lg" />
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
              Filter Submissions
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Box sx={{ width: { xs: '100%', md: '24%' } }}>
                <TextField
                  label="Search Vendors"
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
              <Box sx={{ width: { xs: '100%', md: '18%' } }}>
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
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="submitted">Submitted</MenuItem>
                    <MenuItem value="under_review">Under Review</MenuItem>
                    <MenuItem value="partially_approved">Partially Approved</MenuItem>
                    <MenuItem value="fully_approved">Fully Approved</MenuItem>
                    <MenuItem value="requires_resubmission">Requires Resubmission</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ width: { xs: '48%', md: '15%' } }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={yearFilter}
                    label="Year"
                    onChange={handleYearFilterChange}
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
                    <MenuItem value="all">All Years</MenuItem>
                    <MenuItem value="2025">2025</MenuItem>
                    <MenuItem value="2024">2024</MenuItem>
                    <MenuItem value="2023">2023</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ width: { xs: '48%', md: '15%' } }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={monthFilter}
                    label="Month"
                    onChange={handleMonthFilterChange}
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
                    <MenuItem value="all">All Months</MenuItem>
                    <MenuItem value="Apr">April</MenuItem>
                    <MenuItem value="May">May</MenuItem>
                    <MenuItem value="Jun">June</MenuItem>
                    <MenuItem value="Jul">July</MenuItem>
                    <MenuItem value="Aug">August</MenuItem>
                    <MenuItem value="Sep">September</MenuItem>
                    <MenuItem value="Oct">October</MenuItem>
                    <MenuItem value="Nov">November</MenuItem>
                    <MenuItem value="Dec">December</MenuItem>
                    <MenuItem value="Jan">January</MenuItem>
                    <MenuItem value="Feb">February</MenuItem>
                    <MenuItem value="Mar">March</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ width: { xs: '100%', md: '12%' } }}>
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

        {/* Documents Table */}
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
                        <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Month & Year</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Documents Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Submission Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Submitted Date & Time</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Consultant</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Approved Date</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDocuments
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((doc, index) => (
                          <TableRow
                            hover
                            key={doc.id}
                            sx={{ 
                              '&:hover': { 
                                bgcolor: 'rgba(102, 126, 234, 0.02)',
                                transform: 'scale(1.001)',
                                transition: 'all 0.2s ease-in-out'
                              },
                              borderBottom: index === filteredDocuments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.06)'
                            }}
                          >
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {doc.vendorName || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {doc.monthYear || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                  Total: {doc.totalDocuments || 0}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {doc.approvedDocuments > 0 && (
                                    <Chip 
                                      label={`✓ ${doc.approvedDocuments}`} 
                                      size="small"
                                      color="success"
                                      sx={{ fontSize: '0.75rem', height: '20px' }}
                                    />
                                  )}
                                  {doc.rejectedDocuments > 0 && (
                                    <Chip 
                                      label={`✗ ${doc.rejectedDocuments}`} 
                                      size="small"
                                      color="error"
                                      sx={{ fontSize: '0.75rem', height: '20px' }}
                                    />
                                  )}
                                  {doc.pendingDocuments > 0 && (
                                    <Chip 
                                      label={`⏳ ${doc.pendingDocuments}`} 
                                      size="small"
                                      color="warning"
                                      sx={{ fontSize: '0.75rem', height: '20px' }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Chip 
                                label={getStatusLabel(doc.status)} 
                                color={getStatusColor(doc.status || 'unknown')}
                                size="small"
                                sx={{ 
                                  fontWeight: 500,
                                  borderRadius: '8px',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                {doc.submittedDate || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography variant="body2">
                                {doc.consultant || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                {doc.approvedDate || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2.5 }}>
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Tooltip title="View Submission Details">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => navigate(`/admin/submissions/${doc.submissionId}`)}
                                    sx={{ color: '#667eea' }}
                                  >
                                    <FontAwesomeIcon icon={faEye} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Download All Documents">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => navigate(`/admin/submissions/${doc.submissionId}/download`)}
                                    sx={{ color: '#10B981' }}
                                  >
                                    <FontAwesomeIcon icon={faDownload} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      {filteredDocuments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" color="text.secondary" gutterBottom>
                                No Submissions Found
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                There are no vendor submissions matching your current filters.
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
                    count={filteredDocuments.length}
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
      </Box>
    </MainLayout>
  );
};

export default StatusPage;
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
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Card,
  CardContent,
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
  faDownload,
  faCalendarAlt,
  faFileAlt,
  faUsers,
  faCloudDownload,
  faRefresh,
  faFileExport,
  faFilePdf,
  faFileWord,
  faFileExcel
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import axios from 'axios';
import apiService from '../../utils/api';

// Types
interface ComplianceReportAttachment {
  _id?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
}

interface ComplianceReport {
  _id: string;
  vendorId?: {
    company?: string;
    name?: string;
  };
  auditorName?: string;
  attachments?: ComplianceReportAttachment[];
  month: string;
  year: number;
  createdAt: string;
}

interface DownloadItem {
  id: string;
  vendorName?: string;
  consultantName?: string;
  documentType?: string;
  fileName?: string;
  submittedDate?: string;
  approvedDate?: string;
  fileSize?: string;
  fileType?: string;
  filePath?: string;
  reportType?: string;
  month?: string;
  year?: number;
  reportId?: string;
  attachmentId?: string;
  originalDocumentType?: string;
}

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

// Mock data for downloads
const mockDownloads = [
  { 
    id: '1', 
    vendorName: 'ABC Supplies', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-06-15',
    approvedDate: '2023-06-16',
    fileSize: '2.4 MB',
    fileType: 'PDF'
  },
  { 
    id: '2', 
    vendorName: 'XYZ Manufacturing', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-06-10',
    approvedDate: '2023-06-12',
    fileSize: '1.8 MB',
    fileType: 'PDF'
  },
  { 
    id: '3', 
    vendorName: 'Global Logistics', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-05-28',
    approvedDate: '2023-05-30',
    fileSize: '3.2 MB',
    fileType: 'PDF'
  },
  { 
    id: '4', 
    vendorName: 'Tech Solutions', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-05-15',
    approvedDate: '2023-05-17',
    fileSize: '1.5 MB',
    fileType: 'PDF'
  },
  { 
    id: '5', 
    vendorName: 'Industrial Parts', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-05-05',
    approvedDate: '2023-05-08',
    fileSize: '2.1 MB',
    fileType: 'PDF'
  },
  { 
    id: '6', 
    vendorName: 'ABC Supplies', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-04-20',
    approvedDate: '2023-04-22',
    fileSize: '1.9 MB',
    fileType: 'PDF'
  },
  { 
    id: '7', 
    vendorName: 'XYZ Manufacturing', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-04-10',
    approvedDate: '2023-04-12',
    fileSize: '2.7 MB',
    fileType: 'PDF'
  },
  { 
    id: '8', 
    vendorName: 'Global Logistics', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-03-25',
    approvedDate: '2023-03-28',
    fileSize: '2.3 MB',
    fileType: 'PDF'
  },
];

// Function to generate available years (from 2025 to 2035)
const generateAvailableYears = (dataYears: string[] = []): string[] => {
  const startYear = 2025; // Start from 2025
  const endYear = 2035; // End at 2035
  
  const allYears = new Set<string>();
  
  // Add years from data
  dataYears.forEach(year => allYears.add(year));
  
  // Add range of years from 2025 to 2035
  for (let year = startYear; year <= endYear; year++) {
    allYears.add(year.toString());
  }
  
  // Convert to sorted array (newest first)
  return Array.from(allYears).sort((a, b) => parseInt(b) - parseInt(a));
};

const DownloadsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // Initialize available years on component mount
  useEffect(() => {
    const initialYears = generateAvailableYears();
    setAvailableYears(initialYears);
  }, []);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        setLoading(true);
        
        // Fetch regular documents, compliance report attachments, and consultant-uploaded documents
        const [documentsResponse, complianceReportsResponse, consultantSubmissionsResponse] = await Promise.allSettled([
          // Regular documents
          axios.get('/api/documents', { 
            params: {
              status: 'approved',
              year: yearFilter !== 'all' ? yearFilter : undefined,
              month: monthFilter !== 'all' ? monthFilter : undefined
            }
          }),
          // Compliance reports with attachments - get all without pagination
          axios.get('/api/compliance-reports', {
            params: {
              year: yearFilter !== 'all' ? yearFilter : undefined,
              month: monthFilter !== 'all' ? monthFilter : undefined,
              limit: 1000 // Get a large number to include all reports
            }
          }),
          // Document submissions uploaded by consultants
          axios.get('/api/document-submissions/admin/all', {
            params: {
              year: yearFilter !== 'all' ? yearFilter : undefined,
              month: monthFilter !== 'all' ? monthFilter : undefined,
              uploadedByConsultant: true // Only get consultant-uploaded documents
            }
          })
        ]);

        let combinedDownloads: DownloadItem[] = [];

        // Debug API responses
        console.log('API Responses Status:', {
          documents: documentsResponse.status,
          complianceReports: complianceReportsResponse.status,
          consultantSubmissions: consultantSubmissionsResponse.status
        });

        if (documentsResponse.status === 'rejected') {
          console.error('Documents API failed:', documentsResponse.reason);
        }
        if (complianceReportsResponse.status === 'rejected') {
          console.error('Compliance Reports API failed:', complianceReportsResponse.reason);
        }
        if (consultantSubmissionsResponse.status === 'rejected') {
          console.error('Consultant Submissions API failed:', consultantSubmissionsResponse.reason);
        }

        // Process regular documents
        if (documentsResponse.status === 'fulfilled' && documentsResponse.value.data.data) {
          combinedDownloads = [...documentsResponse.value.data.data];
          console.log('Regular documents processed:', combinedDownloads.length);
        }

        // Process compliance report attachments
        if (complianceReportsResponse.status === 'fulfilled' && complianceReportsResponse.value.data.data) {
          const complianceReports: ComplianceReport[] = complianceReportsResponse.value.data.data;
          console.log('Compliance Reports fetched:', complianceReports.length);
          console.log('Compliance Reports:', complianceReports);
          
          complianceReports.forEach((report: ComplianceReport) => {
            console.log('Processing report:', report._id, 'Attachments:', report.attachments);
            if (report.attachments && report.attachments.length > 0) {
              report.attachments.forEach((attachment: ComplianceReportAttachment) => {
                console.log('Processing attachment:', attachment);
                combinedDownloads.push({
                  id: `compliance-${report._id}-${attachment._id || Date.now()}`,
                  vendorName: report.vendorId?.company || 'Unknown Vendor',
                  consultantName: report.auditorName || 'Unknown Consultant',
                  documentType: attachment.fileType || 'Compliance Attachment', // This should be "Completion Report" or "Document Verification Report"
                  fileName: attachment.fileName,
                  submittedDate: attachment.uploadDate || report.createdAt,
                  approvedDate: attachment.uploadDate || report.createdAt,
                  fileSize: formatFileSize(attachment.fileSize || 0),
                  fileType: getFileTypeFromPath(attachment.fileName || ''),
                  filePath: attachment.filePath,
                  reportType: 'Compliance Report',
                  month: report.month,
                  year: report.year,
                  reportId: report._id,
                  attachmentId: attachment._id
                });
              });
            }
          });
        }

        // Process consultant-uploaded document submissions
        if (consultantSubmissionsResponse.status === 'fulfilled' && consultantSubmissionsResponse.value.data.data) {
          const consultantSubmissions = consultantSubmissionsResponse.value.data.data;
          console.log('Consultant Submissions fetched:', consultantSubmissions.length);
          console.log('Consultant Submissions:', consultantSubmissions);
          
          consultantSubmissions.forEach((submission: any) => {
            console.log('Processing submission:', submission._id, 'Documents:', submission.documents);
            if (submission.documents && submission.documents.length > 0) {
              submission.documents.forEach((document: any) => {
                console.log('Processing document:', document);
                // Only include approved documents or all documents if needed
                if (document.status === 'approved' || document.status === 'uploaded' || document.status === 'under_review') {
                  combinedDownloads.push({
                    id: `consultant-${submission._id}-${document._id || Date.now()}`,
                    vendorName: submission.vendor?.name || submission.vendor?.company || 'Unknown Vendor',
                    consultantName: submission.consultant?.name || submission.uploadedBy?.name || 'Unknown Consultant',
                    documentType: document.documentName || document.documentType || 'Document',
                    fileName: document.fileName,
                    submittedDate: document.uploadDate || submission.submissionDate || submission.createdAt,
                    approvedDate: document.reviewDate || document.uploadDate || submission.submissionDate,
                    fileSize: formatFileSize(document.fileSize || 0),
                    fileType: getFileTypeFromPath(document.fileName || ''),
                    filePath: document.filePath,
                    reportType: 'Consultant Upload',
                    month: submission.uploadPeriod?.month || 'Unknown',
                    year: submission.uploadPeriod?.year || new Date().getFullYear(),
                    reportId: submission._id,
                    attachmentId: document._id,
                    originalDocumentType: document.documentType // Store the original document type for API calls
                  });
                }
              });
            }
          });
        }

        setDownloads(combinedDownloads);
        
        // Extract unique years from the downloads data
        const dataYears: string[] = [];
        combinedDownloads.forEach(download => {
          if (download.submittedDate) {
            const year = new Date(download.submittedDate).getFullYear().toString();
            if (!dataYears.includes(year)) dataYears.push(year);
          }
          if (download.approvedDate) {
            const year = new Date(download.approvedDate).getFullYear().toString();
            if (!dataYears.includes(year)) dataYears.push(year);
          }
        });
        
        // Generate comprehensive list of available years
        const availableYears = generateAvailableYears(dataYears);
        setAvailableYears(availableYears);
        
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching downloads:', error);
        console.error('Error details:', error.response?.data || error.message);
        setLoading(false);
        // If API fails, fall back to mock data for development
        if (process.env.NODE_ENV === 'development') {
          setDownloads(mockDownloads);
          
          // Extract years from mock data too
          const dataYears: string[] = [];
          mockDownloads.forEach(download => {
            if (download.submittedDate) {
              const year = new Date(download.submittedDate).getFullYear().toString();
              if (!dataYears.includes(year)) dataYears.push(year);
            }
            if (download.approvedDate) {
              const year = new Date(download.approvedDate).getFullYear().toString();
              if (!dataYears.includes(year)) dataYears.push(year);
            }
          });
          
          const availableYears = generateAvailableYears(dataYears);
          setAvailableYears(availableYears);
        }
      }
    };

    fetchDownloads();
  }, [yearFilter, monthFilter]);

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to get file type from file path
  const getFileTypeFromPath = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toUpperCase();
    return extension || 'Unknown';
  };

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

  const handleYearFilterChange = (event: SelectChangeEvent) => {
    setYearFilter(event.target.value);
    setPage(0);
  };

  const handleMonthFilterChange = (event: SelectChangeEvent) => {
    setMonthFilter(event.target.value);
    setPage(0);
  };

  const filteredDownloads = downloads.filter(doc => {
    // Search term filter - include consultant name in search
    const matchesSearch = 
      ((doc.vendorName?.toLowerCase() || '').includes(searchTerm.toLowerCase())) ||
      ((doc.consultantName?.toLowerCase() || '').includes(searchTerm.toLowerCase())) ||
      ((doc.documentType?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    
    // Year filter
    let matchesYear = yearFilter === 'all';
    if (!matchesYear && doc.approvedDate) {
      try {
        const docYear = new Date(doc.approvedDate).getFullYear().toString();
        matchesYear = docYear === yearFilter;
      } catch (error) {
        console.error('Error parsing year:', error);
      }
    }
    
    // Month filter
    let matchesMonth = monthFilter === 'all';
    if (!matchesMonth && doc.approvedDate) {
      try {
        const docMonth = (new Date(doc.approvedDate).getMonth() + 1).toString();
        matchesMonth = docMonth === monthFilter;
      } catch (error) {
        console.error('Error parsing month:', error);
      }
    }
    
    return matchesSearch && matchesYear && matchesMonth;
  });

  const handleDownload = async (docId: string) => {
    try {
      const doc = downloads.find(d => d.id === docId);
      if (!doc) {
        console.error('Document not found');
        alert('Document not found');
        return;
      }

      // Check if this is a compliance report attachment
      if (docId.startsWith('compliance-') && doc.reportId && doc.attachmentId) {
        try {
          // Download from compliance report attachment endpoint
          const response = await apiService.get(`/api/compliance-reports/${doc.reportId}/attachments/${doc.attachmentId}/download`, {
            responseType: 'blob'
          });
          
          // Create download link
          const blob = new Blob([response.data]);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = doc.fileName || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error downloading compliance report attachment:', error);
          alert('Failed to download file. Please try again.');
        }
      } else if (docId.startsWith('consultant-') && doc.reportId && doc.originalDocumentType) {
        try {
          // Download from consultant submission endpoint using documentType
          const response = await apiService.get(`/api/document-submissions/${doc.reportId}/download/${encodeURIComponent(doc.originalDocumentType)}`, {
            responseType: 'blob'
          });
          
          // Create download link
          const blob = new Blob([response.data]);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = doc.fileName || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error downloading consultant submission:', error);
          alert('Failed to download file. Please try again.');
        }
      } else {
        try {
          // Regular document download using file path
          if (doc.filePath) {
            const response = await apiService.get('/api/document-submissions/download', {
              params: {
                filePath: doc.filePath,
                fileName: doc.fileName
              },
              responseType: 'blob'
            });
            
            // Create download link
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = doc.fileName || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } else {
            console.error('No file path available for document');
            alert('File path not available for this document');
          }
        } catch (error) {
          console.error('Error downloading regular document:', error);
          alert('Failed to download file. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
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
                Downloads Center
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Access and download all approved documents and reports
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
                startIcon={<FontAwesomeIcon icon={faCloudDownload} />}
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
                Download All
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Download Summary Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
            <StatsCard>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                      {filteredDownloads.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Total Downloads
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
                      {filteredDownloads.filter(d => d.fileType === 'PDF').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      PDF Documents
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
                    <FontAwesomeIcon icon={faFilePdf} size="lg" />
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
                      {filteredDownloads.filter(d => d.fileType === 'Excel').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Excel Files
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
                    <FontAwesomeIcon icon={faFileExcel} size="lg" />
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
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#8B5CF6', mb: 1 }}>
                      {filteredDownloads.filter(d => d.fileType === 'Word').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Word Documents
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(139, 92, 246, 0.1)',
                      color: '#8B5CF6',
                      width: 56,
                      height: 56,
                    }}
                  >
                    <FontAwesomeIcon icon={faFileWord} size="lg" />
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
              Filter Downloads
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Box sx={{ width: { xs: '100%', md: '32%' } }}>
                <TextField
                  label="Search by Vendor, Consultant, or Document Type"
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
              <Box sx={{ width: { xs: '48%', md: '22%' } }}>
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
                    {availableYears.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ width: { xs: '48%', md: '22%' } }}>
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
                    <MenuItem value="1">January</MenuItem>
                    <MenuItem value="2">February</MenuItem>
                    <MenuItem value="3">March</MenuItem>
                    <MenuItem value="4">April</MenuItem>
                    <MenuItem value="5">May</MenuItem>
                    <MenuItem value="6">June</MenuItem>
                    <MenuItem value="7">July</MenuItem>
                    <MenuItem value="8">August</MenuItem>
                    <MenuItem value="9">September</MenuItem>
                    <MenuItem value="10">October</MenuItem>
                    <MenuItem value="11">November</MenuItem>
                    <MenuItem value="12">December</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            <Box sx={{ width: { xs: '100%', md: '18%' } }}>
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
                Apply Filters
              </Button>
            </Box>
            </Box>
          </CardContent>
        </StatsCard>

        {/* Downloads Table */}
        <ModernTableContainer>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                  <TableHead>
                    <TableRow>
                      <TableCell>Vendor Name</TableCell>
                      <TableCell>Consultant Name</TableCell>
                      <TableCell>Document Type</TableCell>
                      <TableCell>Submitted Date</TableCell>
                      <TableCell>Approved Date</TableCell>
                      <TableCell>File Size</TableCell>
                      <TableCell>File Type</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDownloads
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((doc) => (
                        <TableRow
                          hover
                          key={doc.id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>{doc.vendorName || 'N/A'}</TableCell>
                          <TableCell>
                            {doc.consultantName || 'N/A'}
                            {doc.reportType && (
                              <Chip 
                                label={doc.reportType} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                                sx={{ ml: 1, fontSize: '0.7rem' }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {doc.documentType || 'N/A'}
                            {doc.month && doc.year && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {doc.month} {doc.year}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {doc.submittedDate ? new Date(doc.submittedDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {doc.approvedDate ? new Date(doc.approvedDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>{doc.fileSize || 'N/A'}</TableCell>
                          <TableCell>{doc.fileType || 'N/A'}</TableCell>
                          <TableCell align="right">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDownload(doc.id)}
                              title="Download Document"
                              sx={{
                                color: '#667eea',
                                '&:hover': {
                                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                  color: '#5a67d8'
                                }
                              }}
                            >
                              <FontAwesomeIcon icon={faDownload} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    {filteredDownloads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          No documents found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredDownloads.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </ModernTableContainer>
      </Box>
    </MainLayout>
  );
};

export default DownloadsPage;
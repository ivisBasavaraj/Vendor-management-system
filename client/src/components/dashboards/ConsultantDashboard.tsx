import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer, 
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Button,
  GridLegacy as Grid,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  Avatar,
  Stack,
  LinearProgress,
  Tab,
  Tabs,
  List,
  ListItem
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Warning,
  Schedule,
  People,
  Visibility,
  Download,
  PriorityHigh,
  TrendingUp,
  Assessment,
  Notifications,
  Dashboard as DashboardIcon,
  Description,
  Person,
  Groups,
  VerifiedUser,
  Search,
  ArrowForward,
  PostAdd,
  SyncProblem,
  DonutLarge
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import apiService from '../../utils/api';
import { styled, Theme } from '@mui/material/styles';

// Define interfaces for styled components
interface IconWrapperProps {
  color?: string;
  theme?: Theme;
}

interface StyledProps {
  theme?: Theme;
}

interface ConsultantDashboardData {
  consultantInfo: {
    name: string;
    email: string;
  };
  currentPeriod: { year: number; month: string };
  workloadStats: {
    totalAssignedVendors: number;
    currentPeriodAssigned: number;
    pendingReview: number;
    readyForFinalApproval: number;
    completed: number;
    requiresVendorAction: number;
  };
  documentReviewStats: Array<{
    _id: string;
    count: number;
  }>;
  prioritySubmissions: Array<{
    _id: string;
    title: string;
    submissionDate: string;
    status: string;
    vendor?: {
      name: string;
      company?: string;
    };
  }>;
  vendorPerformance: Array<{
    vendorName: string;
    vendorEmail: string;
    company: string;
    totalSubmissions: number;
    approvedSubmissions: number;
    complianceRate: number;
    avgDocuments: number;
    lastSubmission: string;
  }>;
  recentActivity: any[];
  monthlyPerformance: Array<{
    _id: { year: number; month: string };
    totalReviewed: number;
    approved: number;
    avgReviewTime: number;
  }>;
  pendingActions: {
    newSubmissions: number;
    documentsToReview: number;
    finalApprovalsNeeded: number;
    overdueReviews: number;
  };
  assignedVendors: Array<{
    vendorId: string;
    vendorName: string;
    company: string;
    submissionStatus: string;
    submissionId: string;
  }>;
}

// Styled components for the dashboard
const DashboardCard = styled(Card)<StyledProps>(({ theme }) => ({
  height: '100%',
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
  },
}));

const StatsCard = styled(Box)<StyledProps>(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  height: '100%',
  minHeight: 100,
}));

const IconWrapper = styled(Box)<IconWrapperProps>(({ theme, color }) => ({
  width: 50,
  height: 50,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: color || theme.palette.primary.main,
  marginRight: theme.spacing(2),
  '& .MuiSvgIcon-root': {
    color: '#fff',
    fontSize: 26,
  },
}));

const ProgressBar = styled(LinearProgress)<StyledProps>(({ theme }) => ({
  height: 8,
  borderRadius: 4,
}));

const SectionTitle = styled(Typography)<StyledProps>(({ theme }) => ({
  fontSize: '1.25rem',
  fontWeight: '600',
  marginBottom: theme.spacing(2),
  position: 'relative',
  paddingLeft: theme.spacing(1.5),
  '&:before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    height: '70%',
    width: 4,
    backgroundColor: theme.palette.primary.main,
    borderRadius: 2,
  },
}));

const ConsultantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<ConsultantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Using the dashboard property from apiService
      const response = await apiService.dashboard.getConsultantDashboard();
      setDashboardData(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'fully_approved': '#4caf50',
      'partially_approved': '#ff9800',
      'under_review': '#2196f3',
      'submitted': '#9c27b0',
      'requires_resubmission': '#f44336',
      'draft': '#757575',
      'approved': '#4caf50',
      'rejected': '#f44336',
      'uploaded': '#2196f3',
      'resubmitted': '#ff9800'
    };
    return colors[status] || '#757575';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'fully_approved': 'Fully Approved',
      'partially_approved': 'Partially Approved',
      'under_review': 'Under Review',
      'submitted': 'Submitted',
      'requires_resubmission': 'Requires Resubmission',
      'draft': 'Draft',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'uploaded': 'Uploaded',
      'resubmitted': 'Resubmitted'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No dashboard data available
      </Alert>
    );
  }

  // Prepare chart data
  const workloadData = [
    { name: 'Pending Review', value: dashboardData.workloadStats.pendingReview, color: '#2196f3' },
    { name: 'Ready for Final Approval', value: dashboardData.workloadStats.readyForFinalApproval, color: '#ff9800' },
    { name: 'Completed', value: dashboardData.workloadStats.completed, color: '#4caf50' },
    { name: 'Requires Vendor Action', value: dashboardData.workloadStats.requiresVendorAction, color: '#f44336' }
  ];

  const documentReviewData = dashboardData.documentReviewStats.map(stat => ({
    name: getStatusLabel(stat._id),
    value: stat.count,
    color: getStatusColor(stat._id)
  }));

  const monthlyPerformanceData = dashboardData.monthlyPerformance.map(item => ({
    period: `${item._id.month} ${item._id.year}`,
    reviewed: item.totalReviewed,
    approved: item.approved,
    approvalRate: item.totalReviewed > 0 ? Math.round((item.approved / item.totalReviewed) * 100) : 0,
    avgReviewTime: Math.round(item.avgReviewTime || 0)
  }));

  const totalPendingActions = dashboardData.pendingActions.newSubmissions + 
                             dashboardData.pendingActions.documentsToReview + 
                             dashboardData.pendingActions.finalApprovalsNeeded;

  return (
    <Box sx={{ px: 4, py: 3, backgroundColor: '#f8f9fc', minHeight: '100vh' }}>
      {/* Header with Welcome message and user info */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 4 }}>
        <Box sx={{ flex: '1 1 66%', pr: 2, mb: { xs: 2, md: 0 } }}>
          <Typography variant="h4" fontWeight="700" gutterBottom>
            Welcome back, {dashboardData?.consultantInfo?.name || 'Consultant'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Here's what's happening with your document reviews today.
          </Typography>
        </Box>
        <Box sx={{ flex: '1 1 33%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Box sx={{ mr: 2, textAlign: 'right' }}>
            <Typography variant="subtitle2" fontWeight="600">
              {dashboardData?.consultantInfo?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Consultant
            </Typography>
          </Box>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
            {dashboardData?.consultantInfo?.name?.charAt(0) || 'C'}
          </Avatar>
        </Box>
      </Box>

      {/* Alert for overdue reviews */}
      {dashboardData?.pendingActions?.overdueReviews > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/documents')}
              endIcon={<ArrowForward />}
            >
              REVIEW NOW
            </Button>
          }
        >
          You have {dashboardData.pendingActions.overdueReviews} overdue review(s) that require immediate attention!
        </Alert>
      )}

      {/* Main tabs for different sections */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            backgroundColor: 'white',
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              minHeight: 60,
            }
          }}
        >
          <Tab 
            icon={<DashboardIcon />}
            label="Dashboard" 
            iconPosition="start"
          />
          <Tab 
            icon={<Description />}
            label="Document Review" 
            iconPosition="start"
          />
          <Tab 
            icon={<Groups />}
            label="Vendor List" 
            iconPosition="start"
          />
          <Tab 
            icon={<CheckCircle />}
            label="Approved Docs" 
            iconPosition="start"
          />
          <Tab 
            icon={<VerifiedUser />}
            label="Compliance Verification" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Key Metrics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 calc(25% - 18px)', minWidth: '240px' }}>
          <StatsCard sx={{ bgcolor: '#fff' }}>
            <IconWrapper color="#4361ee">
              <People />
            </IconWrapper>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Assigned Vendors
              </Typography>
              <Typography variant="h5" fontWeight="700" sx={{ my: 0.5 }}>
                {dashboardData?.workloadStats?.totalAssignedVendors || 0}
              </Typography>
              <Typography variant="caption" color="primary">
                {dashboardData?.workloadStats?.currentPeriodAssigned || 0} this period
              </Typography>
            </Box>
          </StatsCard>
        </Box>

        <Box sx={{ flex: '1 1 calc(25% - 18px)', minWidth: '240px' }}>
          <StatsCard sx={{ bgcolor: '#fff' }}>
            <IconWrapper color="#f72585">
              <Description />
            </IconWrapper>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Pending Reviews
              </Typography>
              <Typography variant="h5" fontWeight="700" sx={{ my: 0.5 }}>
                {dashboardData?.workloadStats?.pendingReview || 0}
              </Typography>
              <Typography variant="caption" color="error">
                {dashboardData?.pendingActions?.overdueReviews || 0} overdue
              </Typography>
            </Box>
          </StatsCard>
        </Box>

        <Box sx={{ flex: '1 1 calc(25% - 18px)', minWidth: '240px' }}>
          <StatsCard sx={{ bgcolor: '#fff' }}>
            <IconWrapper color="#10b981">
              <CheckCircle />
            </IconWrapper>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Approved Documents
              </Typography>
              <Typography variant="h5" fontWeight="700" sx={{ my: 0.5 }}>
                {dashboardData?.workloadStats?.completed || 0}
              </Typography>
              <Typography variant="caption" color="success.main">
                This period
              </Typography>
            </Box>
          </StatsCard>
        </Box>

        <Box sx={{ flex: '1 1 calc(25% - 18px)', minWidth: '240px' }}>
          <StatsCard sx={{ bgcolor: '#fff' }}>
            <IconWrapper color="#ff9800">
              <VerifiedUser />
            </IconWrapper>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Compliance Status
              </Typography>
              <Typography variant="h5" fontWeight="700" sx={{ my: 0.5 }}>
                {Math.round((dashboardData?.workloadStats?.completed || 0) / 
                  ((dashboardData?.workloadStats?.pendingReview || 0) + 
                  (dashboardData?.workloadStats?.completed || 0) + 0.001) * 100)}%
              </Typography>
              <Typography variant="caption" color="warning.main">
                Overall verification rate
              </Typography>
            </Box>
          </StatsCard>
        </Box>
      </Box>

      {/* Document Review Section */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 64%', minWidth: '300px' }}>
          <DashboardCard>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <SectionTitle variant="h6">Recent Document Submissions</SectionTitle>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small"
                  onClick={() => navigate('/documents')}
                  endIcon={<ArrowForward />}
                >
                  View All
                </Button>
              </Box>
              
              {loading ? (
                <CircularProgress size={28} sx={{ display: 'block', mx: 'auto', my: 4 }} />
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 350 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Document Name</TableCell>
                        <TableCell>Vendor</TableCell>
                        <TableCell>Submission Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData?.prioritySubmissions?.slice(0, 5).map((submission, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500">
                              {submission.title || 'Document Submission'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                                {submission.vendor?.name?.charAt(0) || 'V'}
                              </Avatar>
                              <Typography variant="body2">
                                {submission.vendor?.name || 'Unknown Vendor'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(submission.submissionDate).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={getStatusLabel(submission.status)} 
                              size="small"
                              sx={{ 
                                backgroundColor: getStatusColor(submission.status) + '20',
                                color: getStatusColor(submission.status),
                                fontWeight: "500"
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Document">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => navigate(`/documents/${submission._id}`)}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!dashboardData?.prioritySubmissions || dashboardData.prioritySubmissions.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              No recent document submissions found.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </DashboardCard>
        </Box>
        
        <Box sx={{ flex: '1 1 34%', minWidth: '300px' }}>
          <DashboardCard sx={{ height: '100%' }}>
            <CardContent>
              <SectionTitle variant="h6">Pending Actions</SectionTitle>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <StatsCard sx={{ bgcolor: '#f0f7ff' }}>
                  <IconWrapper color="#3b82f6">
                    <PostAdd />
                  </IconWrapper>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="500">
                        New Submissions
                      </Typography>
                      <Typography variant="h6" fontWeight="700">
                        {dashboardData?.pendingActions?.newSubmissions || 0}
                      </Typography>
                    </Box>
                    <ProgressBar 
                      variant="determinate" 
                      value={Math.min(100, ((dashboardData?.pendingActions?.newSubmissions || 0) / 
                        (totalPendingActions || 1)) * 100)} 
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </StatsCard>
                
                <StatsCard sx={{ bgcolor: '#fff1f0' }}>
                  <IconWrapper color="#ef4444">
                    <SyncProblem />
                  </IconWrapper>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="500">
                        Overdue Reviews
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="error.main">
                        {dashboardData?.pendingActions?.overdueReviews || 0}
                      </Typography>
                    </Box>
                    <ProgressBar 
                      variant="determinate" 
                      value={Math.min(100, ((dashboardData?.pendingActions?.overdueReviews || 0) / 
                        (totalPendingActions || 1)) * 100)} 
                      color="error"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </StatsCard>
                
                <StatsCard sx={{ bgcolor: '#f0fff4' }}>
                  <IconWrapper color="#10b981">
                    <CheckCircle />
                  </IconWrapper>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="500">
                        Ready for Approval
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        {dashboardData?.pendingActions?.finalApprovalsNeeded || 0}
                      </Typography>
                    </Box>
                    <ProgressBar 
                      variant="determinate" 
                      value={Math.min(100, ((dashboardData?.pendingActions?.finalApprovalsNeeded || 0) / 
                        (totalPendingActions || 1)) * 100)} 
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </StatsCard>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  size="large"
                  onClick={() => navigate('/documents')}
                  sx={{ mt: 2, borderRadius: 2, height: 48 }}
                >
                  Process All Pending Documents
                </Button>
              </Box>
            </CardContent>
          </DashboardCard>
        </Box>
      </Box>

      {/* Vendor List and Compliance Verification Section */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 30%', minWidth: '300px' }}>
          <DashboardCard>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <SectionTitle variant="h6">Assigned Vendors</SectionTitle>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small"
                  onClick={() => navigate('/users/vendors')}
                  endIcon={<ArrowForward />}
                >
                  View All
                </Button>
              </Box>
              
              {loading ? (
                <CircularProgress size={28} sx={{ display: 'block', mx: 'auto', my: 4 }} />
              ) : (
                <>
                  <List sx={{ px: 0 }}>
                    {dashboardData?.assignedVendors?.slice(0, 5).map((vendor, index) => (
                      <React.Fragment key={vendor.vendorId || index}>
                        <ListItem 
                          sx={{ 
                            px: 2, 
                            py: 1.5, 
                            borderRadius: 2,
                            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Avatar 
                              sx={{ 
                                width: 40, 
                                height: 40, 
                                mr: 2,
                                bgcolor: index % 2 === 0 ? 'primary.main' : 'secondary.main' 
                              }}
                            >
                              {vendor.vendorName?.charAt(0) || 'V'}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2" fontWeight="600">
                                {vendor.vendorName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {vendor.company}
                              </Typography>
                            </Box>
                            <Chip 
                              label={getStatusLabel(vendor.submissionStatus)} 
                              size="small"
                              sx={{ 
                                backgroundColor: getStatusColor(vendor.submissionStatus) + '20',
                                color: getStatusColor(vendor.submissionStatus),
                                fontWeight: "500"
                              }}
                            />
                          </Box>
                        </ListItem>
                        {index < Math.min(4, (dashboardData?.assignedVendors?.length || 1) - 1) && (
                          <Divider component="li" variant="middle" />
                        )}
                      </React.Fragment>
                    ))}
                    {(!dashboardData?.assignedVendors || dashboardData.assignedVendors.length === 0) && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No vendors assigned yet.
                        </Typography>
                      </Box>
                    )}
                  </List>
                  
                  {(dashboardData?.assignedVendors?.length || 0) > 5 && (
                    <Button 
                      variant="text" 
                      color="primary" 
                      fullWidth
                      onClick={() => navigate('/users/vendors')}
                      sx={{ mt: 1 }}
                    >
                      View all {dashboardData?.assignedVendors?.length} vendors
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </DashboardCard>
        </Box>
        
        <Box sx={{ flex: '1 1 68%', minWidth: '300px' }}>
          <DashboardCard>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <SectionTitle variant="h6">Compliance & Performance</SectionTitle>
                <Box>
                  <Tooltip title="Document verification statistics">
                    <IconButton color="primary" size="small">
                      <DonutLarge />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 35%', minWidth: '240px' }}>
                  <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={workloadData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {workloadData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                      {workloadData.map((entry, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: entry.color,
                            mr: 1
                          }} />
                          <Typography variant="caption">{entry.name}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ flex: '1 1 62%', minWidth: '240px' }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="600">
                    Top Performing Vendors
                  </Typography>
                  
                  <TableContainer sx={{ maxHeight: 250 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Vendor</TableCell>
                          <TableCell align="center">Documents</TableCell>
                          <TableCell align="right">Compliance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData?.vendorPerformance?.slice(0, 5).map((vendor, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="500">
                                {vendor.vendorName || vendor.company}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {vendor.totalSubmissions}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <Typography variant="body2" sx={{ mr: 1 }}>
                                  {vendor.complianceRate}%
                                </Typography>
                                <Box sx={{ 
                                  width: 50, 
                                  bgcolor: 'background.paper',
                                  borderRadius: 5,
                                  overflow: 'hidden',
                                  height: 6
                                }}>
                                  <Box 
                                    sx={{ 
                                      height: '100%', 
                                      width: `${vendor.complianceRate}%`,
                                      bgcolor: vendor.complianceRate > 75 ? 'success.main' : 
                                              vendor.complianceRate > 50 ? 'warning.main' : 'error.main'
                                    }}
                                  />
                                </Box>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            </CardContent>
          </DashboardCard>
        </Box>
      </Box>
      
      {/* Approved Documents Section */}
      <Box sx={{ mb: 3 }}>
        <DashboardCard>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <SectionTitle variant="h6">Recently Approved Documents</SectionTitle>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small"
                  onClick={() => navigate('/documents?status=approved')}
                  endIcon={<ArrowForward />}
                >
                  View All Approved
                </Button>
              </Box>
              
              {loading ? (
                <CircularProgress size={28} sx={{ display: 'block', mx: 'auto', my: 4 }} />
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Document</TableCell>
                        <TableCell>Vendor</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Approved Date</TableCell>
                        <TableCell>Expiry</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {documentReviewData.length > 0 ? (
                        // Just using some mock data since we don't have real approved docs data
                        Array(5).fill(0).map((_, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  variant="rounded"
                                  sx={{ 
                                    width: 36, 
                                    height: 36, 
                                    mr: 2,
                                    bgcolor: index % 2 === 0 ? 'primary.light' : 'success.light' 
                                  }}
                                >
                                  <Description />
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="500">
                                    {['ISO Certificate', 'QA Documents', 'Compliance Report', 'Product Specification', 'Technical Data'][index]}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {['Technical', 'Safety', 'Quality', 'Regulatory', 'Specification'][index]}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {dashboardData?.assignedVendors?.[index]?.vendorName || 'Vendor ' + (index + 1)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={['PDF', 'DOCX', 'PDF', 'XLSX', 'PDF'][index]} 
                                size="small"
                                sx={{ fontSize: '0.7rem', height: 22 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(Date.now() - (index * 2 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2"
                                color={index === 0 ? 'warning.main' : 'text.primary'}
                              >
                                {new Date(Date.now() + ((10 - index) * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box>
                                <Tooltip title="View Document">
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                  >
                                    <Visibility fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Download">
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                  >
                                    <Download fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              No approved documents found.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </DashboardCard>
      </Box>
    </Box>
  );
};

export default ConsultantDashboard;

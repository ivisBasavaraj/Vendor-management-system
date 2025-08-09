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
  Divider,
  Card,
  CardContent,
  GridLegacy as Grid,
  Avatar,
  Stack,
  IconButton,
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
  faUsers,
  faUserTie,
  faUserShield,
  faChartLine,
  faRefresh,
  faFileExport
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import { apiService } from '../../utils/api';
import * as XLSX from 'xlsx';



// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  },
}));

const ModernTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
}));

// Activity Summary Component
const ActivitySummary: React.FC = () => {
  const [stats, setStats] = useState({
    vendor: 0,
    consultant: 0,
    admin: 0,
    system: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiService.activityLogs.getStats();
        
        console.log('Stats API Response:', response.data);
        
        if (response.data && response.data.success && response.data.data) {
          const { userTypeCounts } = response.data.data;
          setStats({
            vendor: userTypeCounts.vendor || 0,
            consultant: userTypeCounts.consultant || 0,
            admin: userTypeCounts.admin || 0,
            system: userTypeCounts.system || 0
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching activity stats:', error);
        setLoading(false);
        
        // Keep stats at 0 on error
        setStats({
          vendor: 0,
          consultant: 0,
          admin: 0,
          system: 0
        });
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress size={24} />
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  const statsData = [
    {
      title: 'Vendor Activities',
      value: stats.vendor,
      icon: faUsers,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Consultant Activities',
      value: stats.consultant,
      icon: faUserTie,
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      title: 'Admin Activities',
      value: stats.admin + stats.system,
      icon: faUserShield,
      color: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
    {
      title: 'Total Activities',
      value: stats.vendor + stats.consultant + stats.admin + stats.system,
      icon: faChartLine,
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
  ];

  return (
    <Grid container spacing={3}>
      {statsData.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <StatsCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: stat.color, mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {stat.title}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: stat.bgColor,
                    color: stat.color,
                    width: 56,
                    height: 56,
                  }}
                >
                  <FontAwesomeIcon icon={stat.icon} size="lg" />
                </Avatar>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>
      ))}
    </Grid>
  );
};

const ActivityLogsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        setLoading(true);
        
        // Build query parameters for filtering
        const queryParams = new URLSearchParams();
        if (userTypeFilter !== 'all') {
          queryParams.append('userType', userTypeFilter);
        }
        if (actionFilter !== 'all') {
          queryParams.append('action', actionFilter);
        }
        if (searchTerm) {
          queryParams.append('search', searchTerm);
        }
        if (dateRange.startDate) {
          queryParams.append('startDate', dateRange.startDate);
        }
        if (dateRange.endDate) {
          queryParams.append('endDate', dateRange.endDate);
        }
        
        // Set page and limit
        queryParams.append('page', (page + 1).toString());
        queryParams.append('limit', rowsPerPage.toString());
        
        // Use the new dedicated activity logs API endpoint
        const params = Object.fromEntries(queryParams.entries());
        const response = await apiService.activityLogs.getAll(params);
        
        console.log('API Response:', response.data);
        
        if (response.data && response.data.success && response.data.data) {
          console.log('Raw API data:', response.data.data);
          
          // Transform the API response to match our expected format
          const formattedLogs = response.data.data.map((item: any) => {
            console.log('Processing item:', item);
            return {
              id: item._id,
              action: item.action,
              user: item.userName,
              timestamp: new Date(item.createdAt).toLocaleString(),
              userType: item.userType
            };
          });
          
          console.log('Formatted logs:', formattedLogs);
          setActivityLogs(formattedLogs);
          
          // Set pagination info from API response
          if (response.data.pagination) {
            setTotalCount(response.data.pagination.total);
            console.log('Pagination info:', response.data.pagination);
          }
          
          console.log('Activity logs fetched successfully (active users only):', formattedLogs.length);
        } else {
          // If API returns empty or error, set empty array
          console.log('No activity logs found from API - Response structure:', response.data);
          setActivityLogs([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        setLoading(false);
        
        // Set empty array on error
        setActivityLogs([]);
      }
    };

    fetchActivityLogs();
  }, [page, rowsPerPage, userTypeFilter, actionFilter, searchTerm, dateRange]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleExportLogs = () => {
    // Prepare data for Excel export
    const exportData = activityLogs.map(log => ({
      'Action': log.action || '',
      'User': log.user || '',
      'User Type': log.userType || '',
      'Timestamp': log.timestamp || ''
    }));

    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for better formatting
    const columnWidths = [
      { wch: 25 }, // Action
      { wch: 30 }, // User
      { wch: 15 }, // User Type
      { wch: 20 }  // Timestamp
    ];
    worksheet['!cols'] = columnWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Logs');

    // Generate filename with current date
    const filename = `activity-logs-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Write and download the Excel file
    XLSX.writeFile(workbook, filename);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleUserTypeFilterChange = (event: SelectChangeEvent) => {
    setUserTypeFilter(event.target.value);
    setPage(0);
  };

  const handleActionFilterChange = (event: SelectChangeEvent) => {
    setActionFilter(event.target.value);
    setPage(0);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };

  // Backend handles all filtering, so no client-side filtering needed

  // Get unique actions for filter
  const uniqueActions = ['all', ...Array.from(new Set(activityLogs.filter(log => log && log.action).map(log => log.action)))];

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
                Activity Logs
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor and track all system activities in real-time
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
                onClick={handleExportLogs}
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
                Export Logs
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Activity Summary Cards */}
        <Box sx={{ mb: 4 }}>
          <ActivitySummary />
        </Box>

        {/* Filters Section */}
        <StatsCard sx={{ mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#374151' }}>
              Filter Activities
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Search Activities"
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
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>User Type</InputLabel>
                  <Select
                    value={userTypeFilter}
                    label="User Type"
                    onChange={handleUserTypeFilterChange}
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
                    <MenuItem value="all">All Users</MenuItem>
                    <MenuItem value="vendor">Vendors</MenuItem>
                    <MenuItem value="consultant">Consultants</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={actionFilter}
                    label="Action"
                    onChange={handleActionFilterChange}
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
                    {uniqueActions.map(action => (
                      <MenuItem key={action} value={action}>
                        {action === 'all' ? 'All Actions' : action}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Start Date"
                  type="date"
                  size="small"
                  fullWidth
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  InputLabelProps={{ shrink: true }}
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
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="End Date"
                  type="date"
                  size="small"
                  fullWidth
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  InputLabelProps={{ shrink: true }}
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
              </Grid>
              <Grid item xs={12} md={1}>
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
              </Grid>
            </Grid>
          </CardContent>
        </StatsCard>

        {/* Activity Logs Table */}
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
                        <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Timestamp</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>Action</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>User</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#374151', py: 2 }}>User Type</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activityLogs.map((log, index) => (
                          <TableRow
                            hover
                            key={log.id}
                            sx={{ 
                              '&:hover': { 
                                bgcolor: 'rgba(102, 126, 234, 0.02)',
                                transform: 'scale(1.001)',
                                transition: 'all 0.2s ease-in-out'
                              },
                              borderBottom: index === activityLogs.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.06)'
                            }}
                          >
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {log.timestamp || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {log.action || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography variant="body2">
                                {log.user || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2.5 }}>
                              <Chip 
                                label={log.userType ? (log.userType.charAt(0).toUpperCase() + log.userType.slice(1)) : 'Unknown'} 
                                color={
                                  log.userType === 'vendor' ? 'success' : 
                                  log.userType === 'consultant' ? 'info' : 'primary'
                                }
                                size="small"
                                sx={{ 
                                  fontWeight: 500,
                                  borderRadius: '8px',
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      {activityLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" color="text.secondary" gutterBottom>
                                No Activity Logs Found
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                No activity logs from active users match your current filters.
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Only activities from active users are displayed.
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
                    count={totalCount}
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

export default ActivityLogsPage;
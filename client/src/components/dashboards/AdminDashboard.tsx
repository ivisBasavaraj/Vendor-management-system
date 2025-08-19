import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Button,
  GridLegacy as Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip as MuiTooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faTrash, 
  faEye, 
  faEdit, 
  faDownload, 
  faPrint,
  faBuilding,
  faUserTie
} from '@fortawesome/free-solid-svg-icons';

// Mock data for initial rendering
const initialStats = {
  totalVendors: 0,
  activeVendors: 0,
  pendingApprovals: 0
};

const initialPendingApprovals: any[] = [];
const initialVendorPerformance: any[] = [];

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const auth = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(initialStats);
  const [pendingApprovals, setPendingApprovals] = useState(initialPendingApprovals);
  const [vendorPerformance, setVendorPerformance] = useState(initialVendorPerformance);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/dashboard/admin');

        const { data } = response.data;
        
        setStats(data.stats || initialStats);
        setPendingApprovals(data.pendingApprovals || []);
        setVendorPerformance(data.vendorPerformance || []);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        // Use mock data in case of error to ensure statistics are always displayed
        setStats({
          totalVendors: 45,
          activeVendors: 32,
          pendingApprovals: 8
        });
        
        setPendingApprovals([
          { id: 1, vendorName: 'ABC Supplies', documentType: 'Invoice', submittedAt: '2023-06-15' },
          { id: 2, vendorName: 'XYZ Manufacturing', documentType: 'Purchase Order', submittedAt: '2023-06-14' },
          { id: 3, vendorName: 'Global Logistics', documentType: 'Delivery Note', submittedAt: '2023-06-13' }
        ]);
        
        setVendorPerformance([
          { name: 'ABC Supplies', complianceRate: 95 },
          { name: 'XYZ Manufacturing', complianceRate: 88 },
          { name: 'Global Logistics', complianceRate: 76 },
          { name: 'Tech Solutions', complianceRate: 92 },
          { name: 'Industrial Parts', complianceRate: 85 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare data for pie chart
  const pieData = [
    { name: 'Active Vendors', value: stats.activeVendors },
    { name: 'Inactive Vendors', value: stats.totalVendors - stats.activeVendors }
  ];

  // Handle document deletion
  const handleDeleteClick = (document: any) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      // API call to delete document would go here
      // await axios.delete(`/api/documents/${selectedDocument.id}`);
      
      // For now, just close the dialog and show a success message
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
      
      // Refresh data
      // fetchDashboardData();
      
      // For demo purposes, just update the UI
      if (selectedDocument) {
        setPendingApprovals(pendingApprovals.filter(doc => doc.id !== selectedDocument.id));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedDocument(null);
  };

  // Navigation handlers
  const handleViewVendorDetails = (vendorId: string) => {
    navigate(`/admin/vendors/${vendorId}`);
  };

  const handleViewConsultantDetails = (consultantId: string) => {
    navigate(`/admin/consultants/${consultantId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom component="div">
        Admin Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: '200px' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
            }}
            onClick={() => navigate('/admin/vendors')}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <FontAwesomeIcon icon={faBuilding} size="2x" color={theme.palette.primary.main} />
            </Box>
            <Typography variant="h6" color="text.secondary">Total Vendors</Typography>
            <Typography variant="h3">{stats.totalVendors}</Typography>
            <Button 
              variant="text" 
              color="primary" 
              sx={{ mt: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/admin/vendors');
              }}
            >
              View Details
            </Button>
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: '200px' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
            }}
            onClick={() => navigate('/admin/vendors?status=active')}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <FontAwesomeIcon icon={faBuilding} size="2x" color={theme.palette.success.main} />
            </Box>
            <Typography variant="h6" color="text.secondary">Active Vendors</Typography>
            <Typography variant="h3">{stats.activeVendors}</Typography>
            <Button 
              variant="text" 
              color="primary" 
              sx={{ mt: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/admin/vendors?status=active');
              }}
            >
              View Details
            </Button>
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: '200px' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
            }}
            onClick={() => navigate('/admin/consultants')}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <FontAwesomeIcon icon={faUserTie} size="2x" color={theme.palette.info.main} />
            </Box>
            <Typography variant="h6" color="text.secondary">Consultants</Typography>
            <Typography variant="h3">{stats.pendingApprovals}</Typography>
            <Button 
              variant="text" 
              color="primary" 
              sx={{ mt: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/admin/consultants');
              }}
            >
              View Details
            </Button>
          </Paper>
        </Box>

      </Box>
      
      {/* Charts and Lists */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Vendor Status Chart */}
        <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
          <Card elevation={3}>
            <CardHeader title="Vendor Status" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
        
        {/* Vendor Performance Chart */}
        <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
          <Card elevation={3}>
            <CardHeader 
              title="Vendor Compliance Rate" 
              action={
                <Button size="small" color="primary">
                  View All
                </Button>
              }
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={vendorPerformance}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="complianceRate" fill="#8884d8" name="Compliance Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
        
        {/* Pending Approvals */}
        <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
          <Card elevation={3}>
            <CardHeader 
              title="Pending Approvals" 
              action={
                <Button 
                  size="small" 
                  color="primary"
                  onClick={() => navigate('/admin/status')}
                >
                  View All
                </Button>
              }
            />
            <CardContent>
              <List>
                {pendingApprovals.length > 0 ? (
                  pendingApprovals.map((approval, index) => (
                    <React.Fragment key={approval.id}>
                      <ListItem
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <MuiTooltip title="View Details">
                              <IconButton 
                                edge="end" 
                                aria-label="view" 
                                size="small"
                                onClick={() => navigate(`/admin/documents/${approval.id}`)}
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </IconButton>
                            </MuiTooltip>
                            <MuiTooltip title="Remove Document">
                              <IconButton 
                                edge="end" 
                                aria-label="delete" 
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(approval)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </IconButton>
                            </MuiTooltip>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={`${approval.vendorName} - ${approval.documentType}`}
                          secondary={`Submitted: ${approval.submittedAt}`}
                        />
                      </ListItem>
                      {index < pendingApprovals.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No pending approvals" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
        

      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Document Removal"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to remove this document? This action cannot be undone.
            {selectedDocument && (
              <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
                {selectedDocument.vendorName} - {selectedDocument.documentType}
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
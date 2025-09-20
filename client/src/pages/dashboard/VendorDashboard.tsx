import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../utils/api';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import MainLayout from '../../components/layout/MainLayout';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface DashboardStats {
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  documentsByStatus: Array<{ name: string; value: number; }>;
}

const VendorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    pendingDocuments: 0,
    approvedDocuments: 0,
    rejectedDocuments: 0,
    documentsByStatus: []
  });
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch real data from the API
        const response = await apiService.dashboard.getVendorDashboard();
        const dashboardData = response.data.data;
        
        console.log('Full API Response:', response);
        console.log('Dashboard data:', dashboardData);
        console.log('Document Stats:', dashboardData?.documentStats);
        
        // Process the data for the dashboard
        if (dashboardData) {
          // Set stats from real data
          setStats({
            totalDocuments: dashboardData.documentStats?.totalDocuments || 0,
            pendingDocuments: dashboardData.documentStats?.pendingDocuments || 0,
            approvedDocuments: dashboardData.documentStats?.approvedDocuments || 0,
            rejectedDocuments: dashboardData.documentStats?.rejectedDocuments || 0,
            documentsByStatus: [
              { name: 'Pending', value: dashboardData.documentStats?.pendingDocuments || 0 },
              { name: 'Under Review', value: dashboardData.documentStats?.underReviewDocuments || 0 },
              { name: 'Approved', value: dashboardData.documentStats?.approvedDocuments || 0 },
              { name: 'Rejected', value: dashboardData.documentStats?.rejectedDocuments || 0 }
            ].filter(item => item.value > 0) // Only show statuses with documents
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // If API call fails, show error and empty state
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Navigation handler
  const handleCardClick = (path: string) => {
    navigate(path);
  };

  // Colors for charts
  const COLORS = ['#0976ce', '#7c3aed', '#16a34a', '#dc2626'];
  const RADIAN = Math.PI / 180;

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Render loading skeleton
  if (loading) {
    return (
      <MainLayout>
        <div className="dashboard-container">
          <div className="skeleton line w-1/4 h-8 section-wrapper" />
          
          <div className="dashboard-stats-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton card" />
            ))}
          </div>
          
          <div className="dashboard-charts-grid">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="skeleton card h-80" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="dashboard-container">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 padding-md rounded section-wrapper relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 padding-md"
              onClick={() => setError(null)}
            >
              <span className="sr-only">Close</span>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </button>
          </div>
        )}
        
        <motion.div 
          className="dashboard-header flex flex-col lg:flex-row lg:items-center lg:justify-between spacing-md lg:space-y-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="spacing-sm">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Vendor Dashboard - {user?.company}
            </p>
          </div>
          {/* Quick action buttons removed as requested */}
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="dashboard-stats-grid"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeInUp}>
            <Card 
              className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={() => handleCardClick('/documents')}
            >
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mr-4">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Documents Till Date</p>
                  <h3 className="text-2xl font-bold">{stats.totalDocuments}</h3>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeInUp}>
            <Card 
              className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              onClick={() => handleCardClick('/documents/status')}
            >
              <div className="flex items-center">
                <div className="rounded-full bg-indigo-100 dark:bg-indigo-900 p-3 mr-4">
                  <ClockIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Pending</p>
                  <h3 className="text-2xl font-bold">{stats.pendingDocuments}</h3>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeInUp}>
            <Card 
              className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 hover:bg-green-50 dark:hover:bg-green-900/20"
              onClick={() => handleCardClick('/documents/edit')}
            >
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-4">
                  <DocumentTextIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Approved</p>
                  <h3 className="text-2xl font-bold">{stats.approvedDocuments}</h3>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeInUp}>
            <Card 
              className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => handleCardClick('/documents/rejected')}
            >
              <div className="flex items-center">
                <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 mr-4">
                  <DocumentTextIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Rejected</p>
                  <h3 className="text-2xl font-bold">{stats.rejectedDocuments}</h3>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Content - Charts */}
        <div className="dashboard-charts-grid">
          {/* Document Status Pie Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Document Status Distribution</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Overview of your submitted documents by status</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.documentsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.documentsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
                {stats.documentsByStatus.map((entry, index) => (
                  <div key={`legend-${index}`} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Document Status Bar Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Document Status Breakdown</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Detailed view of document counts by status</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.documentsByStatus}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#0976ce"
                      radius={[4, 4, 0, 0]}
                    >
                      {stats.documentsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

      </div>
    </MainLayout>
  );
};

export default VendorDashboard; 
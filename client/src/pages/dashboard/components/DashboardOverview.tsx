import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  DocumentTextIcon,
  UserGroupIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  IdentificationIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Card from '../../../components/ui/Card';

interface DashboardStatsProps {
  stats: {
    totalVendors: number;
    totalConsultants: number;
    totalSubmissions: number;
    activeUsers: number;
    pendingApprovals: number;
    documentsByStatus: Array<{ name: string; value: number; }>;
    documentsByMonth: Array<{ month: string; count: number; }>;
    userActivity: Array<{ date: string; vendors: number; consultants: number; }>;
  };
}

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

// Colors for charts
const COLORS = ['#0976ce', '#7c3aed', '#16a34a', '#dc2626', '#6b7280'];
const RADIAN = Math.PI / 180;

// Custom label for pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const DashboardOverview: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <>
      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeInUp}>
          <Link to="/admin/vendors" className="block">
            <Card className="p-6 h-full transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-400">
                    <BuildingOfficeIcon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Vendors</h3>
                    <div className="mt-1 flex items-baseline">
                      <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        {stats.totalVendors}
                      </p>
                    </div>
                  </div>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600" />
              </div>
            </Card>
          </Link>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Link to="/admin/consultants" className="block">
            <Card className="p-6 h-full transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3 text-purple-600 dark:text-purple-400">
                    <IdentificationIcon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Consultants</h3>
                    <div className="mt-1 flex items-baseline">
                      <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        {stats.totalConsultants}
                      </p>
                    </div>
                  </div>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600" />
              </div>
            </Card>
          </Link>
        </motion.div>



        <motion.div variants={fadeInUp}>
          <Link to="/admin/activity-logs" className="block">
            <Card className="p-6 h-full transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-3 text-amber-600 dark:text-amber-400">
                    <UsersIcon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Active Users</h3>
                    <div className="mt-1 flex items-baseline">
                      <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        {stats.activeUsers}
                      </p>
                      <p className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
                        {stats.pendingApprovals > 0 && `(${stats.pendingApprovals} pending)`}
                      </p>
                    </div>
                  </div>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600" />
              </div>
            </Card>
          </Link>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Link to="/admin/status" className="block">
            <Card className="p-6 h-full transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 text-green-600 dark:text-green-400">
                    <DocumentTextIcon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Submissions</h3>
                    <div className="mt-1 flex items-baseline">
                      <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                        {stats.totalSubmissions}
                      </p>
                    </div>
                  </div>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600" />
              </div>
            </Card>
          </Link>
        </motion.div>
      </motion.div>

      {/* Charts */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <motion.div variants={fadeInUp}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6 text-neutral-900 dark:text-white flex items-center">
              <ChartBarIcon className="mr-2 h-5 w-5 text-neutral-500" />
              Document Submission Status
            </h3>
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
                  <Tooltip formatter={(value) => [`${value} documents`, '']} />
                  <Legend formatter={(value) => <span className="text-sm">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6 text-neutral-900 dark:text-white flex items-center">
              <ChartBarIcon className="mr-2 h-5 w-5 text-neutral-500" />
              Document Submission by Month
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.documentsByMonth}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} documents`, '']} />
                  <Bar dataKey="count" fill="#0976ce" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div 
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-6 text-neutral-900 dark:text-white flex items-center">
            <ChartBarIcon className="mr-2 h-5 w-5 text-neutral-500" />
            User Activity
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.userActivity}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="vendors" stroke="#0976ce" activeDot={{ r: 8 }} name="Vendors" />
                <Line type="monotone" dataKey="consultants" stroke="#7c3aed" name="Consultants" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
    </>
  );
};

export default DashboardOverview; 
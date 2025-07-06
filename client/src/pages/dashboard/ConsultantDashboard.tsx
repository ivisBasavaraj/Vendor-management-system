import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types/auth'; // Changed import path
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentMagnifyingGlassIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import MainLayout from '../../components/layout/MainLayout';
import apiService from '../../utils/api';
import MessageSystem from '../../components/communication/MessageSystem';
import DocumentAuditTrail from '../../components/document/DocumentAuditTrail';
import { DocumentStats, Document as ApiDocument } from '../../utils/api/types';
import type { Document as ApiDocumentType } from '../../utils/api/types';

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

// Add proper type annotations for the document submission workflow
interface SubmissionDocument {
  _id: string;
  documentType: string;
  documentName: string;
  status: string;
  vendorName?: string;
  title?: string;
  submissionDate?: string;
  fileCount?: number;
  assignedTo?: string;
  vendorId?: string;
  comments?: Array<{
    id: string;
    text: string;
    author: string;
    timestamp: string;
  }>;
  [key: string]: any; // For other properties
}

interface Submission {
  _id: string;
  submissionId: string;
  documents: SubmissionDocument[];
  vendor?: {
    _id: string;
    name: string;
    email: string;
    company: string;
  };
  [key: string]: any; // For other properties
}

interface ExtendedDashboardStats extends DocumentStats {
  mappedVendors: number;
  approvalsByMonth: Array<{ month: string; count: number; }>;
  documentsByStatus: Array<{ name: string; value: number; }>;
  documentsByVendor: Array<{ vendor: string; pending: number; approved: number; rejected: number; }>;
}

interface PendingDocument {
  _id: string;
  title: string;
  documentType: string;
  submissionDate: string;
  vendorName: string;
  urgency: 'low' | 'medium' | 'high';
  daysAgo: number;
}

interface PendingApproval {
  _id: string;
  vendorName: string;
  companyName: string;
  requestDate: string;
  email: string;
}

interface Stats {
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  assignedToMe: number;
  completedReviews: number;
}

const ConsultantDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ExtendedDashboardStats>({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    assignedToMe: 0,
    completedReviews: 0,
    mappedVendors: 0,
    approvalsByMonth: [],
    documentsByStatus: [],
    documentsByVendor: []
  });
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<ApiDocument | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Navigation handlers for cards
  const handlePendingReviewClick = () => {
    navigate('/vendor-status');
  };

  const handleApprovedClick = () => {
    navigate('/approved-documents');
  };

  const handleMappedVendorsClick = () => {
    navigate('/vendors-list');
  };



  // Fetch documents and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (user?._id) {
          console.log('Current user:', user);
          console.log('User role:', user.role);
          console.log('User email:', user.email);
          
          // Check if user is a consultant
          if (user.role !== 'consultant') {
            console.warn('User is not a consultant, role:', user.role);
            setError('Access denied. Only consultants can view this dashboard.');
            return;
          }
          
          // Fetch consultant dashboard stats
          console.log('Fetching consultant dashboard...');
          const dashboardResponse = await apiService.dashboard.getConsultantDashboard();
          console.log('Dashboard response:', dashboardResponse);
          console.log('Dashboard response status:', dashboardResponse.status);
          console.log('Dashboard response data:', dashboardResponse.data);
          
          const dashboardData = dashboardResponse.data;
          console.log('Dashboard data:', dashboardData);
          console.log('Dashboard data success:', dashboardData?.success);
          console.log('Dashboard data.data:', dashboardData?.data);
          
          // Fetch documents assigned to the consultant using the new API
          console.log('Fetching consultant submissions...');
          const documentsResponse = await apiService.documents.getConsultantSubmissions({ 
            consultantId: user._id
          });
          console.log('Documents response:', documentsResponse);

          // Transform the response to ensure each document has its submissionId
          const submissions = Array.isArray(documentsResponse.data) ? documentsResponse.data : [];
          
          // Map the submission documents to the expected Document format
          const documents: ApiDocumentType[] = submissions.flatMap((submission: Submission) => 
            submission.documents.map((doc: SubmissionDocument) => {
              // Normalize the status to ensure consistent counting
              let normalizedStatus = (doc.status || 'pending').toLowerCase().trim();
              
              // Comprehensive status normalization
              if (normalizedStatus === 'review' || normalizedStatus === 'in_review' || normalizedStatus === 'under_review') {
                normalizedStatus = 'under_review';
              } else if (normalizedStatus === 'submitted' || normalizedStatus === 'new' || normalizedStatus === '' || 
                         normalizedStatus === 'upload' || normalizedStatus === 'uploaded' || !doc.status) {
                normalizedStatus = 'pending';
              } else if (normalizedStatus === 'approve' || normalizedStatus === 'accept' || normalizedStatus === 'accepted') {
                normalizedStatus = 'approved';
              } else if (normalizedStatus === 'reject' || normalizedStatus === 'deny' || normalizedStatus === 'denied') {
                normalizedStatus = 'rejected';
              } else if (normalizedStatus === 'resubmit' || normalizedStatus === 're-submit' || normalizedStatus === 'resubmission') {
                normalizedStatus = 'resubmitted';
              }
              
              console.log('Dashboard - Document', doc.documentName, 'original status:', doc.status, 'normalized:', normalizedStatus);
              
              return {
                _id: doc._id,
                title: doc.documentName || `${doc.documentType} Document`,
                vendorName: submission.vendor?.name || 'Unknown Vendor',
                submissionDate: doc.uploadDate || new Date().toISOString(),
                status: normalizedStatus as 'pending' | 'under_review' | 'approved' | 'rejected',
                documentType: doc.documentType,
                fileCount: 1,
                assignedTo: user?._id || '',
                vendorId: submission.vendor?._id || '',
                submissionId: submission._id,  // Add the submission ID to each document
                comments: []
              };
            })
          );
          
          console.log('Transformed documents with submissionIds:', documents);
          setDocuments(documents);
          
          // Process dashboard stats - backend returns { success: true, data: { stats: {...} } }
          const actualStats = dashboardData?.data?.stats || {};
          console.log('Dashboard stats from backend:', actualStats);
          console.log('Full dashboard response:', dashboardData);
          console.log('Submissions from backend:', submissions);
          
          // Create pending documents list from submissions
          const pendingDocs: PendingDocument[] = submissions
            .filter((submission: Submission) => 
              submission.documents && submission.documents.some((doc: SubmissionDocument) => {
                const normalizedStatus = (doc.status || 'pending').toLowerCase().trim();
                return normalizedStatus === 'pending' || normalizedStatus === 'under_review' || 
                       normalizedStatus === 'uploaded' || normalizedStatus === 'submitted' ||
                       normalizedStatus === 'new' || normalizedStatus === '' || !doc.status ||
                       normalizedStatus === 'upload';
              })
            )
            .flatMap((submission: Submission) => 
              submission.documents
                .filter((doc: SubmissionDocument) => {
                  const normalizedStatus = (doc.status || 'pending').toLowerCase().trim();
                  return normalizedStatus === 'pending' || normalizedStatus === 'under_review' || 
                         normalizedStatus === 'uploaded' || normalizedStatus === 'submitted' ||
                         normalizedStatus === 'new' || normalizedStatus === '' || !doc.status ||
                         normalizedStatus === 'upload';
                })
                .map((doc: SubmissionDocument) => {
                  const submissionDate = new Date(submission.createdAt || new Date());
                  const daysAgo = Math.floor((new Date().getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return {
                    _id: doc._id,
                    title: doc.documentName || `${doc.documentType} Document`,
                    documentType: doc.documentType,
                    submissionDate: submission.createdAt || new Date().toISOString(),
                    vendorName: submission.vendor?.name || 'Unknown Vendor',
                    urgency: daysAgo > 7 ? 'high' : daysAgo > 3 ? 'medium' : 'low',
                    daysAgo
                  } as PendingDocument;
                })
            );
          
          setPendingDocuments(pendingDocs);
          
          // Calculate document counts by status from actual documents
          const statusCounts = documents.reduce((acc, doc) => {
            acc[doc.status] = (acc[doc.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          console.log('Dashboard - Status counts:', statusCounts);
          console.log('Dashboard - Total documents:', documents.length);
          console.log('Dashboard - Document statuses:', documents.map(d => ({ title: d.title, status: d.status })));
          
          // Calculate document counts by vendor from actual documents
          const vendorCounts = documents.reduce((acc, doc) => {
            if (!acc[doc.vendorName]) {
              acc[doc.vendorName] = { pending: 0, approved: 0, rejected: 0 };
            }
            if (doc.status === 'pending' || doc.status === 'under_review') {
              acc[doc.vendorName].pending++;
            } else if (doc.status === 'approved') {
              acc[doc.vendorName].approved++;
            } else if (doc.status === 'rejected') {
              acc[doc.vendorName].rejected++;
            }
            return acc;
          }, {} as Record<string, { pending: number; approved: number; rejected: number }>);
          
          // Generate approvals by month from actual data (last 6 months)
          const monthlyApprovals = [];
          const currentDate = new Date();
          
          console.log('=== Monthly Approvals Debug ===');
          console.log('Total documents:', documents.length);
          console.log('Documents:', documents.map(d => ({ title: d.title, status: d.status, date: d.submissionDate })));
          
          // Count approved documents first
          const approvedDocs = documents.filter(doc => doc.status === 'approved');
          console.log('Approved documents:', approvedDocs.length);
          console.log('Approved docs details:', approvedDocs.map(d => ({ title: d.title, date: d.submissionDate })));
          
          for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('en', { month: 'short' });
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            console.log(`Processing ${monthName} ${date.getFullYear()} (${monthYear})`);
            
            const approvedDocsInMonth = documents.filter(doc => {
              if (doc.status !== 'approved') return false;
              
              const docDate = new Date(doc.submissionDate);
              if (isNaN(docDate.getTime())) {
                console.log('Invalid date:', doc.submissionDate);
                return false;
              }
              
              const docMonthYear = `${docDate.getFullYear()}-${String(docDate.getMonth() + 1).padStart(2, '0')}`;
              const isInMonth = docDate.getMonth() === date.getMonth() && docDate.getFullYear() === date.getFullYear();
              
              if (isInMonth) {
                console.log(`✓ Found approved doc in ${monthName}:`, doc.title, `(${doc.submissionDate})`);
              }
              
              return isInMonth;
            }).length;
            
            console.log(`${monthName}: ${approvedDocsInMonth} approved documents`);
            monthlyApprovals.push({ month: monthName, count: approvedDocsInMonth });
          }
          
          console.log('Final monthly approvals data:', monthlyApprovals);
          console.log('=== End Monthly Approvals Debug ===');
          
          // Use backend stats if available, otherwise calculate from documents
          console.log('Dashboard - Final stats calculation:', {
            backendStats: actualStats,
            calculatedStats: statusCounts,
            pendingFromBackend: actualStats?.totalPending,
            pendingFromCalc: statusCounts['pending'],
            approvedFromBackend: actualStats?.totalApproved,
            approvedFromCalc: statusCounts['approved']
          });
          
          const finalStats = {
            totalPending: actualStats?.totalPending || statusCounts['pending'] || 0,
            totalApproved: actualStats?.totalApproved || statusCounts['approved'] || 0,
            totalRejected: actualStats?.totalRejected || statusCounts['rejected'] || 0,
            assignedToMe: actualStats?.assignedVendors || 0,
            completedReviews: (actualStats?.documentsApproved || 0) + (actualStats?.documentsRejected || 0) || (statusCounts['approved'] || 0) + (statusCounts['rejected'] || 0),
            mappedVendors: actualStats?.assignedVendors || 0,
            approvalsByMonth: monthlyApprovals.length > 0 && monthlyApprovals.some(m => m.count > 0) 
              ? monthlyApprovals 
              : [
                  { month: 'Jul', count: 0 },
                  { month: 'Aug', count: 0 },
                  { month: 'Sep', count: 0 },
                  { month: 'Oct', count: 0 },
                  { month: 'Nov', count: 0 },
                  { month: 'Dec', count: 0 }
                ],
            documentsByStatus: [
              { name: 'Pending', value: actualStats?.totalPending || statusCounts['pending'] || 0 },
              { name: 'Under Review', value: actualStats?.totalUnderReview || statusCounts['under_review'] || 0 },
              { name: 'Approved', value: actualStats?.totalApproved || statusCounts['approved'] || 0 },
              { name: 'Rejected', value: actualStats?.totalRejected || statusCounts['rejected'] || 0 }
            ],
            documentsByVendor: Object.entries(vendorCounts).map(([vendor, counts]) => ({
              vendor,
              ...counts
            }))
          };
          
          console.log('Final stats being set:', finalStats);
          console.log('Monthly approvals being passed to chart:', finalStats.approvalsByMonth);
          setStats(finalStats);
          
          setPendingApprovals([]);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error message:', err.message);
        setError(`Failed to fetch dashboard data: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Colors for charts - semantic colors for document statuses
  // [Pending, Under Review, Approved, Rejected]
  const COLORS = ['#f59e0b', '#0976ce', '#16a34a', '#dc2626'];
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

  // Filter and search documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Handle document review
  const handleDocumentReview = async (documentId: string, status: 'approved' | 'rejected') => {
    try {
      if (!selectedDocument) {
        setError('No document selected for review');
        return;
      }
      
      // Debug log to verify document data
      console.log('Selected document for review:', selectedDocument);
      
      // Check if submissionId exists in the document
      if (!selectedDocument.submissionId) {
        setError('Missing submission ID. Please try selecting the document again.');
        console.error('Document missing submissionId:', selectedDocument);
        return;
      }

      // Log the IDs being used for the API call
      console.log('Making API call with:', { 
        submissionId: selectedDocument.submissionId, 
        documentId: documentId 
      });

      // Update document status using the new API (which requires submissionId and documentId)
      await apiService.documents.updateDocumentStatus(
        selectedDocument.submissionId, 
        documentId, 
        {
          status,
          remarks: reviewComment,
          reviewerId: user?._id
        }
      );

      // Send notification with the updated document information
      await apiService.notifications.send({
        documentId,
        submissionId: selectedDocument.submissionId,
        status,
        comment: reviewComment,
        recipientId: selectedDocument?.vendorId
      });

      setSuccess(`Document successfully ${status}`);
      setSelectedDocument(null);
      setReviewComment('');
      
      // Refresh documents list with the new API
      if (user?._id) {
        const response = await apiService.documents.getConsultantSubmissions({ 
          consultantId: user._id,
          status: 'pending'
        });
        
        // Transform the response to ensure each document has its submissionId
        const submissions = Array.isArray(response.data) ? response.data : [];
        
        // Map the submission documents to the expected Document format
        const updatedDocuments: ApiDocumentType[] = submissions.flatMap((submission: Submission) => 
          submission.documents.map((doc: SubmissionDocument) => ({
            _id: doc._id,
            title: doc.documentName || `${doc.documentType} Document`,
            vendorName: submission.vendor?.name || 'Unknown Vendor',
            submissionDate: doc.uploadDate || new Date().toISOString(),
            status: doc.status as 'pending' | 'under_review' | 'approved' | 'rejected',
            documentType: doc.documentType,
            fileCount: 1,
            assignedTo: user?._id || '',
            vendorId: submission.vendor?._id || '',
            submissionId: submission._id,  // Add the submission ID to each document
            comments: []
          }))
        );
        
        setDocuments(updatedDocuments);
      }
    } catch (err) {
      setError('Failed to review document');
      console.error(err);
    }
  };

  // Render loading skeleton
  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="skeleton line w-1/4 h-8 mb-6" />
          
          <div className="flex flex-wrap gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton card" />
            ))}
          </div>
          
          <div className="flex flex-wrap gap-6 mb-8">
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
      <div className="p-6">
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Consultant Dashboard - Document Management
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="flex flex-wrap gap-6 mb-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeInUp} className="flex-1 basis-64 min-w-[250px]">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={handlePendingReviewClick}>
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mr-4">
                  <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Pending Review</p>
                  <h3 className="text-2xl font-bold">{stats.totalPending}</h3>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeInUp} className="flex-1 basis-64 min-w-[250px]">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={handleApprovedClick}>
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-4">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Approved</p>
                  <h3 className="text-2xl font-bold">{stats.totalApproved}</h3>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeInUp} className="flex-1 basis-64 min-w-[250px]">
            <Card>
              <div className="flex items-center">
                <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 mr-4">
                  <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Rejected</p>
                  <h3 className="text-2xl font-bold">{stats.totalRejected}</h3>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={fadeInUp} className="flex-1 basis-64 min-w-[250px]">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={handleMappedVendorsClick}>
              <div className="flex items-center">
                <div className="rounded-full bg-indigo-100 dark:bg-indigo-900 p-3 mr-4">
                  <UserGroupIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Mapped Vendors</p>
                  <h3 className="text-2xl font-bold">{stats.mappedVendors}</h3>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-wrap gap-6 mb-8">
          {/* Document Status Chart */}
          <motion.div 
            className="flex-1 basis-[calc(50%-12px)] min-w-[300px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Document Status</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Overview of document reviews</p>
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
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Monthly Approvals Chart */}
          <motion.div 
            className="flex-1 basis-[calc(50%-12px)] min-w-[300px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Monthly Approvals</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Document approvals by month</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.approvalsByMonth}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0976ce" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Document List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Documents</h2>
            <div className="space-y-6">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.title}</h3>
                      <p className="text-sm text-gray-600">Vendor: {doc.vendorName}</p>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(doc.submissionDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">Files: {doc.fileCount}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge
                        variant={
                          doc.status === 'approved' ? 'success' :
                          doc.status === 'rejected' ? 'danger' :
                          doc.status === 'under_review' ? 'warning' : 'info'
                        }
                      >
                        {doc.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDocument(doc)}
                      >
                        Review
                      </Button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {doc.comments.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Comments</h4>
                      <div className="space-y-2">
                        {doc.comments.map((comment) => (
                          <div key={comment.id} className="text-sm">
                            <p className="text-gray-600">
                              <span className="font-medium">{comment.author}</span>{' '}
                              <span className="text-gray-400">
                                {new Date(comment.timestamp).toLocaleString()}
                              </span>
                            </p>
                            <p className="text-gray-800">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* After the Document List section, add Communication and Audit Trail */}
        {selectedDocument && (
          <div className="mt-8 flex flex-wrap gap-6">
            <MessageSystem
              documentId={selectedDocument._id}
              vendorId={selectedDocument.vendorId}
              className="flex-1 basis-[calc(50%-12px)] min-w-[300px]"
            />
            <DocumentAuditTrail
              documentId={selectedDocument._id}
              className="flex-1 basis-[calc(50%-12px)] min-w-[300px]"
            />
          </div>
        )}

        {/* Review Modal */}
        {selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Review Document</h2>
              <div className="mb-4">
                <h3 className="font-medium text-gray-900">{selectedDocument.title}</h3>
                <p className="text-sm text-gray-600">Vendor: {selectedDocument.vendorName}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Comment
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your review comments..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDocument(null);
                    setReviewComment('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDocumentReview(selectedDocument._id, 'rejected')}
                >
                  Reject
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleDocumentReview(selectedDocument._id, 'approved')}
                >
                  Approve
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ConsultantDashboard; 
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../../utils/api';
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  UserPlusIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Table from '../../../components/ui/Table';
import Dropdown from '../../../components/ui/Dropdown';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Pagination from '../../../components/ui/Pagination';

interface Consultant {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  metrics: {
    assignedVendors: number;
    processedDocuments: number;
    approvedDocuments: number;
    rejectedDocuments: number;
    approvalRate: number;
    avgResponseTime: number;
  };
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const ConsultantsList: React.FC = () => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentConsultant, setCurrentConsultant] = useState<Consultant | null>(null);
  const [selectedConsultants, setSelectedConsultants] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Load consultants data
  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.users.getConsultantsWithAnalytics();
        
        if (response.data.success) {
          setConsultants(response.data.data);
          setTotalPages(Math.ceil(response.data.data.length / 10)); // Assuming 10 items per page
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load consultants');
        console.error('Error fetching consultants:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConsultants();
  }, []);
  
  // Filtered consultants based on search and status
  const filteredConsultants = consultants.filter(consultant => {
    const matchesSearch = 
      searchQuery === '' || 
      consultant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultant.email.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && consultant.isActive) ||
      (statusFilter === 'inactive' && !consultant.isActive);
      
    return matchesSearch && matchesStatus;
  });
  
  // Paginate consultants
  const paginatedConsultants = filteredConsultants.slice((page - 1) * 10, page * 10);
  
  // Handle delete consultant
  const handleDeleteClick = (consultant: Consultant) => {
    setCurrentConsultant(consultant);
    setShowDeleteModal(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!currentConsultant) return;
    
    try {
      const response = await apiService.users.delete(currentConsultant._id);
      
      if (response.data.success) {
        setConsultants(prev => prev.filter(c => c._id !== currentConsultant._id));
        setShowDeleteModal(false);
        setCurrentConsultant(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete consultant');
      console.error('Error deleting consultant:', err);
    }
  };
  
  // Handle toggle active status
  const handleToggleStatus = async (consultant: Consultant) => {
    try {
      let response;
      if (consultant.isActive) {
        response = await apiService.users.deactivate(consultant._id);
      } else {
        response = await apiService.users.activate(consultant._id);
      }
      
      if (response.data.success) {
        setConsultants(prev => 
          prev.map(c => 
            c._id === consultant._id ? { ...c, isActive: !c.isActive } : c
          )
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update consultant status');
      console.error('Error updating consultant status:', err);
    }
  };
  
  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedConsultants.length === 0) return;
    
    try {
      const response = await apiService.users.bulkUpdate(selectedConsultants, action);
      
      if (response.data.success) {
        // Refresh the list after bulk action
        const updatedConsultants = consultants.map(consultant => {
          if (selectedConsultants.includes(consultant._id)) {
            if (action === 'activate') {
              return { ...consultant, isActive: true };
            } else if (action === 'deactivate') {
              return { ...consultant, isActive: false };
            }
          }
          return consultant;
        });
        
        // Remove deleted consultants if action was 'delete'
        if (action === 'delete') {
          setConsultants(consultants.filter(c => !selectedConsultants.includes(c._id)));
        } else {
          setConsultants(updatedConsultants);
        }
        
        // Clear selection
        setSelectedConsultants([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} consultants`);
      console.error(`Error during bulk ${action}:`, err);
    }
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectedConsultants.length === paginatedConsultants.length) {
      setSelectedConsultants([]);
    } else {
      setSelectedConsultants(paginatedConsultants.map(c => c._id));
    }
  };
  
  // Handle export
  const handleExport = async (format: string) => {
    try {
      const response = await apiService.users.exportUsers('consultant', format);
      
      if (response.data.success) {
        // Create a download link
        const a = document.createElement('a');
        a.href = response.data.data;
        a.download = `consultants_export_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export consultants');
      console.error('Error exporting consultants:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      {error && (
        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      )}
      
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center">
              <UserGroupIcon className="mr-2 h-5 w-5 text-neutral-500" />
              Consultant Management
            </h2>
            
            <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
              <Button
                leftIcon={<UserPlusIcon className="h-5 w-5" />}
                size="sm"
                as={Link}
                to="/users/new?role=consultant"
              >
                Add Consultant
              </Button>
              
              <Dropdown
                trigger={
                  <Button
                    leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
                    variant="outline"
                    size="sm"
                  >
                    Export
                  </Button>
                }
                items={[
                  {
                    id: "export-csv",
                    label: 'Export as CSV',
                    onClick: () => handleExport('csv')
                  },
                  {
                    id: "export-excel",
                    label: 'Export as Excel',
                    onClick: () => handleExport('excel')
                  }
                ]}
              />
              
              {selectedConsultants.length > 0 && (
                <Dropdown
                  trigger={
                    <Button
                      size="sm"
                      variant="secondary"
                    >
                      Bulk Actions ({selectedConsultants.length})
                    </Button>
                  }
                  items={[
                    {
                      id: "bulk-activate",
                      label: 'Activate Selected',
                      onClick: () => handleBulkAction('activate')
                    },
                    {
                      id: "bulk-deactivate",
                      label: 'Deactivate Selected',
                      onClick: () => handleBulkAction('deactivate')
                    },
                    {
                      id: "bulk-delete",
                      label: 'Delete Selected',
                      onClick: () => handleBulkAction('delete'),
                      className: 'text-red-600 hover:bg-red-50'
                    }
                  ]}
                />
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search consultants..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="sm:w-60">
              <Dropdown
                trigger={
                  <Button
                    leftIcon={<FunnelIcon className="h-5 w-5" />}
                    variant="outline"
                    className="w-full justify-between"
                  >
                    {statusFilter === 'all' 
                      ? 'All Status' 
                      : statusFilter === 'active' 
                        ? 'Active Only' 
                        : 'Inactive Only'}
                  </Button>
                }
                items={[
                  {
                    id: "status-all",
                    label: 'All Status',
                    onClick: () => setStatusFilter('all')
                  },
                  {
                    id: "status-active",
                    label: 'Active Only',
                    onClick: () => setStatusFilter('active')
                  },
                  {
                    id: "status-inactive",
                    label: 'Inactive Only',
                    onClick: () => setStatusFilter('inactive')
                  }
                ]}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedConsultants.length === paginatedConsultants.length && paginatedConsultants.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                  </Table.Cell>
                  <Table.Cell>Consultant</Table.Cell>
                  <Table.Cell>Status</Table.Cell>
                  <Table.Cell>Assigned Vendors</Table.Cell>
                  <Table.Cell>Documents Processed</Table.Cell>
                  <Table.Cell>Approval Rate</Table.Cell>
                  <Table.Cell>Avg. Response Time</Table.Cell>
                  <Table.Cell>Actions</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {paginatedConsultants.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={8} className="text-center py-8 text-neutral-500">
                      No consultants found. Try adjusting your filters or add a new consultant.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  paginatedConsultants.map(consultant => (
                    <Table.Row key={consultant._id}>
                      <Table.Cell>
                        <input
                          type="checkbox"
                          checked={selectedConsultants.includes(consultant._id)}
                          onChange={() => {
                            if (selectedConsultants.includes(consultant._id)) {
                              setSelectedConsultants(prev => prev.filter(id => id !== consultant._id));
                            } else {
                              setSelectedConsultants(prev => [...prev, consultant._id]);
                            }
                          }}
                          className="rounded border-neutral-300 text-primary focus:ring-primary"
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{consultant.name}</p>
                          <p className="text-sm text-neutral-500">{consultant.email}</p>
                          {consultant.phone && (
                            <p className="text-sm text-neutral-500">{consultant.phone}</p>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          variant={consultant.isActive ? 'success' : 'default'}
                        >
                          {consultant.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 text-neutral-500 mr-1" />
                          <span>{consultant.metrics.assignedVendors}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {consultant.metrics.processedDocuments}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          variant={
                            consultant.metrics.approvalRate >= 80 ? 'success' :
                            consultant.metrics.approvalRate >= 50 ? 'warning' : 'danger'
                          }
                        >
                          {consultant.metrics.approvalRate}%
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        {consultant.metrics.avgResponseTime} hrs
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            as={Link}
                            to={`/users/${consultant._id}`}
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            as={Link}
                            to={`/users/${consultant._id}/edit`}
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title={consultant.isActive ? "Deactivate" : "Activate"}
                            onClick={() => handleToggleStatus(consultant)}
                          >
                            {consultant.isActive ? 
                              <XMarkIcon className="h-5 w-5 text-red-500" /> : 
                              <CheckIcon className="h-5 w-5 text-green-500" />
                            }
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Delete"
                            onClick={() => handleDeleteClick(consultant)}
                          >
                            <TrashIcon className="h-5 w-5 text-red-500" />
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </Card>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Consultant"
      >
        <div className="p-6">
          <p className="mb-4">
            Are you sure you want to delete consultant <strong>{currentConsultant?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete Consultant
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default ConsultantsList; 
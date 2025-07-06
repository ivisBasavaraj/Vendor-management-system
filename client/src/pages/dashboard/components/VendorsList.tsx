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
  BuildingOfficeIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarDaysIcon,
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
import Select from '../../../components/ui/Select';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  isActive: boolean;
  assignedConsultant: {
    _id: string;
    name: string;
    email: string;
  } | null;
  analytics: {
    totalDocuments: number;
    approvedDocuments: number;
    pendingDocuments: number;
    rejectedDocuments: number;
    complianceRate: number;
    lastActivity: string;
  };
}

interface Consultant {
  _id: string;
  name: string;
  email: string;
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const VendorsList: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [consultantFilter, setConsultantFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Load vendors and consultants data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch vendors with analytics
        const vendorsResponse = await apiService.users.getVendorsWithAnalytics();
        
        if (vendorsResponse.data.success) {
          setVendors(vendorsResponse.data.data);
          setTotalPages(Math.ceil(vendorsResponse.data.data.length / 10)); // Assuming 10 items per page
        }
        
        // Fetch consultants for dropdown
        const consultantsResponse = await apiService.users.getConsultants();
        
        if (consultantsResponse.data.success) {
          setConsultants(consultantsResponse.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filtered vendors based on search, status, compliance, and consultant
  const filteredVendors = vendors.filter(vendor => {
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.company && vendor.company.toLowerCase().includes(searchQuery.toLowerCase()));
      
    // Status filter
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && vendor.isActive) ||
      (statusFilter === 'inactive' && !vendor.isActive);
      
    // Compliance filter
    const matchesCompliance = 
      complianceFilter === 'all' ||
      (complianceFilter === 'high' && vendor.analytics.complianceRate >= 80) ||
      (complianceFilter === 'medium' && vendor.analytics.complianceRate >= 50 && vendor.analytics.complianceRate < 80) ||
      (complianceFilter === 'low' && vendor.analytics.complianceRate < 50);
      
    // Consultant filter
    const matchesConsultant = 
      consultantFilter === 'all' ||
      (consultantFilter === 'unassigned' && !vendor.assignedConsultant) ||
      (vendor.assignedConsultant && vendor.assignedConsultant._id === consultantFilter);
      
    return matchesSearch && matchesStatus && matchesCompliance && matchesConsultant;
  });
  
  // Paginate vendors
  const paginatedVendors = filteredVendors.slice((page - 1) * 10, page * 10);
  
  // Handle delete vendor
  const handleDeleteClick = (vendor: Vendor) => {
    setCurrentVendor(vendor);
    setShowDeleteModal(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!currentVendor) return;
    
    try {
      const response = await apiService.users.delete(currentVendor._id);
      
      if (response.data.success) {
        setVendors(prev => prev.filter(v => v._id !== currentVendor._id));
        setShowDeleteModal(false);
        setCurrentVendor(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vendor');
      console.error('Error deleting vendor:', err);
    }
  };
  
  // Handle toggle active status
  const handleToggleStatus = async (vendor: Vendor) => {
    try {
      let response;
      if (vendor.isActive) {
        response = await apiService.users.deactivate(vendor._id);
      } else {
        response = await apiService.users.activate(vendor._id);
      }
      
      if (response.data.success) {
        setVendors(prev => 
          prev.map(v => 
            v._id === vendor._id ? { ...v, isActive: !v.isActive } : v
          )
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update vendor status');
      console.error('Error updating vendor status:', err);
    }
  };
  
  // Handle assign consultant
  const handleAssignClick = (vendor: Vendor) => {
    setCurrentVendor(vendor);
    setSelectedConsultant(vendor.assignedConsultant?._id || '');
    setShowAssignModal(true);
  };
  
  const handleAssignConfirm = async () => {
    if (!currentVendor) return;
    
    try {
      const response = await apiService.users.assignConsultant(
        currentVendor._id,
        selectedConsultant || ''
      );
      
      if (response.data.success) {
        // Update vendor in state
        setVendors(prev => 
          prev.map(v => {
            if (v._id === currentVendor._id) {
              // Find the assigned consultant
              const assigned = selectedConsultant 
                ? consultants.find(c => c._id === selectedConsultant) || null
                : null;
                
              return { 
                ...v, 
                assignedConsultant: assigned 
                  ? { _id: assigned._id, name: assigned.name, email: assigned.email }
                  : null
              };
            }
            return v;
          })
        );
        
        setShowAssignModal(false);
        setCurrentVendor(null);
        setSelectedConsultant('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign consultant');
      console.error('Error assigning consultant:', err);
    }
  };
  
  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedVendors.length === 0) return;
    
    try {
      if (action === 'assignConsultant') {
        // Show assign modal for bulk assignment
        setShowAssignModal(true);
        return;
      }
      
      const response = await apiService.users.bulkUpdate(selectedVendors, action);
      
      if (response.data.success) {
        // Refresh the list after bulk action
        if (action === 'delete') {
          setVendors(vendors.filter(v => !selectedVendors.includes(v._id)));
        } else {
          const updatedVendors = vendors.map(vendor => {
            if (selectedVendors.includes(vendor._id)) {
              if (action === 'activate') {
                return { ...vendor, isActive: true };
              } else if (action === 'deactivate') {
                return { ...vendor, isActive: false };
              }
            }
            return vendor;
          });
          
          setVendors(updatedVendors);
        }
        
        // Clear selection
        setSelectedVendors([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} vendors`);
      console.error(`Error during bulk ${action}:`, err);
    }
  };
  
  // Handle bulk assign
  const handleBulkAssignConfirm = async () => {
    if (selectedVendors.length === 0) return;
    
    try {
      const response = await apiService.users.bulkAssignConsultant(selectedVendors, selectedConsultant);
      
      if (response.data.success) {
        // Update vendors in state
        setVendors(prev => 
          prev.map(v => {
            if (selectedVendors.includes(v._id)) {
              // Find the assigned consultant
              const assigned = selectedConsultant 
                ? consultants.find(c => c._id === selectedConsultant) || null
                : null;
                
              return { 
                ...v, 
                assignedConsultant: assigned 
                  ? { _id: assigned._id, name: assigned.name, email: assigned.email }
                  : null
              };
            }
            return v;
          })
        );
        
        setShowAssignModal(false);
        setSelectedConsultant('');
        setSelectedVendors([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign consultant');
      console.error('Error assigning consultant:', err);
    }
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectedVendors.length === paginatedVendors.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(paginatedVendors.map(v => v._id));
    }
  };
  
  // Handle export
  const handleExport = async (format: string) => {
    try {
      const response = await apiService.users.exportUsers('vendor', format);
      
      if (response.data.success) {
        // Create a download link
        const a = document.createElement('a');
        a.href = response.data.data;
        a.download = `vendors_export_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export vendors');
      console.error('Error exporting vendors:', err);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
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
              <BuildingOfficeIcon className="mr-2 h-5 w-5 text-neutral-500" />
              Vendor Management
            </h2>
            
            <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
              <Button
                leftIcon={<UserPlusIcon className="h-5 w-5" />}
                size="sm"
                as={Link}
                to="/users/new?role=vendor"
              >
                Add Vendor
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
              
              {selectedVendors.length > 0 && (
                <Dropdown
                  trigger={
                    <Button
                      size="sm"
                      variant="secondary"
                    >
                      Bulk Actions ({selectedVendors.length})
                    </Button>
                  }
                  items={[
                    {
                      id: "bulk-assign",
                      label: 'Assign Consultant',
                      onClick: () => handleBulkAction('assignConsultant')
                    },
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
                placeholder="Search vendors..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:w-3/5">
              <div>
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
              
              <div>
                <Dropdown
                  trigger={
                    <Button
                      leftIcon={<DocumentTextIcon className="h-5 w-5" />}
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {complianceFilter === 'all' 
                        ? 'All Compliance' 
                        : `${complianceFilter.charAt(0).toUpperCase() + complianceFilter.slice(1)} Compliance`}
                    </Button>
                  }
                  items={[
                    {
                      id: "compliance-all",
                      label: 'All Compliance',
                      onClick: () => setComplianceFilter('all')
                    },
                    {
                      id: "compliance-high",
                      label: 'High Compliance (≥80%)',
                      onClick: () => setComplianceFilter('high')
                    },
                    {
                      id: "compliance-medium",
                      label: 'Medium Compliance (50-79%)',
                      onClick: () => setComplianceFilter('medium')
                    },
                    {
                      id: "compliance-low",
                      label: 'Low Compliance (<50%)',
                      onClick: () => setComplianceFilter('low')
                    }
                  ]}
                />
              </div>
              
              <div>
                <Select
                  value={consultantFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setConsultantFilter(e.target.value)}
                  className="w-full h-10"
                >
                  <option value="all">All Consultants</option>
                  <option value="unassigned">Unassigned</option>
                  {consultants.map(consultant => (
                    <option key={consultant._id} value={consultant._id}>
                      {consultant.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedVendors.length === paginatedVendors.length && paginatedVendors.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                  </Table.Cell>
                  <Table.Cell>Vendor</Table.Cell>
                  <Table.Cell>Status</Table.Cell>
                  <Table.Cell>Assigned Consultant</Table.Cell>
                  <Table.Cell>Documents</Table.Cell>
                  <Table.Cell>Compliance</Table.Cell>
                  <Table.Cell>Last Activity</Table.Cell>
                  <Table.Cell>Actions</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {paginatedVendors.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={8} className="text-center py-8 text-neutral-500">
                      No vendors found. Try adjusting your filters or add a new vendor.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  paginatedVendors.map(vendor => (
                    <Table.Row key={vendor._id}>
                      <Table.Cell>
                        <input
                          type="checkbox"
                          checked={selectedVendors.includes(vendor._id)}
                          onChange={() => {
                            if (selectedVendors.includes(vendor._id)) {
                              setSelectedVendors(prev => prev.filter(id => id !== vendor._id));
                            } else {
                              setSelectedVendors(prev => [...prev, vendor._id]);
                            }
                          }}
                          className="rounded border-neutral-300 text-primary focus:ring-primary"
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{vendor.name}</p>
                          <p className="text-sm text-neutral-500">{vendor.email}</p>
                          {vendor.company && (
                            <p className="text-sm text-neutral-500">
                              <BuildingOfficeIcon className="h-3.5 w-3.5 inline mr-1" />
                              {vendor.company}
                            </p>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          variant={vendor.isActive ? 'success' : 'default'}
                        >
                          {vendor.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        {vendor.assignedConsultant ? (
                          <div>
                            <p className="text-sm font-medium">{vendor.assignedConsultant.name}</p>
                            <p className="text-xs text-neutral-500">{vendor.assignedConsultant.email}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-neutral-500">Unassigned</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-col text-sm">
                          <span>
                            Total: {vendor.analytics.totalDocuments}
                          </span>
                          <span className="text-green-600">
                            Approved: {vendor.analytics.approvedDocuments}
                          </span>
                          <span className="text-amber-600">
                            Pending: {vendor.analytics.pendingDocuments}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          variant={
                            vendor.analytics.complianceRate >= 80 ? 'success' :
                            vendor.analytics.complianceRate >= 50 ? 'warning' : 'danger'
                          }
                        >
                          {vendor.analytics.complianceRate}%
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center text-sm text-neutral-500">
                          <CalendarDaysIcon className="h-4 w-4 mr-1" />
                          {formatDate(vendor.analytics.lastActivity)}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            as={Link}
                            to={`/users/${vendor._id}`}
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            as={Link}
                            to={`/users/${vendor._id}/edit`}
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Assign Consultant"
                            onClick={() => handleAssignClick(vendor)}
                          >
                            <UserIcon className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title={vendor.isActive ? "Deactivate" : "Activate"}
                            onClick={() => handleToggleStatus(vendor)}
                          >
                            {vendor.isActive ? 
                              <XMarkIcon className="h-5 w-5 text-red-500" /> : 
                              <CheckIcon className="h-5 w-5 text-green-500" />
                            }
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Delete"
                            onClick={() => handleDeleteClick(vendor)}
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
        title="Delete Vendor"
      >
        <div className="p-6">
          <p className="mb-4">
            Are you sure you want to delete vendor <strong>{currentVendor?.name}</strong>? This action cannot be undone.
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
              Delete Vendor
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Assign Consultant Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setCurrentVendor(null);
          setSelectedConsultant('');
        }}
        title={selectedVendors.length > 0 ? "Assign Consultant to Selected Vendors" : "Assign Consultant"}
      >
        <div className="p-6">
          <p className="mb-4">
            {selectedVendors.length > 0
              ? `Select a consultant to assign to ${selectedVendors.length} selected vendors:`
              : `Select a consultant to assign to ${currentVendor?.name}:`
            }
          </p>
          
          <div className="mb-6">
            <Select
              className="w-full"
              value={selectedConsultant}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedConsultant(e.target.value)}
            >
              <option value="">Unassigned</option>
              {consultants.map(consultant => (
                <option key={consultant._id} value={consultant._id}>
                  {consultant.name} ({consultant.email})
                </option>
              ))}
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAssignModal(false);
                setCurrentVendor(null);
                setSelectedConsultant('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={selectedVendors.length > 0 ? handleBulkAssignConfirm : handleAssignConfirm}
            >
              Assign Consultant
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default VendorsList; 
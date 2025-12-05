import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  FileText,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  MoreVertical,
  Users,
  TrendingUp,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  CheckCheck,
  X,
  Settings,
  BarChart3
} from 'lucide-react';
import { kycHelpers } from '@/utils/kycHelpers';
import KYCReviewModal from './KYCReviewModal';

/**
 * Comprehensive KYC Management Component
 * Provides filtering, bulk operations, pagination, and detailed review capabilities
 */
const KYCManagement = ({ adminId = null }) => {
  // State management
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering and search state
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(20);
  
  // Selection and bulk operations
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  
  // Modal state
  const [selectedKycRequest, setSelectedKycRequest] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Statistics state
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('requests');

  // Load KYC requests with filters
  const loadKycRequests = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const { kycRequests: requests, totalCount: count, error: fetchError } = 
        await kycHelpers.fetchKycRequests(statusFilter, {
          limit: itemsPerPage,
          offset,
          search: searchTerm
        });

      if (fetchError) {
        setError(`Failed to load KYC requests: ${fetchError}`);
        return;
      }

      setKycRequests(requests);
      setTotalCount(count);
    } catch (err) {
      setError(`Error loading KYC requests: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, currentPage, itemsPerPage]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const { stats: kycStats, error: statsError } = await kycHelpers.getKycStats();
      
      if (statsError) {
        console.warn('Failed to load KYC stats:', statsError);
      } else {
        setStats(kycStats);
      }
    } catch (err) {
      console.warn('Error loading KYC stats:', err);
    }
  }, []);

  // Initial load and filters effect
  useEffect(() => {
    loadKycRequests();
  }, [loadKycRequests]);

  // Load stats on component mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedItems(new Set());
  }, [statusFilter, searchTerm, dateFilter]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadKycRequests();
      } else {
        setCurrentPage(1); // This will trigger loadKycRequests via the effect above
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(new Set(kycRequests.map(req => req.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id, checked) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedItems(newSelection);
  };

  // Bulk action handlers
  const handleBulkAction = async () => {
    if (!bulkAction || selectedItems.size === 0) return;

    setBulkActionLoading(true);
    setError('');

    try {
      const userIds = Array.from(selectedItems);
      const { success, error: bulkError } = await kycHelpers.bulkUpdateKycStatus(
        userIds,
        bulkAction,
        bulkNotes,
        adminId
      );

      if (success) {
        // Refresh the list
        await loadKycRequests();
        await loadStats();
        
        // Clear selections and close dialog
        setSelectedItems(new Set());
        setShowBulkDialog(false);
        setBulkNotes('');
      } else {
        setError(`Bulk action failed: ${bulkError}`);
      }
    } catch (err) {
      setError(`Bulk action error: ${err.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Status update handler from modal
  const handleStatusUpdate = async (userId, newStatus) => {
    // Refresh the list to show updated status
    await loadKycRequests();
    await loadStats();
  };

  // Review modal handlers
  const openReviewModal = (kycRequest) => {
    setSelectedKycRequest(kycRequest);
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setSelectedKycRequest(null);
    setShowReviewModal(false);
  };

  // Status styling helpers
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  // Pagination helpers
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  const handlePageChange = (newPage) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  // Statistics cards
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total KYC</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Verified users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Need resubmission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approval_rate}%</div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Filter controls
  const renderFilters = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Name, email, grant number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <Label>Time Period</Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Label>Actions</Label>
            <div className="flex space-x-2">
              <Button onClick={loadKycRequests} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700">
              {selectedItems.size} item(s) selected
            </span>
            <div className="flex space-x-2">
              <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setBulkAction('approved')}>
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Bulk Approve
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Action Confirmation</DialogTitle>
                    <DialogDescription>
                      You are about to {bulkAction} {selectedItems.size} KYC request(s).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Action</Label>
                      <Select value={bulkAction} onValueChange={setBulkAction}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">Approve All</SelectItem>
                          <SelectItem value="rejected">Reject All</SelectItem>
                          <SelectItem value="pending">Reset to Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notes (optional)</Label>
                      <Input
                        value={bulkNotes}
                        onChange={(e) => setBulkNotes(e.target.value)}
                        placeholder="Add notes for this bulk action..."
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkAction} disabled={bulkActionLoading}>
                        {bulkActionLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCheck className="h-4 w-4 mr-2" />
                        )}
                        Confirm {bulkAction}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button size="sm" variant="outline" onClick={() => setBulkAction('rejected')}>
                <X className="h-4 w-4 mr-2" />
                Bulk Reject
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Main KYC requests table
  const renderKycTable = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>KYC Requests ({totalCount})</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{kycRequests.length} of {totalCount}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading KYC requests...</span>
          </div>
        ) : error ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        ) : kycRequests.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No KYC Requests</h3>
            <p className="text-gray-600">No KYC requests match your current filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header */}
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                checked={selectedItems.size === kycRequests.length && kycRequests.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <div className="flex-1 grid grid-cols-6 gap-4 text-sm font-medium text-gray-600">
                <span>User</span>
                <span>Grant Number</span>
                <span>Status</span>
                <span>Submitted</span>
                <span>Document</span>
                <span>Actions</span>
              </div>
            </div>

            {/* Table Rows */}
            {kycRequests.map((request) => (
              <div key={request.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={selectedItems.has(request.id)}
                  onCheckedChange={(checked) => handleSelectItem(request.id, checked)}
                />
                <div className="flex-1 grid grid-cols-6 gap-4 text-sm">
                  <div>
                    <div className="font-medium">{request.user.full_name}</div>
                    <div className="text-gray-500">{request.user.email}</div>
                  </div>
                  <div className="font-mono text-blue-600">
                    {request.user.grant_number}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(request.status)}
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="text-gray-600">
                    {new Date(request.submitted_at).toLocaleDateString()}
                  </div>
                  <div>
                    {request.has_document ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        No Document
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openReviewModal(request)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {startItem} to {endItem} of {totalCount} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold">KYC Management</h2>
        <p className="text-gray-600">Review and manage user KYC submissions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">KYC Requests</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          {renderStats()}
          {renderFilters()}
          {renderKycTable()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics & Reports
              </CardTitle>
              <CardDescription>
                Coming soon - Detailed analytics and reporting features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                This section will include detailed KYC analytics, compliance reports, 
                and trend analysis in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* KYC Review Modal */}
      <KYCReviewModal
        kycRequest={selectedKycRequest}
        isOpen={showReviewModal}
        onClose={closeReviewModal}
        onStatusUpdate={handleStatusUpdate}
        adminId={adminId}
      />
    </div>
  );
};

export default KYCManagement;
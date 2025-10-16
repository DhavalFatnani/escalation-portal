import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService } from '../services/ticketService';
import { attachmentService } from '../services/attachmentService';
import { adminService } from '../services/adminService';
import { useAuthStore } from '../stores/authStore';
import { ArrowLeft, Clock, User, AlertCircle, File, Download, Trash2, Paperclip, Eye, Zap } from 'lucide-react';
import { TicketStatus } from '../types';
import FileUpload from '../components/FileUpload';
import FilePreviewModal from '../components/FilePreviewModal';
import AdminStatusManager from '../components/AdminStatusManager';
import { getIssueTypeLabel } from '../utils/issueTypeLabels';
import { useModal } from '../hooks/useModal';
import Modal from '../components/Modal';

export default function TicketDetailPage() {
  const { ticketNumber } = useParams<{ ticketNumber: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [resolveRemarks, setResolveRemarks] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [acceptanceRemarks, setAcceptanceRemarks] = useState('');
  const [resolveFiles, setResolveFiles] = useState<File[]>([]);
  const [reopenFiles, setReopenFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState<any>(null);
  const [deletingAttachment, setDeletingAttachment] = useState<any>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showAdminStatusModal, setShowAdminStatusModal] = useState(false);
  
  // Modal system
  const { modalState, hideModal, showSuccess, showError, showDelete } = useModal();

  const { data: ticketData, isLoading } = useQuery({
    queryKey: ['ticket', ticketNumber],
    queryFn: () => ticketService.getTicket(ticketNumber!),
    enabled: !!ticketNumber,
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['ticket-activities', ticketNumber],
    queryFn: () => ticketService.getActivities(ticketNumber!),
    enabled: !!ticketNumber,
  });

  const { data: attachmentsData } = useQuery({
    queryKey: ['ticket-attachments', ticketNumber],
    queryFn: () => attachmentService.getAttachments(ticketNumber!),
    enabled: !!ticketNumber,
  });

  const resolveMutation = useMutation({
    mutationFn: async () => {
      // Upload resolution files FIRST (if any), before resolving ticket
      // This way if upload fails, ticket stays in "open" state
      if (resolveFiles.length > 0) {
        await attachmentService.uploadFiles(ticketNumber!, resolveFiles, 'resolution');
      }
      
      // Then resolve the ticket
      await ticketService.resolveTicket(ticketNumber!, { remarks: resolveRemarks });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketNumber] });
      queryClient.invalidateQueries({ queryKey: ['ticket-activities', ticketNumber] });
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', ticketNumber] });
      setResolveRemarks('');
      setResolveFiles([]);
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to resolve ticket');
    },
  });

  const requestDeletionMutation = useMutation({
    mutationFn: ({ attachmentId, reason }: { attachmentId: string; reason: string }) => 
      attachmentService.requestDeletion(attachmentId, reason),
    onSuccess: (data) => {
      setDeletingAttachment(null);
      setDeletionReason('');
      setError('');
      showSuccess('Deletion Request Submitted', data.message || 'Deletion request submitted successfully. You will be notified when approved.');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to submit deletion request.');
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ attachmentId, otp }: { attachmentId: string; otp: string }) => 
      attachmentService.deleteAttachment(attachmentId, otp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', ticketNumber] });
      setShowOTPModal(false);
      setDeletingAttachment(null);
      setOtpCode('');
      setError('');
      showSuccess('File Deleted', 'File deleted successfully!');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to delete attachment. Please check the OTP code.');
    },
  });

  // Categorize attachments by upload context and chronological order
  const categorizeAttachments = () => {
    if (!attachmentsData?.attachments || !activitiesData?.activities) {
      return { initial: [], primaryResolution: [], reopen: [], updatedResolution: [] };
    }

    const initial: any[] = [];
    const primaryResolution: any[] = [];
    const reopen: any[] = [];
    const updatedResolution: any[] = [];

    // Find the timestamp of the first reopen activity (if any)
    const sortedActivities = [...activitiesData.activities].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const firstReopenActivity = sortedActivities.find(
      (a) => a.action === 'reopened' || a.action === 'status_changed_to_open'
    );
    const reopenTime = firstReopenActivity ? new Date(firstReopenActivity.created_at).getTime() : null;

    attachmentsData.attachments.forEach((attachment: any) => {
      const attachmentTime = new Date(attachment.created_at).getTime();

      switch (attachment.upload_context) {
        case 'initial':
          initial.push(attachment);
          break;
        case 'resolution':
          // If there was a reopen, split resolution files into primary and updated
          if (reopenTime && attachmentTime < reopenTime) {
            primaryResolution.push(attachment);
          } else if (reopenTime && attachmentTime > reopenTime) {
            updatedResolution.push(attachment);
          } else {
            // No reopen, or exactly at reopen time - put in primary
            primaryResolution.push(attachment);
          }
          break;
        case 'reopen':
          reopen.push(attachment);
          break;
        default:
          // Fallback for 'additional' or unknown context
          updatedResolution.push(attachment);
          break;
      }
    });

    return { initial, primaryResolution, reopen, updatedResolution };
  };

  const { initial, primaryResolution, reopen, updatedResolution } = categorizeAttachments();

  // Get resolution info from ticket data
  const getResolutions = () => {
    if (!ticketData?.ticket) {
      return { primary: null, updated: null, hasReopen: false };
    }

    const ticket = ticketData.ticket;
    const hasReopen = !!ticket.reopen_reason;

    // If ticket has been reopened, we have separate primary and updated resolutions
    if (hasReopen) {
      return {
        primary: ticket.primary_resolution_remarks,
        updated: ticket.resolution_remarks,
        hasReopen: true
      };
    }

    // No reopen, just one resolution
    return {
      primary: null,
      updated: ticket.resolution_remarks,
      hasReopen: false
    };
  };

  const resolutionInfo = getResolutions();

  // Render attachment file component
  const renderAttachment = (attachment: any) => (
    <div
      key={attachment.id}
      className="flex items-start justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start flex-1 min-w-0">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
          <File className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate mb-1">
            {attachment.filename}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {attachment.file_size && (
              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded font-medium">
                {(attachment.file_size / 1024).toFixed(1)} KB
              </span>
            )}
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">
              {attachment.uploader_name || attachment.uploader_email}
            </span>
            {attachment.created_at && (
              <span className="text-gray-500">
                <Clock className="w-3 h-3 inline mr-1" />
                {new Date(attachment.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-3 flex-shrink-0">
        <button
          onClick={() => setPreviewAttachment(attachment)}
          className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
          title="Preview file"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDownload(attachment)}
          className="text-indigo-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
          title="Download file"
        >
          <Download className="w-4 h-4" />
        </button>
        {(user?.role === 'admin' || attachment.uploaded_by === user?.id || ticket?.created_by === user?.id) && (
          <>
            <button
              onClick={() => {
                setDeletingAttachment(attachment);
                setShowOTPModal(true);
              }}
              className="text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition-colors"
              title="Enter OTP to delete file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </button>
            <button
              onClick={() => setDeletingAttachment(attachment)}
              className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Request file deletion (requires team approval)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  const handleDownload = (attachment: any) => {
    try {
      const url = attachment.url;
      
      // Handle data URLs (base64)
      if (url.startsWith('data:')) {
        // Convert data URL to blob and download
        const arr = url.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = attachment.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } else {
        // Handle regular URLs (Supabase Storage)
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
      showError('Download Failed', 'Failed to download file. Please try again.');
    }
  };

  const reopenMutation = useMutation({
    mutationFn: async () => {
      // Upload reopen files FIRST (if any), before reopening ticket
      if (reopenFiles.length > 0) {
        await attachmentService.uploadFiles(ticketNumber!, reopenFiles, 'reopen');
      }
      
      // Then reopen the ticket
      await ticketService.reopenTicket(ticketNumber!, { reason: reopenReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketNumber] });
      queryClient.invalidateQueries({ queryKey: ['ticket-activities', ticketNumber] });
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', ticketNumber] });
      setReopenReason('');
      setReopenFiles([]);
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to reopen ticket');
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => ticketService.closeTicket(ticketNumber!, acceptanceRemarks || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketNumber] });
      queryClient.invalidateQueries({ queryKey: ['ticket-activities', ticketNumber] });
      setAcceptanceRemarks('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to close ticket');
    },
  });

  // Admin mutations
  const deleteTicketMutation = useMutation({
    mutationFn: () => adminService.deleteTicket(ticketNumber!),
    onSuccess: () => {
      navigate('/tickets');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to delete ticket');
    },
  });

  const adminStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: TicketStatus; reason: string }) => 
      adminService.forceStatusChange(ticketNumber!, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketNumber] });
      queryClient.invalidateQueries({ queryKey: ['ticket-activities', ticketNumber] });
      showSuccess('Status Changed', 'Ticket status has been updated successfully.');
    },
    onError: (err: any) => {
      showError('Status Change Failed', err.response?.data?.error || 'Failed to change ticket status.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading ticket...</div>
      </div>
    );
  }

  if (!ticketData?.ticket) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Ticket not found</div>
      </div>
    );
  }

  const ticket = ticketData.ticket;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'text-blue-700 bg-blue-100';
      case 'processed': return 'text-yellow-700 bg-yellow-100';
      case 'resolved': return 'text-green-700 bg-green-100';
      case 're-opened': return 'text-red-700 bg-red-100';
      case 'closed': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  // Bidirectional permissions:
  // - Admin can do everything
  // - Resolve: The opposite team can resolve (Ops resolves Growth tickets, Growth resolves Ops tickets)
  // - Reopen: Only the creator's team can reopen their own tickets
  // - Close: Only the creator's team can close their own tickets
  
  console.log('Permission Debug:', {
    userRole: user?.role,
    creatorRole: ticket.creator_role,
    ticketStatus: ticket.status,
    ticketNumber: ticket.ticket_number
  });
  
  const canResolve = user?.role === 'admin' 
    ? (ticket.status === 'open' || ticket.status === 're-opened')
    : (ticket.creator_role === 'growth' && user?.role === 'ops' && (ticket.status === 'open' || ticket.status === 're-opened')) ||
      (ticket.creator_role === 'ops' && user?.role === 'growth' && (ticket.status === 'open' || ticket.status === 're-opened'));
  
  const canReopen = user?.role === 'admin'
    ? ticket.status === 'processed'
    : user?.role === ticket.creator_role && ticket.status === 'processed';
  
  const canClose = user?.role === 'admin'
    ? ticket.status === 'processed'
    : user?.role === ticket.creator_role && ticket.status === 'processed';
  
  console.log('Permission Results:', { canResolve, canReopen, canClose });

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Admin Controls Bar */}
          {user?.role === 'admin' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="text-sm font-semibold text-purple-900">Admin Controls</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAdminStatusModal(true)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-700 bg-white border border-purple-300 rounded-md hover:bg-purple-50"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Manage Status
                  </button>
                  <button
                    onClick={() => {
                      showDelete(
                        'Delete Ticket',
                        `Are you sure you want to DELETE ticket ${ticket.ticket_number}?\n\nThis action cannot be undone and will remove:\n- The ticket\n- All activities\n- All attachments`,
                        () => {
                          const confirmation = prompt('Type DELETE to confirm:');
                          if (confirmation === 'DELETE') {
                            deleteTicketMutation.mutate();
                          } else {
                            showError('Deletion Cancelled', 'Please type "DELETE" exactly to confirm deletion.');
                          }
                        },
                        'Delete Ticket',
                        'Cancel'
                      );
                    }}
                    disabled={deleteTicketMutation.isPending}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {deleteTicketMutation.isPending ? 'Deleting...' : 'Delete Ticket'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Ticket Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {ticket.ticket_number}
                </h1>
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                {/* Ticket Flow Direction */}
                {ticket.creator_role && (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${
                    ticket.creator_role === 'growth' 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300'
                      : 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300'
                  }`}>
                    <span className={`px-2 py-1 rounded ${
                      ticket.creator_role === 'growth' ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'
                    }`}>
                      {ticket.creator_role.toUpperCase()} Team
                    </span>
                    <span className="text-gray-600">escalated to</span>
                    <span className={`px-2 py-1 rounded ${
                      ticket.creator_role === 'growth' ? 'bg-purple-200 text-purple-800' : 'bg-blue-200 text-blue-800'
                    }`}>
                      {ticket.creator_role === 'growth' ? 'OPS' : 'GROWTH'} Team
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {ticket.brand_name}
              </h2>
              
              {ticket.issue_type && (
                <div className="mb-3">
                  <span className="text-sm text-gray-600">Issue Type: </span>
                  <span className="text-sm text-gray-900 font-medium">
                    {getIssueTypeLabel(ticket.issue_type)}
                  </span>
                </div>
              )}

              {ticket.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>
              )}

              {ticket.expected_output && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Expected Output:</span> {ticket.expected_output}
                  </p>
                </div>
              )}

              {/* Initial Files */}
              {initial.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attached Files ({initial.length})
                  </h4>
                  <div className="space-y-2">
                    {initial.map(renderAttachment)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Primary Resolution (shown if reopen exists) */}
          {resolutionInfo.hasReopen && resolutionInfo.primary && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Primary Resolution
                </h3>
                <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                  Initial Fix
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {resolutionInfo.primary}
              </p>
              
              {/* Primary Resolution Files */}
              {primaryResolution.length > 0 && (
                <div className="mt-4 pt-4 border-t border-green-300">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Resolution Files ({primaryResolution.length})
                  </h4>
                  <div className="space-y-2">
                    {primaryResolution.map(renderAttachment)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reopen Reason */}
          {ticket.reopen_reason && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Issue Reopened
                  </h3>
                  <span className="px-3 py-1 bg-orange-600 text-white text-xs font-semibold rounded-full">
                    Reopen Reason
                  </span>
                </div>
                {ticket.status === 're-opened' && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full border border-yellow-300">
                    ⏳ Awaiting Updated Resolution
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                {ticket.reopen_reason}
              </p>

              {/* Reopen Files */}
              {reopen.length > 0 && (
                <div className="mt-4 pt-4 border-t border-orange-300">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Supporting Files ({reopen.length})
                  </h4>
                  <div className="space-y-2">
                    {reopen.map(renderAttachment)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Updated Resolution (shown if reopen exists AND ticket is resolved again) OR Resolution (shown if no reopen) */}
          {ticket.resolution_remarks && (ticket.status === 'processed' || ticket.status === 'resolved' || !resolutionInfo.hasReopen) && (
            <div className={`border rounded-lg p-6 ${
              resolutionInfo.hasReopen
                ? 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-300 shadow-md' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {resolutionInfo.hasReopen ? 'Updated Resolution' : 'Resolution'}
                </h3>
                {resolutionInfo.hasReopen && (
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    After Reopen
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                {ticket.resolution_remarks}
              </p>

              {/* Resolution Files (use appropriate set based on whether ticket was reopened) */}
              {(resolutionInfo.hasReopen ? updatedResolution : primaryResolution).length > 0 && (
                <div className={`mt-4 pt-4 ${
                  resolutionInfo.hasReopen ? 'border-t border-blue-300' : 'border-t border-green-300'
                }`}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Resolution Files ({(resolutionInfo.hasReopen ? updatedResolution : primaryResolution).length})
                  </h4>
                  <div className="space-y-2">
                    {(resolutionInfo.hasReopen ? updatedResolution : primaryResolution).map(renderAttachment)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Acceptance Remarks (shown when ticket is resolved) */}
          {ticket.acceptance_remarks && ticket.status === 'resolved' && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  ✅ Acceptance Remarks
                </h3>
                <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                  Resolved
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {ticket.acceptance_remarks}
              </p>
            </div>
          )}

          {/* Action Forms */}
          {canResolve && (
            <div className={`rounded-lg shadow p-6 ${
              ticket.reopen_reason 
                ? 'bg-gradient-to-r from-blue-50 to-white border-2 border-blue-300' 
                : 'bg-white'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {ticket.reopen_reason ? 'Add Updated Resolution' : 'Add Resolution'}
                </h3>
                {ticket.reopen_reason && (
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    Reopened Ticket
                  </span>
                )}
              </div>
              {ticket.reopen_reason && (
                <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This ticket was previously resolved but reopened. Please provide an updated resolution addressing the reopen reason above.
                  </p>
                </div>
              )}
              <textarea
                value={resolveRemarks}
                onChange={(e) => setResolveRemarks(e.target.value)}
                rows={5}
                placeholder="Enter resolution details and root cause analysis..."
                className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
              />
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach Resolution Files (Optional)
                </label>
                <FileUpload 
                  onFilesChange={setResolveFiles}
                  maxFiles={5}
                  maxSizeMB={20}
                />
              </div>

              <button
                onClick={() => resolveMutation.mutate()}
                disabled={!resolveRemarks.trim() || resolveMutation.isPending}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {resolveMutation.isPending ? 'Resolving...' : 'Mark as Processed'}
              </button>
            </div>
          )}

          {canReopen && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reopen Ticket
              </h3>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                rows={3}
                placeholder="Explain why this ticket needs to be reopened..."
                className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
              />
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach Supporting Files (Optional)
                </label>
                <FileUpload 
                  onFilesChange={setReopenFiles}
                  maxFiles={5}
                  maxSizeMB={20}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Acceptance Remarks (Optional)
                </label>
                <textarea
                  value={acceptanceRemarks}
                  onChange={(e) => setAcceptanceRemarks(e.target.value)}
                  rows={2}
                  placeholder="Add any remarks or feedback about the resolution..."
                  className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => reopenMutation.mutate()}
                  disabled={!reopenReason.trim() || reopenMutation.isPending}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {reopenMutation.isPending ? 'Reopening...' : 'Reopen'}
                </button>
                <button
                  onClick={() => closeMutation.mutate()}
                  disabled={closeMutation.isPending}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {closeMutation.isPending ? 'Closing...' : 'Accept & Close'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Ticket Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <div className="flex items-center text-sm text-gray-900 mt-1">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(ticket.created_at).toLocaleString()}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Created By</p>
                <div className="flex items-center text-sm text-gray-900 mt-1">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  {ticket.creator_name || ticket.creator_email}
                </div>
              </div>

              {ticket.current_assignee && (
                <div>
                  <p className="text-xs text-gray-500">Assigned To</p>
                  <div className="flex items-center text-sm text-gray-900 mt-1">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    {ticket.assignee_name}
                  </div>
                </div>
              )}

              {ticket.resolved_at && (
                <div>
                  <p className="text-xs text-gray-500">Resolved</p>
                  <div className="flex items-center text-sm text-gray-900 mt-1">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(ticket.resolved_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activity Timeline
            </h3>
            <div className="space-y-4">
              {activitiesData?.activities.map((activity, index) => (
                <div key={activity.id} className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className="w-2 h-2 rounded-full bg-primary-600" />
                    {index < (activitiesData.activities.length - 1) && (
                      <div className="w-0.5 h-full bg-gray-300 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.actor_name || 'System'} • {new Date(activity.created_at).toLocaleString()}
                    </p>
                    {activity.comment && (
                      <p className="text-sm text-gray-700 mt-2">
                        {activity.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

          {/* File Preview Modal */}
          <FilePreviewModal
            attachment={previewAttachment}
            onClose={() => setPreviewAttachment(null)}
            onDownload={handleDownload}
          />

          {/* Admin Status Manager Modal */}
          {user?.role === 'admin' && (
            <AdminStatusManager
              isOpen={showAdminStatusModal}
              onClose={() => setShowAdminStatusModal(false)}
              currentStatus={ticket.status}
              onStatusChange={(status, reason) => {
                adminStatusMutation.mutate({ status, reason });
              }}
              isChanging={adminStatusMutation.isPending}
            />
          )}

          {/* Modal System */}
          <Modal
            isOpen={modalState.isOpen}
            onClose={hideModal}
            type={modalState.type}
            title={modalState.title}
            message={modalState.message}
            onConfirm={modalState.onConfirm}
            onCancel={modalState.onCancel}
            confirmText={modalState.confirmText}
            cancelText={modalState.cancelText}
            size={modalState.size}
          />

          {/* Request Deletion Modal */}
          {deletingAttachment && !showOTPModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                <div className="flex items-center mb-4">
                  <Trash2 className="w-6 h-6 text-red-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">Request File Deletion</h3>
                </div>
                
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>📋 Team Approval Required</strong>
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your deletion request will be sent to the {user?.role === 'growth' ? 'Ops' : 'Growth'} team for approval.
                  </p>
                </div>

                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-sm text-gray-700">
                    <strong>File:</strong> {deletingAttachment.filename}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    <strong>Size:</strong> {(deletingAttachment.file_size / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    <strong>Ticket:</strong> {ticket?.ticket_number}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Deletion <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      placeholder="Explain why this file needs to be deleted..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900 placeholder-gray-400"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      The {user?.role === 'growth' ? 'Ops' : 'Growth'} team will review your request and provide an OTP if approved.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingAttachment(null);
                        setDeletionReason('');
                        setError('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOTPModal(true);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-blue-100 rounded-md hover:bg-blue-200 border border-blue-300"
                    >
                      I Have OTP
                    </button>
                    <button
                      onClick={() => requestDeletionMutation.mutate({ attachmentId: deletingAttachment.id, reason: deletionReason })}
                      disabled={!deletionReason.trim() || requestDeletionMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {requestDeletionMutation.isPending ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OTP Entry Modal (shown when user has received OTP) */}
          {showOTPModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                <div className="flex items-center mb-4">
                  <Trash2 className="w-6 h-6 text-green-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">Enter Approval OTP</h3>
                </div>
                
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>✅ Request Approved</strong>
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Enter the OTP code you received from the {user?.role === 'growth' ? 'Ops' : 'Growth'} team.
                  </p>
                </div>

                {deletingAttachment && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-700">
                      <strong>File:</strong> {deletingAttachment.filename}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      <strong>Size:</strong> {(deletingAttachment.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-3 text-2xl font-mono text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 tracking-widest"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOTPModal(false);
                        setDeletingAttachment(null);
                        setOtpCode('');
                        setError('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (deletingAttachment) {
                          deleteAttachmentMutation.mutate({ attachmentId: deletingAttachment.id, otp: otpCode });
                        }
                      }}
                      disabled={!deletingAttachment || otpCode.length !== 6 || deleteAttachmentMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteAttachmentMutation.isPending ? 'Deleting...' : 'Delete File'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

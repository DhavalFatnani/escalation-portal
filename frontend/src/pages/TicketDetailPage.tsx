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

export default function TicketDetailPage() {
  const { ticketNumber } = useParams<{ ticketNumber: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [resolveRemarks, setResolveRemarks] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [resolveFiles, setResolveFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState<any>(null);
  
  // Admin controls
  const [showForceStatusModal, setShowForceStatusModal] = useState(false);
  const [forceStatus, setForceStatus] = useState<TicketStatus>('open');
  const [forceReason, setForceReason] = useState('');

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
        await attachmentService.uploadFiles(ticketNumber!, resolveFiles);
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

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => attachmentService.deleteAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', ticketNumber] });
    },
  });

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
      alert('Failed to download file. Please try again.');
    }
  };

  const reopenMutation = useMutation({
    mutationFn: () => ticketService.reopenTicket(ticketNumber!, { reason: reopenReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketNumber] });
      queryClient.invalidateQueries({ queryKey: ['ticket-activities', ticketNumber] });
      setReopenReason('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to reopen ticket');
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => ticketService.closeTicket(ticketNumber!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketNumber] });
      queryClient.invalidateQueries({ queryKey: ['ticket-activities', ticketNumber] });
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

  const forceStatusMutation = useMutation({
    mutationFn: () => adminService.forceStatusChange(ticketNumber!, forceStatus, forceReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketNumber] });
      queryClient.invalidateQueries({ queryKey: ['ticket-activities', ticketNumber] });
      setShowForceStatusModal(false);
      setForceReason('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to force status change');
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

  const canResolve = user?.role === 'ops' && (ticket.status === 'open' || ticket.status === 're-opened');
  const canReopen = user?.role === 'growth' && ticket.status === 'processed';
  const canClose = user?.role === 'growth' && ticket.status === 'processed';

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
                    onClick={() => setShowForceStatusModal(true)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-700 bg-white border border-purple-300 rounded-md hover:bg-purple-50"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Force Status
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`⚠️ Are you sure you want to DELETE ticket ${ticket.ticket_number}?\n\nThis action cannot be undone and will remove:\n- The ticket\n- All activities\n- All attachments\n\nType "DELETE" if you're absolutely sure.`)) {
                        const confirmation = prompt('Type DELETE to confirm:');
                        if (confirmation === 'DELETE') {
                          deleteTicketMutation.mutate();
                        }
                      }
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
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
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
                    {ticket.issue_type.replace(/_/g, ' ')}
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
            </div>
          </div>

          {/* Resolution Section */}
          {ticket.resolution_remarks && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Resolution
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {ticket.resolution_remarks}
              </p>
            </div>
          )}

          {/* Reopen Reason */}
          {ticket.reopen_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Reopen Reason
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {ticket.reopen_reason}
              </p>
            </div>
          )}

          {/* Attachments Section */}
          {attachmentsData && attachmentsData.attachments.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Paperclip className="w-5 h-5 mr-2" />
                Attachments ({attachmentsData.attachments.length})
              </h3>
              <div className="space-y-2">
                {attachmentsData.attachments.map((attachment: any) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <File className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {attachment.file_size && `${(attachment.file_size / 1024).toFixed(1)} KB • `}
                          Uploaded by {attachment.uploader_name || attachment.uploader_email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={() => setPreviewAttachment(attachment)}
                        className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                        title="Preview file"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(attachment)}
                        className="text-primary-600 hover:text-primary-700 p-1 rounded hover:bg-primary-50"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {(user?.role === 'admin' || attachment.uploaded_by === user?.id) && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this attachment?')) {
                              deleteAttachmentMutation.mutate(attachment.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Forms */}
          {canResolve && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add Resolution
              </h3>
              <textarea
                value={resolveRemarks}
                onChange={(e) => setResolveRemarks(e.target.value)}
                rows={5}
                placeholder="Enter resolution details and root cause analysis..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
              />
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
        </div>
      </div>

          {/* File Preview Modal */}
          <FilePreviewModal
            attachment={previewAttachment}
            onClose={() => setPreviewAttachment(null)}
            onDownload={handleDownload}
          />

          {/* Force Status Modal (Admin Only) */}
          {showForceStatusModal && user?.role === 'admin' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center mb-4">
                  <Zap className="w-6 h-6 text-purple-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">Force Status Change</h3>
                </div>
                
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This bypasses normal workflow rules. Use only when necessary.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Status
                    </label>
                    <select
                      value={forceStatus}
                      onChange={(e) => setForceStatus(e.target.value as TicketStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="open">Open</option>
                      <option value="processed">Processed</option>
                      <option value="resolved">Resolved</option>
                      <option value="re-opened">Re-opened</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason (Required)
                    </label>
                    <textarea
                      value={forceReason}
                      onChange={(e) => setForceReason(e.target.value)}
                      rows={3}
                      placeholder="Explain why you're forcing this status change..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
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
                        setShowForceStatusModal(false);
                        setForceReason('');
                        setError('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => forceStatusMutation.mutate()}
                      disabled={!forceReason.trim() || forceStatusMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {forceStatusMutation.isPending ? 'Forcing...' : 'Force Status Change'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

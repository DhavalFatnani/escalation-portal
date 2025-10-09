import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentService } from '../services/attachmentService';
import { useAuthStore } from '../stores/authStore';
import { FileX, Clock, CheckCircle, XCircle, Copy, FileText, AlertTriangle } from 'lucide-react';

export default function DeletionRequestsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['deletion-requests-pending'],
    queryFn: () => attachmentService.getPendingRequests(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: myRequestsData, isLoading: myRequestsLoading } = useQuery({
    queryKey: ['deletion-requests-my'],
    queryFn: () => attachmentService.getMyRequests(),
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => attachmentService.approveRequest(requestId),
    onSuccess: (data) => {
      setGeneratedOTP(data.otp_code);
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['deletion-requests-pending'] });
      queryClient.invalidateQueries({ queryKey: ['deletion-requests-my'] });
      
      // Auto-clear OTP display after 2 minutes
      setTimeout(() => setGeneratedOTP(null), 120000);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) => 
      attachmentService.rejectRequest(requestId, reason),
    onSuccess: () => {
      setSelectedRequest(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['deletion-requests-pending'] });
      queryClient.invalidateQueries({ queryKey: ['deletion-requests-my'] });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      used: 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">File Deletion Requests</h1>
        <p className="text-gray-600">
          Review and approve/reject file deletion requests from other teams
        </p>
      </div>

      {/* Generated OTP Display */}
      {generatedOTP && (
        <div className="mb-6 p-6 bg-green-50 border-2 border-green-300 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-green-900 font-semibold mb-2">🎉 Request Approved!</p>
              <p className="text-sm text-green-700 mb-3">
                Share this OTP with the requester. It expires in 10 minutes.
              </p>
              <div className="flex items-center gap-3">
                <p className="text-4xl font-mono font-bold text-green-900 tracking-wider">{generatedOTP}</p>
                <button
                  onClick={() => copyToClipboard(generatedOTP)}
                  className="text-green-700 hover:text-green-900 p-3 rounded-lg hover:bg-green-100 transition-colors"
                  title="Copy to clipboard"
                >
                  {copySuccess ? <CheckCircle className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests for Approval */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-orange-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Pending Approvals</h2>
            </div>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-semibold rounded-full">
              {pendingData?.requests?.length || 0}
            </span>
          </div>

          {pendingLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : pendingData?.requests?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileX className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No pending deletion requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingData?.requests?.map((request: any) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <p className="font-semibold text-gray-900">{request.filename}</p>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Ticket:</strong> {request.ticket_number} - {request.brand_name}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Requested by:</strong> {request.requester_name || request.requester_email}
                      </p>
                      <div className="p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1"><strong>Reason:</strong></p>
                        <p className="text-sm text-gray-700">{request.requester_reason}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => approveMutation.mutate(request.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {approveMutation.isPending ? 'Approving...' : 'Approve & Generate OTP'}
                    </button>
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <Clock className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">My Requests</h2>
          </div>

          {myRequestsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : myRequestsData?.requests?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileX className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No deletion requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequestsData?.requests?.slice(0, 10).map((request: any) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">{request.filename}</p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Ticket:</strong> {request.ticket_number}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {request.status === 'approved' && request.otp_code && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs text-green-700 mb-1">Your OTP:</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-mono font-bold text-green-900">{request.otp_code}</p>
                        <button
                          onClick={() => copyToClipboard(request.otp_code)}
                          className="text-green-700 hover:text-green-900 p-1"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Use this to complete deletion
                      </p>
                    </div>
                  )}

                  {request.status === 'rejected' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-700 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-900">{request.rejection_reason || 'No reason provided'}</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    Requested {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center mb-4">
              <XCircle className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-xl font-semibold text-gray-900">Reject Deletion Request</h3>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-700"><strong>File:</strong> {selectedRequest.filename}</p>
              <p className="text-sm text-gray-700"><strong>Requester:</strong> {selectedRequest.requester_name}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate({ requestId: selectedRequest.id, reason: rejectionReason })}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


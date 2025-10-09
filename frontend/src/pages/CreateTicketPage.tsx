import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ticketService } from '../services/ticketService';
import { CreateTicketDTO, IssueType, TicketPriority } from '../types';
import { AlertCircle, ArrowLeft, Check, Sparkles, FileText, AlertTriangle } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import { useAuthStore } from '../stores/authStore';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<CreateTicketDTO>({
    brand_name: '',
    description: '',
    issue_type: undefined,
    expected_output: '',
    priority: 'medium',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  
  // Custom inputs for "Other" selections
  const [customIssueType, setCustomIssueType] = useState('');
  const [customExpectedOutput, setCustomExpectedOutput] = useState('');
  const [selectedExpectedOutput, setSelectedExpectedOutput] = useState('');

  const createMutation = useMutation({
    mutationFn: async (formData: CreateTicketDTO) => {
      const { ticket } = await ticketService.createTicket(formData);
      
      // Upload files if any
      if (files.length > 0) {
        const { attachmentService } = await import('../services/attachmentService');
        await attachmentService.uploadFiles(ticket.ticket_number, files, 'initial');
      }
      
      return { ticket };
    },
    onSuccess: (data) => {
      navigate(`/tickets/${data.ticket.ticket_number}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create ticket');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.brand_name.trim()) {
      setError('Brand name is required');
      return;
    }

    // Prepare final data with custom values if "Other" was selected
    const finalData = { ...formData };
    
    // If issue type is "other" and custom value is provided
    if (formData.issue_type === 'other' && customIssueType.trim()) {
      finalData.issue_type = customIssueType.trim() as IssueType;
    }
    
    // If expected output is "Other" and custom value is provided
    if (selectedExpectedOutput === 'Other' && customExpectedOutput.trim()) {
      finalData.expected_output = customExpectedOutput.trim();
    } else if (selectedExpectedOutput) {
      finalData.expected_output = selectedExpectedOutput;
    }

    createMutation.mutate(finalData);
  };

  const issueTypes: { value: IssueType; label: string }[] = [
    { value: 'product_not_as_listed', label: 'Product Not As Listed' },
    { value: 'giant_discrepancy_brandless_inverterless', label: 'Giant Discrepancy (Brandless/Inverterless)' },
    { value: 'physical_vs_scale_mismatch', label: 'Physical vs Scale Mismatch' },
    { value: 'other', label: 'Other' },
  ];

  const expectedOutputOptions = [
    'SKU Level sheet (with Reason for not Live or went Live)',
    'SKU Level sheet (with Updated Products Received Qty)',
    'Images',
    'SKU Level sheet (with Remarks)',
    'Other',
  ];

  const priorities: TicketPriority[] = ['urgent', 'high', 'medium', 'low'];

  const getPriorityStyle = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent': return 'from-red-500 to-pink-500';
      case 'high': return 'from-orange-500 to-red-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      case 'low': return 'from-green-500 to-emerald-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="card-modern shadow-xl-colored">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6 mb-8">
          <div className="flex items-center mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Create New Ticket</h1>
              <p className="text-gray-600 mt-1">
                {user?.role === 'growth' 
                  ? 'Submit an escalation request to the Ops team'
                  : user?.role === 'ops'
                  ? 'Submit an escalation request to the Growth team'
                  : 'Submit an escalation request'}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start animate-slide-in-right">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <span className="text-sm text-red-700 font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Brand Name */}
          <div className="group">
            <label htmlFor="brand_name" className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              id="brand_name"
              type="text"
              value={formData.brand_name}
              onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
              placeholder="Enter the brand name"
            />
          </div>

          {/* Description */}
          <div className="group">
            <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
              placeholder="Describe the issue in detail..."
            />
          </div>

          {/* Issue Type */}
          <div className="group">
            <label htmlFor="issue_type" className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Issue Type
            </label>
            <select
              id="issue_type"
              value={formData.issue_type || ''}
              onChange={(e) => {
                const value = e.target.value as IssueType || undefined;
                setFormData({ ...formData, issue_type: value });
                if (value !== 'other') {
                  setCustomIssueType('');
                }
              }}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
            >
              <option value="">Select issue type</option>
              {issueTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            
            {formData.issue_type === 'other' && (
              <div className="mt-3 animate-slide-in-right">
                <input
                  type="text"
                  value={customIssueType}
                  onChange={(e) => setCustomIssueType(e.target.value)}
                  placeholder="Please specify the issue type..."
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
            )}
          </div>

          {/* Expected Output */}
          <div className="group">
            <label htmlFor="expected_output" className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Expected Output
            </label>
            <select
              id="expected_output"
              value={selectedExpectedOutput}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedExpectedOutput(value);
                if (value !== 'Other') {
                  setCustomExpectedOutput('');
                  setFormData({ ...formData, expected_output: value });
                }
              }}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
            >
              <option value="">Select expected output</option>
              {expectedOutputOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            
            {selectedExpectedOutput === 'Other' && (
              <div className="mt-3 animate-slide-in-right">
                <input
                  type="text"
                  value={customExpectedOutput}
                  onChange={(e) => setCustomExpectedOutput(e.target.value)}
                  placeholder="Please specify the expected output..."
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
              Priority <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {priorities.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`relative px-6 py-4 rounded-xl text-sm font-bold capitalize transition-all duration-300 transform hover:scale-105 ${
                    formData.priority === priority
                      ? `bg-gradient-to-r ${getPriorityStyle(priority)} text-white shadow-lg ring-4 ring-offset-2 ${
                          priority === 'urgent' ? 'ring-red-200' :
                          priority === 'high' ? 'ring-orange-200' :
                          priority === 'medium' ? 'ring-yellow-200' :
                          'ring-green-200'
                        }`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {formData.priority === priority && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}
                  {priority}
                  {priority === 'urgent' && (
                    <AlertTriangle className="w-4 h-4 inline-block ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Attachments (Optional)
            </label>
            <FileUpload 
              onFilesChange={setFiles}
              maxFiles={5}
              maxSizeMB={20}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center"
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Creating Ticket...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Ticket
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={createMutation.isPending}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-bold text-lg transition-all duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ticketService } from '../services/ticketService';
import { CreateTicketDTO, IssueType, TicketPriority } from '../types';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import FileUpload from '../components/FileUpload';

export default function CreateTicketPage() {
  const navigate = useNavigate();
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
        await attachmentService.uploadFiles(ticket.ticket_number, files);
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
    
    // If expected output is "Other:" and custom value is provided
    if (selectedExpectedOutput === 'Other:' && customExpectedOutput.trim()) {
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

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Ticket</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand Name */}
          <div>
            <label htmlFor="brand_name" className="block text-sm font-medium text-gray-700 mb-2">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              id="brand_name"
              type="text"
              value={formData.brand_name}
              onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter brand name"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe the issue in detail..."
            />
          </div>

          {/* Issue Type */}
          <div>
            <label htmlFor="issue_type" className="block text-sm font-medium text-gray-700 mb-2">
              Issue Type
            </label>
            <select
              id="issue_type"
              value={formData.issue_type || ''}
              onChange={(e) => {
                const value = e.target.value as IssueType || undefined;
                setFormData({ ...formData, issue_type: value });
                if (value !== 'other') {
                  setCustomIssueType(''); // Clear custom input if not "Other"
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select issue type</option>
              {issueTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            
            {/* Custom Issue Type Input (shown when "Other" is selected) */}
            {formData.issue_type === 'other' && (
              <div className="mt-3 animate-fade-in">
                <input
                  type="text"
                  value={customIssueType}
                  onChange={(e) => setCustomIssueType(e.target.value)}
                  placeholder="Please specify the issue type..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-blue-50"
                  required
                />
              </div>
            )}
          </div>

          {/* Expected Output */}
          <div>
            <label htmlFor="expected_output" className="block text-sm font-medium text-gray-700 mb-2">
              Expected Output
            </label>
            <select
              id="expected_output"
              value={selectedExpectedOutput}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedExpectedOutput(value);
                if (value !== 'Other:') {
                  setCustomExpectedOutput(''); // Clear custom input if not "Other"
                  setFormData({ ...formData, expected_output: value });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select expected output</option>
              {expectedOutputOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            
            {/* Custom Expected Output Input (shown when "Other:" is selected) */}
            {selectedExpectedOutput === 'Other:' && (
              <div className="mt-3 animate-fade-in">
                <input
                  type="text"
                  value={customExpectedOutput}
                  onChange={(e) => setCustomExpectedOutput(e.target.value)}
                  placeholder="Please specify the expected output..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-blue-50"
                  required
                />
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Priority <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {priorities.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`px-4 py-3 rounded-md text-sm font-medium capitalize transition-colors ${
                    formData.priority === priority
                      ? priority === 'urgent'
                        ? 'bg-red-600 text-white'
                        : priority === 'high'
                        ? 'bg-orange-600 text-white'
                        : priority === 'medium'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Files (Optional)
            </label>
            <FileUpload 
              onFilesChange={setFiles}
              maxFiles={5}
              maxSizeMB={20}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

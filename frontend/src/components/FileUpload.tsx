import { useState, useRef } from 'react';
import { Upload, X, File, AlertCircle, Info } from 'lucide-react';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
}

export default function FileUpload({ 
  onFilesChange, 
  maxFiles = 5, 
  maxSizeMB = 20,
  accept = 'image/*,.pdf,.doc,.docx,.xlsx,.csv,.zip'
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [showZipSuggestion, setShowZipSuggestion] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setShowZipSuggestion(false);
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate number of files
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      setShowZipSuggestion(true);
      return;
    }

    // Validate file sizes
    const invalidFiles = selectedFiles.filter(
      file => file.size > maxSizeMB * 1024 * 1024
    );
    if (invalidFiles.length > 0) {
      setError(`Files must be less than ${maxSizeMB}MB`);
      return;
    }

    const newFiles = [...files, ...selectedFiles];
    
    // Show zip suggestion if many files
    if (newFiles.length > maxFiles) {
      setShowZipSuggestion(true);
    }
    
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={files.length >= maxFiles}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Files ({files.length}/{maxFiles})
        </button>
        <p className="mt-1 text-xs text-gray-500">
          Max {maxFiles} files, {maxSizeMB}MB each. Accepts images, PDF, Word, Excel, ZIP.
        </p>
      </div>

      {/* ZIP Suggestion */}
      {showZipSuggestion && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <strong>Tip:</strong> Have more than {maxFiles} files? Compress them into a .zip file and upload the archive instead!
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md"
            >
              <div className="flex items-center flex-1 min-w-0">
                <File className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-3 text-gray-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from 'react';
import { Upload, X, File, AlertCircle, Info, Loader2, CheckCircle } from 'lucide-react';
import { compressImages, isCompressibleImage, formatFileSize } from '../utils/imageCompression';

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
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionStats, setCompressionStats] = useState<{ originalSize: number; compressedSize: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setShowZipSuggestion(false);
    setCompressionStats(null);
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate number of files
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      setShowZipSuggestion(true);
      return;
    }

    // Validate file sizes (before compression)
    const invalidFiles = selectedFiles.filter(
      file => file.size > maxSizeMB * 1024 * 1024
    );
    if (invalidFiles.length > 0) {
      setError(`Files must be less than ${maxSizeMB}MB`);
      return;
    }

    // Check if any files need compression
    const hasCompressibleImages = selectedFiles.some(file => isCompressibleImage(file));
    
    if (hasCompressibleImages) {
      setIsCompressing(true);
      setCompressionProgress(0);
      
      try {
        // Compress images
        const results = await compressImages(
          selectedFiles,
          (current, total) => {
            setCompressionProgress(Math.round((current / total) * 100));
          }
        );
        
        // Calculate compression stats
        const originalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
        const compressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
        
        if (compressedSize < originalSize) {
          setCompressionStats({ originalSize, compressedSize });
        }
        
        // Use compressed files
        const compressedFiles = results.map(r => r.file);
        const newFiles = [...files, ...compressedFiles];
        
        setFiles(newFiles);
        onFilesChange(newFiles);
      } catch (error) {
        console.error('Compression failed:', error);
        setError('Image compression failed. Please try again.');
      } finally {
        setIsCompressing(false);
        setCompressionProgress(0);
      }
    } else {
      // No compression needed
      const newFiles = [...files, ...selectedFiles];
      
      // Show zip suggestion if many files
      if (newFiles.length > maxFiles) {
        setShowZipSuggestion(true);
      }
      
      setFiles(newFiles);
      onFilesChange(newFiles);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
    setCompressionStats(null);
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
          disabled={files.length >= maxFiles || isCompressing}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompressing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Compressing... {compressionProgress}%
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Files ({files.length}/{maxFiles})
            </>
          )}
        </button>
        <p className="mt-1 text-xs text-gray-500">
          Max {maxFiles} files, {maxSizeMB}MB each. Accepts images, PDF, Word, Excel, ZIP.
        </p>
      </div>

      {/* Compression Success */}
      {compressionStats && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-green-700">
            <strong>Images compressed!</strong> Saved{' '}
            {formatFileSize(compressionStats.originalSize - compressionStats.compressedSize)} (
            {Math.round(((compressionStats.originalSize - compressionStats.compressedSize) / compressionStats.originalSize) * 100)}% smaller)
          </div>
        </div>
      )}

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

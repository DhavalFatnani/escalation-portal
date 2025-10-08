import { X, Download, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FilePreviewModalProps {
  attachment: {
    id: string;
    filename: string;
    url: string;
    mime_type: string | null;
    file_size: number | null;
    uploader_name?: string;
    uploader_email?: string;
    created_at: string;
  } | null;
  onClose: () => void;
  onDownload: (attachment: any) => void;
}

export default function FilePreviewModal({ attachment, onClose, onDownload }: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (!attachment) return;

    // Convert base64 data URL to blob URL for better performance
    if (attachment.url.startsWith('data:')) {
      try {
        const arr = attachment.url.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        setPreviewUrl(blobUrl);

        return () => {
          URL.revokeObjectURL(blobUrl);
        };
      } catch (error) {
        console.error('Error converting data URL:', error);
        setPreviewUrl(attachment.url);
      }
    } else {
      setPreviewUrl(attachment.url);
    }
  }, [attachment]);

  if (!attachment) return null;

  const isImage = attachment.mime_type?.startsWith('image/') || 
                  /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.filename);
  
  const isPDF = attachment.mime_type === 'application/pdf' || 
                attachment.filename.toLowerCase().endsWith('.pdf');

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex-1 min-w-0 mr-4">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {attachment.filename}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(attachment.file_size)} • Uploaded by {attachment.uploader_name || attachment.uploader_email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDownload(attachment)}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col min-h-0">
            {isImage && (
              <div className="flex items-center justify-center h-full w-full p-4 overflow-auto">
                <img
                  src={previewUrl}
                  alt={attachment.filename}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            )}

            {isPDF && (
              <div className="w-full h-full p-4">
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded-lg border border-gray-300 bg-white"
                  title={attachment.filename}
                  style={{ minHeight: '500px' }}
                />
              </div>
            )}

            {!isImage && !isPDF && (
              <div className="flex items-center justify-center h-full w-full">
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExternalLink className="w-10 h-10 text-gray-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Preview not available
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    This file type cannot be previewed in the browser.
                  </p>
                  <button
                    onClick={() => onDownload(attachment)}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

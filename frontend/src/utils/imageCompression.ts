import imageCompression from 'browser-image-compression';

/**
 * Image Compression Utility
 * 
 * Compresses images before upload to reduce storage and bandwidth usage.
 * This helps stay within Supabase free tier limits (1GB storage, 2GB bandwidth/month).
 * 
 * Expected compression: 60-80% size reduction
 * Average image: 5MB → 800KB-1MB
 */

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Check if file is an image that can be compressed
 */
export function isCompressibleImage(file: File): boolean {
  const compressibleTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  return compressibleTypes.includes(file.type.toLowerCase());
}

/**
 * Compress a single image file
 * 
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed file with metadata
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const originalSize = file.size;

  // Don't compress if already small enough
  if (originalSize < 100 * 1024) { // < 100KB
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };
  }

  // Default options optimized for free tier
  const defaultOptions = {
    maxSizeMB: 1, // Target 1MB or less
    maxWidthOrHeight: 1920, // Max dimension for good quality
    useWebWorker: true, // Use web worker for better performance
    fileType: file.type,
    initialQuality: 0.8, // Good balance of quality vs size
    alwaysKeepResolution: false, // Allow downscaling if needed
  };

  const compressionOptions = { ...defaultOptions, ...options };

  try {
    const compressedBlob = await imageCompression(file, compressionOptions);
    
    // Convert blob to File
    const compressedFile = new File(
      [compressedBlob],
      file.name,
      {
        type: compressedBlob.type,
        lastModified: Date.now(),
      }
    );

    const compressedSize = compressedFile.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original file if compression fails
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };
  }
}

/**
 * Compress multiple image files
 * 
 * @param files - Array of files to compress
 * @param onProgress - Optional callback for progress updates
 * @returns Array of compressed files with metadata
 */
export async function compressImages(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Only compress images, skip other files
    if (isCompressibleImage(file)) {
      const result = await compressImage(file);
      results.push(result);
    } else {
      // Non-image files pass through unchanged
      results.push({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
      });
    }

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return results;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate total size savings from compression
 */
export function calculateSavings(results: CompressionResult[]): {
  originalTotal: number;
  compressedTotal: number;
  totalSavings: number;
  averageCompressionRatio: number;
} {
  const originalTotal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const compressedTotal = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalSavings = ((originalTotal - compressedTotal) / originalTotal) * 100;
  const averageCompressionRatio =
    results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;

  return {
    originalTotal,
    compressedTotal,
    totalSavings,
    averageCompressionRatio,
  };
}


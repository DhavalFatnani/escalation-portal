import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';

// Initialize Supabase client (extract from DATABASE_URL)
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL || '';
  // Convert postgres:// to https:// for Supabase API
  // Example: postgresql://postgres.zdgcklcqyfvhblecgpiq:password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
  // To: https://zdgcklcqyfvhblecgpiq.supabase.co
  
  const match = dbUrl.match(/postgres\.([^:]+):/);
  if (match) {
    const projectRef = match[1];
    return `https://${projectRef}.supabase.co`;
  }
  
  return process.env.SUPABASE_URL || '';
};

const supabaseUrl = getDatabaseUrl();
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Multer configuration for handling file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, office documents, and zip files
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-zip',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDF, Word, Excel, and ZIP files are allowed.'));
    }
  },
});

export async function uploadFileToStorage(
  file: Express.Multer.File,
  bucket: string = 'attachments'
): Promise<{ url: string; path: string }> {
  // If Supabase is not configured or storage fails, use base64 fallback
  if (!supabase || !process.env.SUPABASE_ANON_KEY) {
    // Fallback: Return base64 data URL
    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;
    return {
      url: dataUrl,
      path: 'base64-inline',
    };
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}${ext}`;
    const filePath = `uploads/${filename}`;

    // Upload to Supabase Storage with long cache (free tier optimization)
    // Attachments are immutable, so we can cache them for a long time
    const { data, error} = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000, immutable', // 1 year cache
        upsert: false,
      });

    if (error) {
      console.warn(`Supabase storage upload failed: ${error.message}, falling back to base64`);
      // Fallback to base64
      const base64 = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64}`;
      return {
        url: dataUrl,
        path: 'base64-inline',
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.warn('Supabase storage error, falling back to base64:', error);
    // Fallback to base64
    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;
    return {
      url: dataUrl,
      path: 'base64-inline',
    };
  }
}

export async function deleteFileFromStorage(
  filePath: string,
  bucket: string = 'attachments'
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

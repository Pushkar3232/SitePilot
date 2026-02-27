// app/api/assets/upload/route.ts
import { NextRequest } from 'next/server';
import { 
  verifyRequestAndGetUser, 
  jsonResponse, 
  errorResponse, 
  ApiError 
} from '@/lib/auth-middleware';
import { supabaseServer } from '@/lib/supabase';
import { hasPermission } from '@/lib/rbac';
import { uploadFile } from '@/lib/cloudinary';

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/assets/upload
 * Upload an image or file to Cloudinary
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyRequestAndGetUser(req);
    
    // Check permission
    if (!hasPermission(user.role, 'upload_assets')) {
      return errorResponse('FORBIDDEN', 'Upload permission required', 403);
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const assetType = formData.get('type') as string || 'image';

    if (!file) {
      return errorResponse('VALIDATION_ERROR', 'No file provided', 400);
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return errorResponse(
        'VALIDATION_ERROR', 
        `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`, 
        400
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('VALIDATION_ERROR', 'File size exceeds 10MB limit', 400);
    }

    // Check storage quota
    const { data: storageData, error: storageError } = await supabaseServer
      .rpc('get_tenant_storage_used', { p_tenant_id: user.tenant_id });

    // If RPC doesn't exist, calculate manually
    let storageUsedMb = 0;
    if (storageError) {
      const { data: assets } = await supabaseServer
        .from('assets')
        .select('size_bytes')
        .eq('tenant_id', user.tenant_id);
      
      if (assets) {
        const totalBytes = assets.reduce((sum, a) => sum + (a.size_bytes || 0), 0);
        storageUsedMb = totalBytes / (1024 * 1024);
      }
    } else {
      storageUsedMb = storageData || 0;
    }

    const storageLimitMb = user.tenants.plans.storage_limit_mb;
    const newFileMb = file.size / (1024 * 1024);

    if (storageUsedMb + newFileMb > storageLimitMb) {
      return errorResponse(
        'PLAN_LIMIT_STORAGE',
        `Storage quota exceeded. Used: ${storageUsedMb.toFixed(2)}MB, Limit: ${storageLimitMb}MB`,
        429,
        {
          used: storageUsedMb,
          limit: storageLimitMb,
          upgradeUrl: '/dashboard/billing',
        }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine resource type for Cloudinary
    let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
    if (file.type.startsWith('image/')) resourceType = 'image';
    else if (file.type.startsWith('video/')) resourceType = 'video';
    else resourceType = 'raw';

    // Upload to Cloudinary
    let uploadResult;
    try {
      uploadResult = await uploadFile(buffer, user.tenant_id, {
        resourceType,
      });
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return errorResponse('INTERNAL_ERROR', 'Failed to upload file', 500);
    }

    // Save asset record to database
    const { data: asset, error: dbError } = await supabaseServer
      .from('assets')
      .insert({
        tenant_id: user.tenant_id,
        original_filename: file.name,
        cloudinary_public_id: uploadResult.public_id,
        cloudinary_url: uploadResult.url,
        secure_url: uploadResult.secure_url,
        asset_type: resourceType,
        format: uploadResult.format,
        size_bytes: uploadResult.bytes,
        width: uploadResult.width || null,
        height: uploadResult.height || null,
        uploaded_by: user.id,
        upload_source: 'manual',
        tags: [],
      })
      .select()
      .single();

    if (dbError) {
      console.error('Asset DB insert error:', dbError);
      // TODO: Delete from Cloudinary if DB insert fails
      return errorResponse('INTERNAL_ERROR', 'Failed to save asset record', 500);
    }

    return jsonResponse({ asset }, 201);
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    if (err instanceof Response) return err;
    console.error('POST /api/assets/upload error:', err);
    return errorResponse('INTERNAL_ERROR', 'Upload failed', 500);
  }
}

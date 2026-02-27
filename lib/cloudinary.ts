// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export interface UploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
}

/**
 * Upload a file to Cloudinary
 */
export async function uploadFile(
  file: Buffer,
  tenantId: string,
  options?: {
    folder?: string;
    publicId?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
  }
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options?.folder ?? `sitepilot/tenants/${tenantId}`,
      public_id: options?.publicId,
      resource_type: options?.resourceType ?? 'auto',
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            url: result.url,
            secure_url: result.secure_url,
            format: result.format,
            resource_type: result.resource_type,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
          });
        } else {
          reject(new Error('Upload failed: no result returned'));
        }
      }
    ).end(file);
  });
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFile(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<{ result: string }> {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Get a signed URL for a private asset
 */
export function getSignedUrl(publicId: string, options?: {
  width?: number;
  height?: number;
  crop?: string;
  format?: string;
}): string {
  return cloudinary.url(publicId, {
    sign_url: true,
    type: 'authenticated',
    transformation: options ? [
      {
        width: options.width,
        height: options.height,
        crop: options.crop ?? 'fill',
        format: options.format,
      },
    ] : undefined,
  });
}

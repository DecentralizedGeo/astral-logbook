// Centralized storage configuration and limits
// Use NEXT_PUBLIC_MAX_UPLOAD_BYTES to override client + server default in deployments
// Note: Vercel serverless functions have a payload limit (often <10MB). Setting this value
// higher than your platform limit won't avoid platform 413 errors — prefer client-side compression
// or direct-to-storage uploads for large files.

export const DEFAULT_MAX_FILE_SIZE_BYTES: number = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES) || 4.5 * 1024 * 1024; // 4.5 MB default (Vercel serverless limit)

export const ALLOWED_FILE_TYPES: string[] = ['image/jpeg', 'image/png', 'image/gif'];

const storageConfig = {
  DEFAULT_MAX_FILE_SIZE_BYTES,
  ALLOWED_FILE_TYPES,
};

export default storageConfig;

/**
 * Abstract base class for storage services
 * Defines the common interface that all storage services must implement
 */
export abstract class StorageService {
  abstract id: string;
  abstract name: string;
  abstract icon: string;

  // Authentication methods
  abstract login(email: string): Promise<{ success: boolean; message?: string }>;
  abstract createAccount(email: string): Promise<{ success: boolean; message?: string }>;
  abstract checkVerification(email: string): Promise<{
    verified: boolean;
    needsPaymentPlan?: boolean;
    account?: any;
  }>;
  abstract checkPaymentPlan(email: string): Promise<{ hasPaymentPlan: boolean }>;
  abstract resendVerification(email: string): Promise<{ success: boolean; message?: string }>;

  // Storage operations
  abstract createSpace(name: string, email: string): Promise<{ success: boolean; space?: any; message?: string }>;
  abstract listSpaces(email: string): Promise<{ success: boolean; spaces?: any[]; message?: string }>;
  abstract uploadFile(
    file: File,
    spaceName: string,
    email: string,
  ): Promise<{
    success: boolean;
    fileId?: string;
    message?: string;
  }>;
  abstract listFiles(
    spaceName: string,
    email: string,
  ): Promise<{
    success: boolean;
    files?: any[];
    message?: string;
  }>;
  abstract deleteFile(fileId: string, email: string): Promise<{ success: boolean; message?: string }>;

  // Utility methods
  abstract isAuthenticated(email: string): Promise<boolean>;
  abstract disconnect(email: string): Promise<void>;
}

export interface StorageServiceConfig {
  apiBaseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  account?: any;
  needsPaymentPlan?: boolean;
}

export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

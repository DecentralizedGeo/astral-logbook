import { StorageService, StorageServiceConfig } from './StorageService';

export class StorachaService extends StorageService {
  id = 'storacha';
  name = 'Storacha';
  icon = '/storacha-logo.svg';
  
  private config: StorageServiceConfig;
  
  constructor(config: StorageServiceConfig = {}) {
    super();
    this.config = {
      apiBaseUrl: '/api/storage/storacha',
      timeout: 30000,
      retryAttempts: 3,
      ...config,
    };
  }

  // Authentication methods
  async login(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      return {
        success: response.ok,
        message: result.message || (response.ok ? 'Login initiated' : 'Login failed'),
      };
    } catch (error) {
      return {
        success: false,
        message: `Login error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async createAccount(email: string): Promise<{ success: boolean; message?: string }> {
    // For Storacha, create account uses the same flow as login
    return this.login(email);
  }

  async checkVerification(email: string): Promise<{
    verified: boolean;
    needsPaymentPlan?: boolean;
    account?: any;
  }> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/check-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      return {
        verified: result.verified || false,
        needsPaymentPlan: result.needsPaymentPlan,
        account: result.account,
      };
    } catch (error) {
      return {
        verified: false,
      };
    }
  }

  async checkPaymentPlan(email: string): Promise<{ hasPaymentPlan: boolean }> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/check-payment-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      return {
        hasPaymentPlan: result.hasPaymentPlan || false,
      };
    } catch (error) {
      return {
        hasPaymentPlan: false,
      };
    }
  }

  async resendVerification(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      return {
        success: response.ok,
        message: result.message || (response.ok ? 'Verification email resent' : 'Failed to resend'),
      };
    } catch (error) {
      return {
        success: false,
        message: `Resend error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Storage operations
  async createSpace(name: string, email: string): Promise<{ success: boolean; space?: any; message?: string }> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/create-space`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      const result = await response.json();
      return {
        success: response.ok,
        space: result.space,
        message: result.message || (response.ok ? 'Space created successfully' : 'Failed to create space'),
      };
    } catch (error) {
      return {
        success: false,
        message: `Create space error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async listSpaces(email: string): Promise<{ success: boolean; spaces?: any[]; message?: string }> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/spaces?email=${encodeURIComponent(email)}`);

      const result = await response.json();
      return {
        success: response.ok,
        spaces: result.spaces || [],
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        spaces: [],
        message: `List spaces error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async uploadFile(
    file: File,
    spaceName: string,
    email: string,
  ): Promise<{
    success: boolean;
    fileId?: string;
    message?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('spaceName', spaceName);
      formData.append('email', email);

      const response = await fetch(`${this.config.apiBaseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      return {
        success: response.ok,
        fileId: result.fileId,
        message: result.message || (response.ok ? 'File uploaded successfully' : 'Failed to upload file'),
      };
    } catch (error) {
      return {
        success: false,
        message: `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async listFiles(
    spaceName: string,
    email: string,
  ): Promise<{
    success: boolean;
    files?: any[];
    message?: string;
  }> {
    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/files?spaceName=${encodeURIComponent(spaceName)}&email=${encodeURIComponent(email)}`,
      );

      const result = await response.json();
      return {
        success: response.ok,
        files: result.files || [],
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        message: `List files error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async deleteFile(fileId: string, email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId, email }),
      });

      const result = await response.json();
      return {
        success: response.ok,
        message: result.message || (response.ok ? 'File deleted successfully' : 'Failed to delete file'),
      };
    } catch (error) {
      return {
        success: false,
        message: `Delete error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Utility methods
  async isAuthenticated(email: string): Promise<boolean> {
    const verification = await this.checkVerification(email);
    return verification.verified;
  }

  async disconnect(email: string): Promise<void> {
    // For Storacha, we might want to clear local storage or make an API call
    // For now, this is a placeholder
    console.log(`Disconnecting Storacha service for ${email}`);
  }
}

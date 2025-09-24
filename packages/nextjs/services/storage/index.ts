import { StorachaService } from './StorachaService';
import { StorageService } from './StorageService';

// Service registry
export const STORAGE_SERVICES = {
  storacha: StorachaService,
  // Future services can be added here
  // ipfs: IPFSService,
  // arweave: ArweaveService,
} as const;

export type StorageServiceId = keyof typeof STORAGE_SERVICES;

/**
 * Storage Service Factory
 * Creates and manages storage service instances
 */
export class StorageServiceFactory {
  private static instances: Map<StorageServiceId, StorageService> = new Map();

  /**
   * Get a storage service instance
   * @param serviceId The ID of the storage service
   * @returns The storage service instance
   */
  static getService(serviceId: StorageServiceId): StorageService {
    if (!this.instances.has(serviceId)) {
      const ServiceClass = STORAGE_SERVICES[serviceId];
      if (!ServiceClass) {
        throw new Error(`Unknown storage service: ${serviceId}`);
      }
      this.instances.set(serviceId, new ServiceClass());
    }
    const instance = this.instances.get(serviceId);
    if (!instance) {
      throw new Error(`Failed to create storage service: ${serviceId}`);
    }
    return instance;
  }

  /**
   * Get all available storage services
   * @returns Array of all storage service instances
   */
  static getAllServices(): StorageService[] {
    return Object.keys(STORAGE_SERVICES).map(serviceId => this.getService(serviceId as StorageServiceId));
  }

  /**
   * Check if a service is available
   * @param serviceId The ID of the storage service
   * @returns True if the service is available
   */
  static isServiceAvailable(serviceId: string): serviceId is StorageServiceId {
    return serviceId in STORAGE_SERVICES;
  }

  /**
   * Clear all service instances (useful for testing)
   */
  static clearInstances(): void {
    this.instances.clear();
  }
}

/**
 * Storage Manager
 * High-level interface for managing storage operations across services
 */
export class StorageManager {
  private activeServiceId: StorageServiceId | null = null;

  /**
   * Set the active storage service
   * @param serviceId The ID of the storage service to activate
   */
  setActiveService(serviceId: StorageServiceId): void {
    if (!StorageServiceFactory.isServiceAvailable(serviceId)) {
      throw new Error(`Unknown storage service: ${serviceId}`);
    }
    this.activeServiceId = serviceId;
  }

  /**
   * Get the active storage service
   * @returns The active storage service instance
   */
  getActiveService(): StorageService | null {
    if (!this.activeServiceId) {
      return null;
    }
    return StorageServiceFactory.getService(this.activeServiceId);
  }

  /**
   * Get a specific storage service
   * @param serviceId The ID of the storage service
   * @returns The storage service instance
   */
  getService(serviceId: StorageServiceId): StorageService {
    return StorageServiceFactory.getService(serviceId);
  }

  /**
   * Get all available storage services
   * @returns Array of all storage service instances
   */
  getAllServices(): StorageService[] {
    return StorageServiceFactory.getAllServices();
  }
}

// Export a singleton instance
export const storageManager = new StorageManager();

// Export service instances for direct use
export const storachaService = StorageServiceFactory.getService('storacha');

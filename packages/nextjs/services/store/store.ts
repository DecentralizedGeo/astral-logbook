import create from "zustand";
import scaffoldConfig from "~~/scaffold.config";
import { ChainWithAttributes } from "~~/utils/scaffold-eth";

/**
 * Zustand Store
 *
 * You can add global state to the app using this useGlobalState, to get & set
 * values from anywhere in the app.
 *
 * Think about it as a global useState.
 */

export interface StorageService {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
  isAuthenticated: boolean;
  userEmail?: string;
  activeSpace?: { name: string; did: string };
  lastLoginAt?: Date;
  // Service upload configuration
  uploadEndpoint?: string; // e.g. '/api/storage/storacha/files'
  requiresAuth?: boolean; // whether client must include auth fields (email/space)
  authFields?: string[]; // list of form field names the server expects (eg ['email','spaceDid'])
  allowedFileTypes?: string[]; // client-side validation hint
  maxFileSize?: number; // client-side validation hint (bytes)
}

type GlobalState = {
  nativeCurrencyPrice: number;
  setNativeCurrencyPrice: (newNativeCurrencyPriceState: number) => void;
  targetNetwork: ChainWithAttributes;
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => void;
};

interface StorageStore {
  // Storage services state
  availableServices: StorageService[];
  activeService: StorageService | null;
  showStorageModal: boolean;
  showServiceModal: boolean;
  selectedServiceId: string | null;

  // Storage actions
  setActiveService: (serviceId: string) => void;
  updateServiceAuth: (serviceId: string, isAuthenticated: boolean, userEmail?: string) => void;
  updateServiceSpace: (serviceId: string, activeSpace: { name: string; did: string }) => void;
  toggleStorageModal: () => void;
  toggleServiceModal: (serviceId?: string) => void;
  initializeStorageServices: () => void;
  closeAllModals: () => void;
}

export const useGlobalState = create<GlobalState & StorageStore>((set, get) => ({
  nativeCurrencyPrice: 0,
  setNativeCurrencyPrice: (newValue: number): void => set(() => ({ nativeCurrencyPrice: newValue })),
  targetNetwork: scaffoldConfig.targetNetworks[0],
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => set(() => ({ targetNetwork: newTargetNetwork })),

  // Storage services initial state
  availableServices: [],
  activeService: null,
  showStorageModal: false,
  showServiceModal: false,
  selectedServiceId: null,

  // Storage actions
  setActiveService: (serviceId: string) => {
    const services = get().availableServices.map(service => ({
      ...service,
      isActive: service.id === serviceId,
    }));
    const activeService = services.find(s => s.id === serviceId) || null;

    set({
      availableServices: services,
      activeService,
    });
  },

  updateServiceAuth: (serviceId: string, isAuthenticated: boolean, userEmail?: string) => {
    const services = get().availableServices.map(service => {
      if (service.id === serviceId) {
        const updatedService = {
          ...service,
          isAuthenticated,
          userEmail,
          lastLoginAt: isAuthenticated ? new Date() : service.lastLoginAt,
        };

        // If this service just authenticated, make it active
        if (isAuthenticated) {
          return { ...updatedService, isActive: true };
        }
        return updatedService;
      }
      // Deactivate other services if this one became active
      return isAuthenticated ? { ...service, isActive: false } : service;
    });

    const activeService = services.find(s => s.isActive) || null;

    set({
      availableServices: services,
      activeService,
    });
  },

  updateServiceSpace: (serviceId: string, activeSpace: { name: string; did: string }) => {
    const services = get().availableServices.map(service => {
      if (service.id === serviceId) {
        return { ...service, activeSpace };
      }
      return service;
    });

    const activeService = services.find(s => s.isActive) || null;

    set({
      availableServices: services,
      activeService,
    });
  },

  toggleStorageModal: () =>
    set(state => ({
      showStorageModal: !state.showStorageModal,
      // Close service modal if storage modal is being closed
      showServiceModal: state.showStorageModal ? false : state.showServiceModal,
      selectedServiceId: state.showStorageModal ? null : state.selectedServiceId,
    })),

  toggleServiceModal: (serviceId?: string) =>
    set(state => ({
      showServiceModal: !state.showServiceModal,
      selectedServiceId: state.showServiceModal ? null : serviceId || null,
    })),

  closeAllModals: () =>
    set(() => ({
      showStorageModal: false,
      showServiceModal: false,
      selectedServiceId: null,
    })),

  initializeStorageServices: () => {
    const services: StorageService[] = [
      {
        id: 'storacha',
        name: 'Storacha',
        icon: '/storacha-logo.svg', // We'll add this icon later
        isActive: false,
        isAuthenticated: false,
        // Storacha defaults — these can be updated when a user logs in
        uploadEndpoint: '/api/storage/storacha/files',
        requiresAuth: true,
        authFields: ['email', 'spaceDid'],
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
        maxFileSize: 10 * 1024 * 1024, // 10 MB
      },
      // Future storage services can be added here
    ];

    set({ availableServices: services });
  },
}));

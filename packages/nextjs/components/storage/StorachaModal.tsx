'use client';

import React, { useEffect, useState } from 'react';
import { useGlobalState } from '~~/services/store/store';

interface AuthState {
  email: string;
  isLoading: boolean;
  isVerifying: boolean;
  isVerified: boolean;
  needsPaymentPlan: boolean;
  showSpaceSelection: boolean;
  spaces: Array<{ name: string; did: string }>;
  activeSpace: { name: string; did: string } | null;
  isLoadingSpaces: boolean;
  isCreatingSpace: boolean;
  newSpaceName: string;
  error: string | null;
  success: string | null;
}

export const StorachaModal = () => {
  const { showServiceModal, selectedServiceId, toggleServiceModal, updateServiceAuth, updateServiceSpace } = useGlobalState();

  const [authState, setAuthState] = useState<AuthState>({
    email: '',
    isLoading: false,
    isVerifying: false,
    isVerified: false,
    needsPaymentPlan: false,
    showSpaceSelection: false,
    spaces: [],
    activeSpace: null,
    isLoadingSpaces: false,
    isCreatingSpace: false,
    newSpaceName: '',
    error: null,
    success: null,
  });

  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Check authentication status when modal opens
  useEffect(() => {
    if (showServiceModal && selectedServiceId === 'storacha') {
      const storachaService = useGlobalState.getState().availableServices.find(s => s.id === 'storacha');
      
      if (storachaService?.isAuthenticated && storachaService?.userEmail) {
        // User is already authenticated, skip to space selection
        setAuthState(prev => ({
          ...prev,
          email: storachaService.userEmail || '',
          isVerified: true,
          showSpaceSelection: true,
          isLoadingSpaces: true,
          activeSpace: storachaService.activeSpace || null,
        }));
      }
    }
  }, [showServiceModal, selectedServiceId]);

  // Load spaces when user is verified and space selection should be shown
  useEffect(() => {
    const loadSpacesForAuthenticatedUser = async () => {
      if (authState.isVerified && authState.showSpaceSelection && authState.isLoadingSpaces && authState.email) {
        try {
          const response = await fetch(`/api/storage/storacha/spaces?email=${authState.email}`);
          const result = await response.json();

          if (result.success) {
            setAuthState(prev => ({
              ...prev,
              spaces: result.spaces,
              isLoadingSpaces: false,
              // Keep existing active space if it exists, otherwise set first space
              activeSpace: prev.activeSpace || (result.spaces.length > 0 ? result.spaces[0] : null),
            }));

            // If we have spaces and no active space, set the first one as active
            if (result.spaces.length > 0 && !authState.activeSpace) {
              const firstSpace = result.spaces[0];
              try {
                const setSpaceResponse = await fetch('/api/storage/storacha/spaces', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ email: authState.email, spaceDid: firstSpace.did }),
                });

                if (setSpaceResponse.ok) {
                  setAuthState(prev => ({
                    ...prev,
                    activeSpace: firstSpace,
                  }));
                }
              } catch (error) {
                console.error('Failed to set default active space:', error);
              }
            }
          } else {
            setAuthState(prev => ({
              ...prev,
              isLoadingSpaces: false,
              error: result.message || 'Failed to load spaces',
            }));
          }
        } catch (error) {
          setAuthState(prev => ({
            ...prev,
            isLoadingSpaces: false,
            error: 'Failed to load spaces',
          }));
        }
      }
    };

    loadSpacesForAuthenticatedUser();
  }, [authState.isVerified, authState.showSpaceSelection, authState.isLoadingSpaces, authState.email]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    // Stop polling when modal closes
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    // Reset state
    setAuthState({
      email: '',
      isLoading: false,
      isVerifying: false,
      isVerified: false,
      needsPaymentPlan: false,
      showSpaceSelection: false,
      spaces: [],
      activeSpace: null,
      isLoadingSpaces: false,
      isCreatingSpace: false,
      newSpaceName: '',
      error: null,
      success: null,
    });

    toggleServiceModal();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authState.email.trim()) {
      setAuthState(prev => ({ ...prev, error: 'Please enter your email address' }));
      return;
    }

    setAuthState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      success: null,
    }));

    try {
      const response = await fetch('/api/storage/storacha/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: authState.email }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isVerifying: true,
          success: result.message || 'Verification email sent! Please check your inbox.',
        }));

        // Start polling for verification
        startVerificationPolling();
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || result.message || 'Failed to initiate login',
        }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Network error. Please try again.',
      }));
    }
  };

  const startVerificationPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/storage/storacha/check-verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: authState.email }),
        });

        const result = await response.json();

        if (result.verified) {
          // Success! User is verified
          clearInterval(interval);
          setPollingInterval(null);

          setAuthState(prev => ({
            ...prev,
            isVerifying: false,
            isVerified: true,
            needsPaymentPlan: result.needsPaymentPlan || false,
            success: 'Successfully connected to Storacha!',
            showSpaceSelection: true,
            isLoadingSpaces: true,
          }));

          // Update global state to mark service as authenticated
          updateServiceAuth('storacha', true, authState.email);

          // Load user's spaces
          loadUserSpaces();
        }
      } catch (error) {
        console.error('Verification polling error:', error);
      }
    }, 3000); // Poll every 3 seconds

    setPollingInterval(interval);

    // Stop polling after 5 minutes to prevent infinite polling
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setPollingInterval(null);
        setAuthState(prev => ({
          ...prev,
          isVerifying: false,
          error: 'Verification timeout. Please try again.',
        }));
      }
    }, 5 * 60 * 1000);
  };

  const handleResendVerification = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/storage/storacha/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: authState.email }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          success: 'Verification email resent!',
        }));
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.message || 'Failed to resend verification',
        }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Network error. Please try again.',
      }));
    }
  };

  // Load user's spaces
  const loadUserSpaces = async () => {
    try {
      const response = await fetch(`/api/storage/storacha/spaces?email=${authState.email}`);
      const result = await response.json();

      if (result.success) {
        setAuthState(prev => ({
          ...prev,
          spaces: result.spaces,
          isLoadingSpaces: false,
          // Set first space as active by default if none is selected
          activeSpace: result.spaces.length > 0 && !prev.activeSpace ? result.spaces[0] : prev.activeSpace,
        }));

        // If we have spaces and no active space, set the first one as active
        if (result.spaces.length > 0) {
          await setActiveSpace(result.spaces[0].did);
        }
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoadingSpaces: false,
          error: result.message || 'Failed to load spaces',
        }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoadingSpaces: false,
        error: 'Failed to load spaces',
      }));
    }
  };

  // Set active space
  const setActiveSpace = async (spaceDid: string) => {
    try {
      const response = await fetch('/api/storage/storacha/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: authState.email, spaceDid }),
      });

      const result = await response.json();

      if (result.success) {
        const selectedSpace = authState.spaces.find(space => space.did === spaceDid);
        // Update local state
        setAuthState(prev => ({
          ...prev,
          activeSpace: selectedSpace || null,
          success: 'Space selected successfully!',
        }));

        // Update global state immediately so the rest of the app knows about the change
        if (selectedSpace) {
          updateServiceSpace('storacha', selectedSpace);
        }
      }
    } catch (error) {
      console.error('Failed to set active space:', error);
    }
  };

  // Create new space
  const createNewSpace = async () => {
    if (!authState.newSpaceName.trim()) return;

    setAuthState(prev => ({ ...prev, isCreatingSpace: true, error: null }));

    try {
      const response = await fetch('/api/storage/storacha/create-space', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: authState.newSpaceName.trim(), 
          email: authState.email 
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reload spaces to get the updated list
        await loadUserSpaces();
        
        setAuthState(prev => ({
          ...prev,
          isCreatingSpace: false,
          newSpaceName: '',
          success: 'Space created successfully!',
        }));
      } else {
        setAuthState(prev => ({
          ...prev,
          isCreatingSpace: false,
          error: result.message || 'Failed to create space',
        }));
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isCreatingSpace: false,
        error: 'Network error. Please try again.',
      }));
    }
  };

  // Handle space selection and exit modal
  const handleSpaceSelection = () => {
    if (authState.activeSpace) {
      // Update global state with the selected space
      updateServiceSpace('storacha', authState.activeSpace);
      
      // Close this modal and return to Storage Services modal
      toggleServiceModal('storacha');
    }
  };

  if (!showServiceModal || selectedServiceId !== 'storacha') return null;

  return (
    <div className="modal modal-open" onClick={handleBackdropClick}>
      <div className="modal-box relative bg-white text-black max-w-lg">
        <h3 className="font-bold text-xl mb-6 text-black">
          {authState.isVerified && authState.showSpaceSelection 
            ? 'Manage Storacha Spaces' 
            : 'Storacha Storage Service'}
        </h3>

        {/* Close button */}
        <button
          className="btn btn-sm btn-circle absolute right-2 top-2 bg-gray-100 hover:bg-gray-200 text-black border-0"
          onClick={handleClose}
        >
          ✕
        </button>

        {/* Content */}
        <div className="space-y-6">
          {/* Email Input Form */}
          {!authState.isVerified && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={authState.email}
                  onChange={e => setAuthState(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  className="input input-bordered w-full bg-white text-black border-gray-300 focus:border-blue-500"
                  disabled={authState.isLoading || authState.isVerifying}
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn w-full ${
                  authState.isLoading || authState.isVerifying
                    ? 'btn-disabled loading'
                    : 'bg-blue-600 hover:bg-blue-700 text-white border-0'
                }`}
                disabled={authState.isLoading || authState.isVerifying}
              >
                {authState.isLoading
                  ? 'Initiating...'
                  : authState.isVerifying
                  ? 'Waiting for verification...'
                  : 'Login / Create Account'}
              </button>
            </form>
          )}

          {/* Verification Status */}
          {authState.isVerifying && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="loading loading-spinner loading-sm"></div>
                <div>
                  <h4 className="font-semibold text-yellow-800">Waiting for email verification</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please check your email and click the verification link to continue.
                  </p>
                </div>
              </div>
              <button
                onClick={handleResendVerification}
                className="btn btn-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-0 mt-3"
                disabled={authState.isLoading}
              >
                Resend verification email
              </button>
            </div>
          )}

          {/* Success State - Show space selection */}
          {authState.isVerified && authState.showSpaceSelection && (
            <div className="space-y-4">
              {/* Connection Status */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">Connected to Storacha!</h4>
                    <p className="text-sm text-green-700 mt-1">Email: {authState.email}</p>
                  </div>
                </div>
              </div>

              {/* Space Selection */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Select a Storage Space</h4>
                
                {authState.isLoadingSpaces ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="loading loading-spinner loading-md"></div>
                    <span className="ml-2 text-gray-600">Loading spaces...</span>
                  </div>
                ) : (
                  <>
                    {/* Space Dropdown */}
                    {authState.spaces.length > 0 ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Available Spaces
                          </label>
                          <select
                            value={authState.activeSpace?.did || ''}
                            onChange={(e) => setActiveSpace(e.target.value)}
                            className="select select-bordered w-full bg-white text-black border-gray-300 focus:border-blue-500"
                          >
                            <option value="">Select a space...</option>
                            {authState.spaces.map((space) => (
                              <option key={space.did} value={space.did}>
                                {space.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Active Space Display */}
                        {authState.activeSpace && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-medium text-blue-800">
                                Active Space: {authState.activeSpace.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-600 mb-3">No spaces found. Create your first space to get started.</p>
                      </div>
                    )}

                    {/* Create New Space */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-gray-700 mb-2">Create New Space</h5>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={authState.newSpaceName}
                          onChange={(e) => setAuthState(prev => ({ ...prev, newSpaceName: e.target.value }))}
                          placeholder="Enter space name"
                          className="input input-bordered flex-1 bg-white text-black border-gray-300 focus:border-blue-500"
                          disabled={authState.isCreatingSpace}
                        />
                        <button
                          onClick={createNewSpace}
                          disabled={!authState.newSpaceName.trim() || authState.isCreatingSpace}
                          className={`btn ${
                            authState.isCreatingSpace
                              ? 'btn-disabled loading'
                              : 'bg-blue-600 hover:bg-blue-700 text-white border-0'
                          }`}
                        >
                          {authState.isCreatingSpace ? 'Creating...' : 'Create'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Success State - Simple view when not showing space selection */}
          {authState.isVerified && !authState.showSpaceSelection && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-green-800">Connected to Storacha!</h4>
                  <p className="text-sm text-green-700 mt-1">Email: {authState.email}</p>
                  {authState.needsPaymentPlan && (
                    <p className="text-sm text-yellow-700 mt-1">
                      Note: A payment plan may be required for some features.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {authState.error && (
            <div className="alert alert-error bg-red-50 border border-red-200 text-red-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{authState.error}</span>
            </div>
          )}

          {/* Success Messages */}
          {authState.success && !authState.error && (
            <div className="alert alert-success bg-green-50 border border-green-200 text-green-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{authState.success}</span>
            </div>
          )}

          {/* Space Selection / Management */}
          {authState.showSpaceSelection && authState.isVerified && (
            <div>
              {/* Duplicate management UI removed — top section already provides selection and creation controls. */}
              <div className="text-sm text-gray-600 py-4">
                Use the controls in the "Select a Storage Space" card above to choose or create a space.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-action">
          <button className="btn bg-gray-100 hover:bg-gray-200 text-black border-0" onClick={handleClose}>
            {authState.isVerified ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

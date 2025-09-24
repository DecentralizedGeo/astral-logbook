'use client';

import React from 'react';
import Image from 'next/image';
import { useGlobalState } from '~~/services/store/store';

export const StorageServicesModal = () => {
  const { showStorageModal, availableServices, toggleStorageModal, toggleServiceModal, setActiveService } =
    useGlobalState();

  const handleServiceClick = (serviceId: string) => {
    const service = availableServices.find(s => s.id === serviceId);

    if (service?.isAuthenticated) {
      // Even if authenticated, allow user to open service modal for configuration
      setActiveService(serviceId);
      toggleServiceModal(serviceId);
    } else {
      // If not authenticated, open the service modal
      toggleServiceModal(serviceId);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      toggleStorageModal();
    }
  };

  if (!showStorageModal) return null;

  return (
    <div className="modal modal-open" onClick={handleBackdropClick}>
      <div className="modal-box relative bg-white text-black">
        <h3 className="font-bold text-lg mb-4 text-black">Storage Services</h3>

        {/* Close button */}
        <button
          className="btn btn-sm btn-circle absolute right-2 top-2 bg-gray-100 hover:bg-gray-200 text-black border-0"
          onClick={toggleStorageModal}
        >
          ✕
        </button>

        {/* Services list */}
        <div className="space-y-3">
          {availableServices.map(service => (
            <div
              key={service.id}
              className={`card bg-white border cursor-pointer transition-all hover:shadow-md hover:bg-gray-50 ${
                service.isActive ? 'border-blue-500 shadow-md bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handleServiceClick(service.id)}
            >
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {service.icon.startsWith('/') ? (
                        <Image src={service.icon} alt={service.name} width={32} height={32} className="w-8 h-8" />
                      ) : (
                        <span className="text-2xl">{service.icon}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-black">{service.name}</h4>
                      <p className="text-sm text-gray-600">
                        {service.isAuthenticated ? `Connected as ${service.userEmail}` : 'Not connected'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {service.isAuthenticated && (
                      <div className="badge bg-green-100 text-green-800 border-green-200 badge-sm">Connected</div>
                    )}
                    {service.isActive && (
                      <div className="badge bg-blue-100 text-blue-800 border-blue-200 badge-sm">Active</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {availableServices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No storage services available</p>
          </div>
        )}

        {/* Footer */}
        <div className="modal-action">
          <button className="btn bg-gray-100 hover:bg-gray-200 text-black border-0" onClick={toggleStorageModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

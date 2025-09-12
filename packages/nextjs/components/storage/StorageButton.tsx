'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useGlobalState } from '~~/services/store/store';

export const StorageButton = () => {
  const { activeService, toggleStorageModal, initializeStorageServices } = useGlobalState();

  // Initialize storage services on mount
  useEffect(() => {
    initializeStorageServices();
  }, [initializeStorageServices]);

  const handleClick = () => {
    toggleStorageModal();
  };

  // Use active service icon or default cloud SVG icon
  const renderIcon = () => {
    if (activeService?.icon) {
      return <Image src={activeService.icon} alt={activeService.name} width={20} height={20} className="w-5 h-5" />;
    }

    // Default cloud SVG icon
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    );
  };

  const buttonText = activeService?.name || 'Storage';
  const statusDot = activeService?.isAuthenticated ? (
    <div className="w-2 h-2 bg-green-500 rounded-full absolute -top-1 -right-1"></div>
  ) : null;

  return (
    <div className="relative">
      <button
        className="btn btn-ghost btn-sm gap-2 text-black hover:bg-gray-100"
        onClick={handleClick}
        title={`Storage Services - Active: ${buttonText}${activeService?.isAuthenticated ? ' (Connected)' : ''}`}
      >
        {renderIcon()}
        <span className="hidden md:inline">{buttonText}</span>
      </button>
      {statusDot}
    </div>
  );
};

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
// Import styles
import '../styles/custom-datepicker.css';
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Config, UseChainIdParameters, useAccount, useBalance, useChainId } from 'wagmi';
import { ClockIcon, DocumentTextIcon, MapPinIcon } from '@heroicons/react/24/outline';
import easConfig from '~~/EAS.config';
import { IFormValues } from '~~/app/interface/interface';
import { EASContext } from '~~/components/EasContextProvider';
import { wagmiConfig } from '~~/services/web3/wagmiConfig';
import { useGlobalState } from '~~/services/store/store';
import { DEFAULT_MAX_FILE_SIZE_BYTES, ALLOWED_FILE_TYPES } from '~~/config/storage';

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

/**
 * Form component for creating attestations
 * Handles user input, file uploads, and blockchain interactions
 */

interface CheckinFormProps {
  lngLat: number[];
  setIsTxLoading: (loading: boolean) => void;
}

const CheckinForm: React.FC<CheckinFormProps> = ({ lngLat, setIsTxLoading }) => {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const chainId = useChainId(wagmiConfig as UseChainIdParameters<Config>);
  const { eas, isReady } = React.useContext(EASContext);
  const { data: balance } = useBalance({ address });

  // Form state
  const [formValues, setFormValues] = React.useState<IFormValues>({
    longitude: lngLat[0].toString(),
    latitude: lngLat[1].toString(),
    eventTimestamp: Math.floor(Date.now() / 1000),
    data: '',
    mediaType: [''],
    mediaData: [''],
  });
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [error, setError] = React.useState<string | null>(null);
  const [fileValidationError, setFileValidationError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Update coordinates when map selection changes
  React.useEffect(() => {
    setFormValues(prev => ({
      ...prev,
      longitude: lngLat[0].toString(),
      latitude: lngLat[1].toString(),
    }));
  }, [lngLat]);

  // Form handlers
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setFormValues(prev => ({
        ...prev,
        eventTimestamp: Math.floor(date.getTime() / 1000),
        timestamp: date,
      }));
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Gets schema UID for current chain
  const getSchemaUID = () => {
    if (!chainId) throw new Error('Chain ID is not available');
    const chainConfig = easConfig.chains[chainId.toString() as keyof typeof easConfig.chains];
    if (!chainConfig?.schemaUID) throw new Error(`No schema UID for chain ID ${chainId}`);
    return chainConfig.schemaUID;
  };

  // Handles form submission and attestation creation
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !isConnected) return;

    setIsSubmitting(true);
    setIsTxLoading(true);
    setError(null);

    try {
      // Check balance before proceeding
      console.log('Checking balance...');
      if (!balance || balance.value === 0n) {
        throw new Error('Insufficient balance to create attestation');
      }
      console.log('Completed checking balance.');

      if (!isReady || !eas) {
        throw new Error('EAS is not ready');
      }

      // Upload file if provided
      console.log('Uploading file...');
      const fileInput = (event.target as HTMLFormElement).querySelector('input[type="file"]') as HTMLInputElement;
      const { fileCid, fileType } = await handleFileUpload(fileInput);
      console.log('Completed uploading file.');

      // Create and submit attestation
      console.log('Creating attestation...');
      const schemaUID = getSchemaUID();
      // Make sure the schema string is valid
      const schemaString =
        easConfig.schema.rawString ||
        'uint256 eventTimestamp, string srs, string locationType, string location, string[] recipeType, bytes[] recipePayload, string[] mediaType, string[] mediaData, string memo';

      const encodedData = new SchemaEncoder(schemaString).encodeData([
        { name: 'eventTimestamp', value: formValues.eventTimestamp, type: 'uint256' },
        { name: 'srs', value: 'EPSG:4326', type: 'string' },
        { name: 'locationType', value: 'DecimalDegrees<string>', type: 'string' },
        { name: 'location', value: `${formValues.longitude || '0'}, ${formValues.latitude || '0'}`, type: 'string' },
        { name: 'recipeType', value: ['text/plain'], type: 'string[]' },
        { name: 'recipePayload', value: [ethers.toUtf8Bytes('empty')], type: 'bytes[]' },
        { name: 'mediaType', value: fileType ? [fileType] : ['text/plain'], type: 'string[]' },
        { name: 'mediaData', value: [fileCid || ''], type: 'string[]' },
        { name: 'memo', value: formValues.data || '', type: 'string' },
      ]);

      const tx = await eas.attest({
        schema: schemaUID,
        data: {
          recipient: easConfig.chains[chainId.toString() as keyof typeof easConfig.chains].easContractAddress,
          expirationTime: 0n,
          revocable: true,
          data: encodedData,
        },
      });

      console.log('Submitted attestation');
      const newAttestationUID = await tx?.wait();
      console.log('Completed attestation submission');

      router.push(`/attestation/uid/${newAttestationUID}`);
    } catch (err) {
      console.error('Error creating log entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to create log entry');
    } finally {
      setIsSubmitting(false);
      setIsTxLoading(false);
    }
  };

  // Validate selected file on change and show UI message
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileValidationError(null);
    const f = e.target.files?.[0];
    if (!f) return;

    const state = useGlobalState.getState();
    const activeService = state.activeService || state.availableServices.find(s => s.isAuthenticated) || state.availableServices[0];
    const allowed = activeService?.allowedFileTypes ?? ALLOWED_FILE_TYPES;
    const maxSize = activeService?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE_BYTES;

    if (f.size > maxSize) {
      setFileValidationError(`File too large. Max ${Math.round(maxSize / 1024 / 1024)} MB`);
      return;
    }
    if (f.type && !allowed.includes(f.type)) {
      setFileValidationError('Invalid file type. Allowed types: JPEG, PNG, GIF');
      return;
    }
  };

  return (
    <div className="flex items-center flex-col w-full flex-grow">
      <form onSubmit={handleSubmit} className="card m-5 flex flex-col gap-4">
        {/* Location inputs */}
        <label className="flex flex-row items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-primary flex-shrink-0" />
          <input
            type="number"
            name="longitude"
            value={formValues.longitude}
            onChange={handleInputChange}
            className="input input-bordered w-full bg-base-200 border-indigo-500 text-black"
            required
          />
          <input
            type="number"
            name="latitude"
            value={formValues.latitude}
            onChange={handleInputChange}
            className="input input-bordered w-full bg-base-200 border-indigo-500 text-black"
            required
          />
        </label>

        {/* Date/time picker */}
        <label className="flex flex-row items-center gap-2">
          <ClockIcon className="h-5 w-5 text-primary" />
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            showTimeSelect
            timeIntervals={1}
            dateFormat="Pp"
            className="input input-bordered w-full bg-base-200 border-indigo-500 text-black"
            required
          />
        </label>

        {/* Memo input */}
        <label className="flex flex-row items-center gap-2">
          <DocumentTextIcon className="h-5 w-5 text-primary" />
          <div className="w-full">
            <span className="text-sm text-gray-500 mb-1 block">Memo (optional)</span>
            <input
              type="text"
              name="data"
              value={formValues.data}
              onChange={handleInputChange}
              placeholder="No memo provided."
              className="input input-bordered w-full bg-base-200 border-indigo-500 text-black"
            />
          </div>
        </label>

        {/* File upload */}
        <label className="flex flex-row items-center gap-2">
          <DocumentTextIcon className="h-5 w-5 text-primary" />
          <div className="w-full">
            <span className="text-sm text-gray-500 mb-1 block">Image (optional)</span>
            <input ref={fileInputRef} onChange={handleFileChange} type="file" className="file-input file-input-bordered w-full" accept="image/*" />
          </div>
        </label>

        {fileValidationError && <p className="text-error text-sm">{fileValidationError}</p>}
        {error && <p className="text-error text-sm">{error}</p>}

        {/* Submit button */}
        <button
          type="submit"
          className={`btn ${isConnected ? 'btn-primary' : 'btn-disabled'}`}
          disabled={!isConnected || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner" />
              Recording...
            </>
          ) : isConnected ? (
            'Record Log Entry'
          ) : (
            'Connect to record'
          )}
        </button>
      </form>
    </div>
  );
};

// Handles file upload to Web3.Storage
async function handleFileUpload(fileInput: HTMLInputElement): Promise<{ fileCid: string; fileType: string }> {
  if (!fileInput?.files?.[0]) return { fileCid: '', fileType: '' };

  const file = fileInput.files[0];

  // Resolve active storage service from global store
  const state = useGlobalState.getState();
  // Prefer explicit activeService, otherwise pick the first authenticated service, otherwise first available
  const activeService = state.activeService || state.availableServices.find(s => s.isAuthenticated) || state.availableServices[0];
  if (!activeService) {
    throw new Error('No storage service configured');
  }

  const uploadUrl = activeService.uploadEndpoint || `/api/storage/${activeService.id}/files`;
  const allowed = activeService.allowedFileTypes ?? ALLOWED_FILE_TYPES;
  const maxSize = activeService.maxFileSize ?? DEFAULT_MAX_FILE_SIZE_BYTES;

  // Client-side validation
  if (file.size > maxSize) throw new Error(`File too large. Max ${Math.round(maxSize / 1024 / 1024)} MB`);
  if (file.type && !allowed.includes(file.type)) throw new Error('Invalid file type. Allowed types: JPEG, PNG, GIF');

  const fd = new FormData();
  fd.append('file', file);

  // Include auth fields if the service requires them
  if (activeService.requiresAuth) {
    if (activeService.userEmail) fd.append('email', activeService.userEmail);
    if (activeService.activeSpace?.did) fd.append('spaceDid', activeService.activeSpace.activeSpace?.did ?? activeService.activeSpace?.did);
  }

  const res = await fetch(uploadUrl, { method: 'POST', body: fd });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Upload failed');
  }
  const json = await res.json();
  return { fileCid: json.cid || json.fileId || '', fileType: file.type };
}

export default CheckinForm;

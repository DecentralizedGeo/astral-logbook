'use client';

import { useEffect, useRef, useState } from 'react';
import { IFormValues } from '~~/app/interface/interface';

export default function PinataUpload({
  //formValues,
  setFormValues,
}: {
  formValues: IFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<IFormValues>>;
}) {
  const [, setFile] = useState<File | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud';

  const inputFile = useRef<HTMLInputElement>(null);

  const uploadFile = async (fileToUpload: File) => {
    try {
      setUploading(true);
      setError(null);
      const data = new FormData();
      data.set('file', fileToUpload);
      console.log('[🧪 DEBUG](fileToUpload):', fileToUpload);
      const res = await fetch('/api/files', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const resData = await res.json();
      console.log('[🧪 DEBUG](resData):', resData);
      setCid(resData.IpfsHash);
    } catch (e) {
      console.error('Error uploading file:', e);
      setError(e.message || 'Trouble uploading file');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (cid) setFormValues(prev => ({ ...prev, mediaData: [cid] }));
  }, [cid, setFormValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      //check for allowed file types
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please select a JPEG, PNG, GIF, or PDF file');
        return;
      }

      //check for maximum file size
      const maxFileSize = 10 * 1024 * 1024; // 10 MB
      if (selectedFile.size > maxFileSize) {
        setError('File size exceeds 10 MB limit. Please select a smaller file.');
        return;
      }

      setFile(selectedFile);
      setFormValues(prev => ({ ...prev, mediaType: [selectedFile.type] }));
      uploadFile(selectedFile);
    }
  };

  return (
    <div className="relative">
      <label className="flex flex-row items-center gap-2 w-full">
        <input
          type="file"
          ref={inputFile}
          onChange={handleChange}
          accept="image/*,.pdf"
          name="file"
          // value={cid}
          className="input input-bordered file-input file-input-primary w-full bg-base-200 border-indigo-500 text-black p-0"
        />
      </label>
      {uploading && <progress className="progress w-56 progress-primary absolute mt-1 ml-1" />}
      {error && <p className="text-red-500 mt-1">{error}</p>}
      {cid && (
        <img src={`https://${GATEWAY_URL}/ipfs/${cid}`} alt="file upload" className="m-1 border-4 border-primary" />
      )}
    </div>
  );
}

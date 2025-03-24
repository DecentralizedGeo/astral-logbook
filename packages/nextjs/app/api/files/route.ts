/**
 * API route handler for file uploads to Web3.Storage
 * Handles both text and file uploads, validates files, and returns IPFS URIs
 * Route: /api/files
 */

import { NextRequest, NextResponse } from "next/server";
import * as Client from '@web3-storage/w3up-client';
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory';
import * as Proof from '@web3-storage/w3up-client/proof';
import { Signer } from '@web3-storage/w3up-client/principal/ed25519';
import { File, Blob } from 'node:buffer';

export const runtime = "nodejs";

// Configuration constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif"];

// Initializes and configures Web3.Storage client
async function getW3Client() {
  if (!process.env.NEXT_PUBLIC_WEB3STORAGE_KEY || !process.env.NEXT_PUBLIC_WEB3STORAGE_PROOF) {
    throw new Error('Web3Storage credentials not configured');
  }

  // Initialize client with private key
  const principal = Signer.parse(process.env.NEXT_PUBLIC_WEB3STORAGE_KEY);
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });

  // Setup space delegation
  const proof = await Proof.parse(process.env.NEXT_PUBLIC_WEB3STORAGE_PROOF);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());

  return client;
}

// Process memo and file upload requests
export async function POST(request: NextRequest) {
  try {
    const client = await getW3Client();
    const data = await request.formData();
    
    // Process memo upload
    const text = data.get("text");
    if (text) {
      try {
        // Create and upload text file
        const textFile = new File(
          [Buffer.from(text)],
          'memo.txt',
          { type: 'text/plain' }
        );
        
        const cid = await client.uploadFile(textFile);

        // Check storage status
        try {
          const storageInfo = await client.capability.store.list({ contains: cid });
          return NextResponse.json({
            cid: cid.toString(),
            storage: storageInfo,
            uri: `https://${cid.toString()}.ipfs.dweb.link`
          }, { status: 200 });
        } catch (storageError) {
          console.error('Storage status check failed:', storageError);
          return NextResponse.json({
            cid: cid.toString(),
            error: "Storage status check failed",
            uri: `https://${cid.toString()}.ipfs.dweb.link`
          }, { status: 200 });
        }
      } catch (error) {
        console.error('Text upload failed:', error);
        return NextResponse.json({
          error: "Failed to upload text content"
        }, { status: 500 });
      }
    }

    // Process file upload
    const file = data.get("file") as unknown as File;
    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 200 });
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: "File size exceeds 10 MB limit" 
      }, { status: 400 });
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only JPEG, PNG and GIF are allowed" 
      }, { status: 400 });
    }

    try {
      // Upload file to Web3.Storage
      const cid = await client.uploadFile(file);

      // Verify storage
      try {
        const storageInfo = await client.capability.store.list({ contains: cid });
        return NextResponse.json({
          cid: cid.toString(),
          storage: storageInfo,
          uri: `https://${cid.toString()}.ipfs.dweb.link/${file.name}`
        }, { status: 200 });
      } catch (storageError) {
        console.error('Storage verification failed:', storageError);
        return NextResponse.json({
          cid: cid.toString(),
          error: "Storage verification failed",
          uri: `https://${cid.toString()}.ipfs.dweb.link/${file.name}`
        }, { status: 200 });
      }
    } catch (error) {
      console.error('File upload failed:', error);
      return NextResponse.json({ 
        error: "Failed to upload file" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Request failed:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}
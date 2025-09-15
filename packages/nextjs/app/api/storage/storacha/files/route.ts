import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedAccount } from '../shared';
import { ALLOWED_FILE_TYPES, DEFAULT_MAX_FILE_SIZE_BYTES } from '~~/config/storage';

export const runtime = 'nodejs';

// Validation constants (match /api/files behavior)
const MAX_FILE_SIZE = DEFAULT_MAX_FILE_SIZE_BYTES; // 10 MB default
const ALLOWED_FILE_TYPES_LOCAL = ALLOWED_FILE_TYPES;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const email = formData.get('email') as string;
    const spaceDid = (formData.get('spaceDid') as string) || undefined;

    if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });
    // Basic validation
    try {
      const size = (file as any).size ?? 0;
      const type = (file as any).type ?? '';
      if (size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File size exceeds ${MAX_FILE_SIZE} bytes limit` }, { status: 400 });
      }
      if (type && !ALLOWED_FILE_TYPES_LOCAL.includes(type)) {
        return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG and GIF are allowed' }, { status: 400 });
      }
    } catch (e) {
      // Proceed — some runtimes may not expose size/type; let the upload attempt catch errors
    }
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const verifiedAccount = getVerifiedAccount(email);
    if (!verifiedAccount) {
      return NextResponse.json({ error: 'User not verified. Please login first.' }, { status: 401 });
    }

    try {
      // Convert to Blob suitable for client.uploadFile
      const buffer = await file.arrayBuffer();
      const fileBlob = new Blob([buffer], { type: file.type });

      // If a space DID was provided, ensure it exists and set it
      if (spaceDid) {
        const spaces = await verifiedAccount.client.spaces();
        const found = Array.from(spaces).find((s: any) => {
          const sDid = typeof (s as any).did === 'function' ? (s as any).did() : (s as any).did;
          return sDid === spaceDid;
        });

        if (!found) {
          return NextResponse.json({ error: `Space with DID '${spaceDid}' not found` }, { status: 404 });
        }

        await verifiedAccount.client.setCurrentSpace(spaceDid);
      }

      // Upload using Storacha client
      const result = await verifiedAccount.client.uploadFile(fileBlob);

      return NextResponse.json({ success: true, cid: result.toString(), message: 'File uploaded successfully' });
    } catch (err) {
      console.error('Storacha file upload failed:', err);
      return NextResponse.json(
        { error: 'Failed to upload file', message: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error('Storacha files route error:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

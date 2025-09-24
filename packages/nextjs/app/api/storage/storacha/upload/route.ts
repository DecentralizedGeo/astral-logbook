import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedAccount } from '../shared';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const spaceDid = formData.get('spaceDid') as string;
    const email = formData.get('email') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!spaceDid) {
      return NextResponse.json({ error: 'Space DID is required' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user is verified
    const verifiedAccount = getVerifiedAccount(email);
    if (!verifiedAccount) {
      return NextResponse.json({ error: 'User not verified. Please login first.' }, { status: 401 });
    }

    try {
      // Convert File to appropriate format for Storacha
      const fileBuffer = await file.arrayBuffer();
      const fileBlob = new Blob([fileBuffer], { type: file.type });

      // Set current space by DID
      const spaces = await verifiedAccount.client.spaces();
      const selectedSpace = Array.from(spaces).find((space: any) => {
        const sDid = typeof (space as any).did === 'function' ? (space as any).did() : (space as any).did;
        return sDid === spaceDid;
      });

      if (!selectedSpace) {
        return NextResponse.json({ error: `Space with DID '${spaceDid}' not found` }, { status: 404 });
      }

      await verifiedAccount.client.setCurrentSpace(spaceDid);

      // Upload file
      const result = await verifiedAccount.client.uploadFile(fileBlob);

      return NextResponse.json({
        success: true,
        cid: result.toString(),
        message: 'File uploaded successfully',
      });
    } catch (storageError) {
      console.error('Storacha upload error:', storageError);
      return NextResponse.json(
        {
          error: 'Failed to upload file',
          message: storageError instanceof Error ? storageError.message : 'Unknown storage error',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

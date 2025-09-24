import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedAccount, setVerifiedAccount, getPendingVerification, verifiedAccounts, pendingVerifications } from '../shared';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // No debug logging in production - keep the route concise

    // Check if user is verified
    const verifiedAccount = getVerifiedAccount(email);
    if (!verifiedAccount) {
      // If verification is still pending, inform the client to keep polling
      const pending = getPendingVerification(email);
      if (pending) {
        return NextResponse.json({ verified: false, pending: true, message: 'Verification in progress' }, { status: 202 });
      }

      return NextResponse.json({ error: 'User not verified. Please login first.' }, { status: 401 });
    }

    try {
      // List spaces using Storacha client
      const spaces = await verifiedAccount.client.spaces();
      const spaceArray = Array.from(spaces).map((space: any) => ({
        name: typeof space.name === 'function' ? space.name() : space.name,
        did: typeof space.did === 'function' ? space.did() : space.did,
      }));

      // Update the verified account with available spaces
      const updatedAccount = {
        ...verifiedAccount,
        availableSpaces: spaceArray,
      };
      setVerifiedAccount(email, updatedAccount);

      return NextResponse.json({
        success: true,
        spaces: spaceArray,
      });
    } catch (storageError) {
      console.error('Storacha spaces list error:', storageError);
      return NextResponse.json(
        {
          error: 'Failed to list spaces',
          message: storageError instanceof Error ? storageError.message : 'Unknown storage error',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Spaces list error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, spaceDid } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required and must be a string' }, { status: 400 });
    }

    if (!spaceDid || typeof spaceDid !== 'string') {
      return NextResponse.json({ error: 'Space DID is required and must be a string' }, { status: 400 });
    }

    // Check if user is verified
    const verifiedAccount = getVerifiedAccount(email);
    if (!verifiedAccount) {
      return NextResponse.json({ error: 'User not verified. Please login first.' }, { status: 401 });
    }

    try {
      // Set the active space
      const spaces = await verifiedAccount.client.spaces();
      const selectedSpace = Array.from(spaces).find((space: any) => {
        const sDid = typeof space.did === 'function' ? space.did() : space.did;
        return sDid === spaceDid;
      });

      if (!selectedSpace) {
        return NextResponse.json({ error: 'Space not found' }, { status: 404 });
      }

      // Set the space as current on the client (use the DID)
      await verifiedAccount.client.setCurrentSpace(spaceDid);

      // Resolve name/did using the space methods if available
      const resolvedName = typeof (selectedSpace as any).name === 'function' ? (selectedSpace as any).name() : (selectedSpace as any).name;
      const resolvedDid = typeof (selectedSpace as any).did === 'function' ? (selectedSpace as any).did() : (selectedSpace as any).did;

      // Update the verified account with active space
      const updatedAccount = {
        ...verifiedAccount,
        activeSpace: {
          name: resolvedName,
          did: resolvedDid,
        },
      };
      setVerifiedAccount(email, updatedAccount);

      return NextResponse.json({
        success: true,
        activeSpace: updatedAccount.activeSpace,
        message: 'Space set as active successfully',
      });
    } catch (storageError) {
      console.error('Storacha set space error:', storageError);
      return NextResponse.json(
        {
          error: 'Failed to set active space',
          message: storageError instanceof Error ? storageError.message : 'Unknown storage error',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Set space error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

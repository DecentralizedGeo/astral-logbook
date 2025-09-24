import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedAccount } from '../shared';

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Space name is required and must be a string' }, { status: 400 });
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required and must be a string' }, { status: 400 });
    }

    // Check if user is verified
    const verifiedAccount = getVerifiedAccount(email);
    if (!verifiedAccount) {
      return NextResponse.json({ error: 'User not verified. Please login first.' }, { status: 401 });
    }

    try {
      // Create space using Storacha client
      const space = await verifiedAccount.client.createSpace(name);

      return NextResponse.json({
        success: true,
        space: {
          name: space.name || name,
          did: space.did,
        },
        message: 'Space created successfully',
      });
    } catch (storageError) {
      console.error('Storacha space creation error:', storageError);
      return NextResponse.json(
        {
          error: 'Failed to create space',
          message: storageError instanceof Error ? storageError.message : 'Unknown storage error',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Create space error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // Check if user is verified
    const verifiedAccount = getVerifiedAccount(email);
    if (!verifiedAccount) {
      return NextResponse.json({ error: 'User not verified. Please login first.' }, { status: 401 });
    }

    try {
      // List spaces using Storacha client
      const spaces = await verifiedAccount.client.spaces();

      return NextResponse.json({
        success: true,
        spaces: Array.from(spaces).map((space: any) => ({
          name: space.name,
          did: space.did,
        })),
      });
    } catch (storageError) {
      console.error('Storacha list spaces error:', storageError);
      return NextResponse.json(
        {
          error: 'Failed to list spaces',
          message: storageError instanceof Error ? storageError.message : 'Unknown storage error',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('List spaces error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

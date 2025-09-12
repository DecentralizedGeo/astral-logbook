import { NextRequest, NextResponse } from 'next/server';
import { clearAccountData } from '../shared';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required and must be a string' }, { status: 400 });
    }

    // Clear existing pending and verified data for this email
    clearAccountData(email);

    // Redirect to login endpoint to restart the flow
    const loginResponse = await fetch(`${request.nextUrl.origin}/api/storage/storacha/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result = await loginResponse.json();

    return NextResponse.json({
      success: loginResponse.ok,
      message: result.message || (loginResponse.ok ? 'Verification email resent' : 'Failed to resend'),
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

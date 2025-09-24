import { NextRequest, NextResponse } from 'next/server';
import { getPendingVerification, getVerifiedAccount } from '../shared';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required and must be a string' }, { status: 400 });
    }

    // Check if user is verified
    const verifiedAccount = getVerifiedAccount(email);
    if (verifiedAccount) {
      return NextResponse.json({
        verified: true,
        needsPaymentPlan: !verifiedAccount.hasPaymentPlan,
        account: {
          did: verifiedAccount.account.did || 'unknown',
        },
      });
    }

    // Check if verification is pending
    const pendingVerification = getPendingVerification(email);
    if (pendingVerification) {
      return NextResponse.json({
        verified: false,
        pending: true,
        message: 'Verification in progress',
      });
    }

    // No verification found
    return NextResponse.json({
      verified: false,
      message: 'No verification found for this email',
    });
  } catch (error) {
    console.error('Check verification error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getPendingVerification,
  getVerifiedAccount,
  removePendingVerification,
  setPendingVerification,
  setVerifiedAccount,
} from '../shared';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required and must be a string' }, { status: 400 });
    }

    // Check if user is already verified
    if (getVerifiedAccount(email)) {
      return NextResponse.json({
        success: true,
        message: 'User already verified',
        verified: true,
      });
    }

    // Check if there's already a pending verification for this email
    if (getPendingVerification(email)) {
      return NextResponse.json({
        success: true,
        message: 'Verification already in progress',
        pending: true,
      });
    }

    // Create Storacha client using dynamic import
    const { create: createStorachaClient } = await import('@storacha/client');

    // For serverless environments, we need to handle the store configuration carefully
    let client;
    try {
      // Try to set environment variable to use /tmp directory
      if (typeof process !== 'undefined' && process.env) {
        process.env.XDG_CONFIG_HOME = '/tmp';
        process.env.HOME = '/tmp';
      }
      client = await createStorachaClient();
    } catch (error) {
      console.warn(
        'Failed to create client with default store, this might be due to filesystem restrictions in serverless environment:',
        error,
      );
      throw error;
    }

    // Start login process
    const loginPromise = client.login(email);

    // Store pending verification
    setPendingVerification(email, {
      client,
      loginPromise,
      timestamp: new Date(),
    });

    // Handle the login promise resolution in the background
    loginPromise
      .then((account: any) => {
        // Move from pending to verified
        const pending = getPendingVerification(email);
        if (pending) {
          setVerifiedAccount(email, {
            account,
            client: pending.client,
            hasPaymentPlan: false, // Will be checked later
            timestamp: new Date(),
          });
          removePendingVerification(email);
          console.log(`Login successful for ${email}`);
        }
      })
      .catch((error: any) => {
        console.error(`Login failed for ${email}:`, error);
        removePendingVerification(email);
      });

    return NextResponse.json({
      success: true,
      message: 'Login initiated. Please check your email for verification.',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

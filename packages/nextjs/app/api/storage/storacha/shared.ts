/**
 * Shared storage for Storacha authentication state
 * In production, this should be replaced with a proper database
 */

function normalizeEmail(email: string) {
  return email?.trim().toLowerCase();
}

export interface PendingVerification {
  client: any;
  loginPromise: Promise<any>;
  timestamp: Date;
}

export interface VerifiedAccount {
  account: any;
  client: any;
  hasPaymentPlan: boolean;
  activeSpace?: any; // The currently selected space
  availableSpaces?: any[]; // List of available spaces
  timestamp: Date;
}

// Shared in-memory storage
export const pendingVerifications = new Map<string, PendingVerification>();
export const verifiedAccounts = new Map<string, VerifiedAccount>();

// Helper functions
export function getVerifiedAccount(email: string): VerifiedAccount | undefined {
  const key = normalizeEmail(email);
  return verifiedAccounts.get(key);
}

export function getPendingVerification(email: string): PendingVerification | undefined {
  const key = normalizeEmail(email);
  return pendingVerifications.get(key);
}

export function clearAccountData(email: string): void {
  const key = normalizeEmail(email);
  verifiedAccounts.delete(key);
  pendingVerifications.delete(key);
}

export function setPendingVerification(email: string, data: PendingVerification): void {
  const key = normalizeEmail(email);
  pendingVerifications.set(key, data);
}

export function setVerifiedAccount(email: string, data: VerifiedAccount): void {
  const key = normalizeEmail(email);
  verifiedAccounts.set(key, data);
}

export function removePendingVerification(email: string): void {
  const key = normalizeEmail(email);
  pendingVerifications.delete(key);
}

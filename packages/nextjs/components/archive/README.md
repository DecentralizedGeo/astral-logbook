# Archived Components

This directory contains components that are not currently in use but are preserved for future reference.

## Piniata.tsx
- **Purpose**: File upload component for Pinata IPFS service
- **Archived Date**: September 12, 2025
- **Reason**: Component calls `/api/files` endpoint which doesn't exist. Preserved for future Pinata integration.
- **Dependencies**: 
  - Requires `/api/files` API route
  - Uses Pinata service for IPFS uploads
  - Expects `IpfsHash` response format
- **Usage**: File upload with validation (max 10MB, JPEG/PNG/GIF/PDF)

## To Restore:
1. Move component back to `/components/` directory
2. Create the missing `/api/files` API route
3. Configure Pinata API credentials
4. Import and use in desired components

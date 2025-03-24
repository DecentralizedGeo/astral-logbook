# Deployment Guide

This guide provides detailed instructions for deploying an instance of the decentralized location logger application.

## Initial Setup

### 1. Fork and Clone the Repository

- Click the "Fork" button in the upper right corner to create your own copy
- Clone your forked repository to your local machine:
  ```
  git clone https://github.com/YOUR-USERNAME/logbook-filecoin.git
  cd logbook-filecoin
  ```
- This creates a local copy of the codebase that you can modify and deploy

### 2. Build & Configure

- Install dependencies:  
  ```
  yarn install
  ```
  This installs all required dependencies for the project.

- In `/packages/nextjs/`, copy `.env.example` to `.env.local`:
  ```
  cd packages/nextjs
  cp .env.example .env.local
  ```

- Configure the following required environment variables in your `.env.local` file:
  - `NEXT_PUBLIC_MAPBOX_TOKEN`: Your Mapbox API token
  - `NEXT_PUBLIC_WEB3STORAGE_TOKEN`: Your Web3.Storage API token
  - `NEXT_PUBLIC_WEB3STORAGE_PROOF`: Your Web3.Storage proof string

### 3. How to get the required tokens:

#### Mapbox Access Token:
1. Create an account or sign in at [Mapbox](https://account.mapbox.com/auth/signup/)
2. Navigate to your Account → Access Tokens
3. Create a new token with the default public scopes
4. Copy the token to your `.env.local` file

#### Web3.Storage Tokens:
1. Create an account or sign in at [Web3.Storage](https://console.web3.storage/)
2. Create a space ([instructions](https://docs.storacha.network/how-to/ci/#create-a-space))
3. Create a signing key ([instructions](https://docs.storacha.network/how-to/ci/#create-a-signing-key)) - this will be your `NEXT_PUBLIC_WEB3STORAGE_TOKEN`
4. Create a proof ([instructions](https://docs.storacha.network/how-to/ci/#create-a-proof)) - this will be your `NEXT_PUBLIC_WEB3STORAGE_PROOF`

## IPFS Setup

### 1. Install and Configure IPFS

- Install IPFS Desktop or Command-line:
  - Desktop: Download from [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/)
  - Command-line: Follow the [command-line installation guide](https://docs.ipfs.tech/install/command-line/)

- Initialize IPFS (if using command-line):
  ```
  ipfs init
  ```
  This creates a local IPFS repository in `~/.ipfs` by default.

## Running the Application

### 1. Start the IPFS Daemon
```
ipfs daemon
```
This runs a local IPFS node that manages the decentralized file storage system, allowing your application to store and retrieve files from the IPFS network.

### 2. Launch the Application
In a separate terminal, navigate to the Next.js directory and start the development server:
```
cd packages/nextjs
yarn dev
```
This launches the frontend application on a local development server.

## Production Deployment

For production deployment, build the application:

```
cd packages/nextjs
yarn build
```

You can then deploy the built application to platforms like Vercel, Netlify, or any other hosting service that supports Next.js applications.
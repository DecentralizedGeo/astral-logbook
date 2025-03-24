# Troubleshooting

This guide covers common issues you might encounter when setting up or running the decentralized location logger application and provides solutions.

## IPFS Connection Issues

**Symptoms:**
- Files fail to upload
- Error messages related to IPFS connection
- Browser console shows network errors when trying to connect to IPFS

**Solutions:**
- Ensure the IPFS daemon is running in a separate terminal
- Try restarting the IPFS daemon:
  ```
  ipfs shutdown
  ipfs daemon
  ```

## Web3.Storage Upload Failures

**Symptoms:**
- Files upload to IPFS but not to Web3.Storage
- Error messages related to Web3.Storage authentication

**Solutions:**
- Verify your token and proof are correct in `.env.local`
- Ensure the tokens have not expired
- Check file size limits (under 10MB per file)
- Verify your Web3.Storage account has sufficient storage space
- Check the browser console for specific error messages

## Wallet Connection Issues

**Symptoms:**
- "Please connect wallet" message persists
- Transactions fail to initiate
- Application doesn't recognize connected wallet

**Solutions:**
- Ensure your wallet is installed and unlocked
- Check that you're connected to the correct network
- Try disconnecting and reconnecting your wallet to the application
- Clear your browser cache and reload the application
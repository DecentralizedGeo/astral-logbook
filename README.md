# Decentralized Location Logger

This is a proof of concept of a decentralized application for recording location data with IPFS storage and Filecoin backups via web3.storage, built on [Astral Logbook](https://github.com/DecentralizedGeo/astral-logbook).

## Documentation

- [Getting Started & Functionality](docs/getting-started.md)
- [Technology Stack & Architecture](docs/technology-stack.md) 
- [Prerequisites](docs/prerequisites.md)
- [Deployment Guide](docs/deployment-guide.md)
- [Troubleshooting](docs/troubleshooting.md)

## Quick Start

```bash
# Fork the repository

# Clone the repository
git clone https://github.com/YOUR-USERNAME/logbook-filecoin.git

# Install dependencies
cd logbook-filecoin
yarn install

# Set up environment variables
cd packages/nextjs
cp .env.example .env.local

# Edit .env.local with your API keys

# Start the development server
yarn dev
```

For complete setup instructions, see the [Deployment Guide](docs/deployment-guide.md).

## License
This project is licensed under the [MIT License](LICENSE).
/**
 * EAS (Ethereum Attestation Service) context provider
 * Manages the EAS instance and its connection state for the application
 */

import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { createContext, useEffect, useState } from "react";
import { Config, UseChainIdParameters, useChainId } from "wagmi";
import easConfig from "~~/EAS.config";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { useEthersSigner } from "~~/utils/useEthersSigner";

// Type definition for EAS context value
interface EASContextValue {
  eas: EAS | null;
  isReady: boolean;
}

// Create context with default values
const EASContext = createContext<EASContextValue>({
  eas: null,
  isReady: false
});

// Makes EAS instance available to child components
const EASProvider = ({ children }: { children: React.ReactNode }) => {
  const signer = useEthersSigner();
  const chainId = useChainId(wagmiConfig as UseChainIdParameters<Config>);
  const [eas, setEAS] = useState<EAS | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize or update EAS instance when chain or signer changes
  useEffect(() => {
    if (!chainId) return;

    try {
      // Get contract address for current chain
      const contractAddress = easConfig.chains[String(chainId) as keyof typeof easConfig.chains]?.easContractAddress;
      
      if (!contractAddress) {
        console.error('No EAS contract address for chain:', chainId);
        return;
      }

      // Create and configure new EAS instance
      const newEAS = new EAS(contractAddress);
      if (signer) {
        newEAS.connect(signer);
      }

      setEAS(newEAS);
      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize EAS:', error);
      setIsReady(false);
    }
  }, [chainId, signer]);

  return (
    <EASContext.Provider value={{ eas, isReady }}>
      {children}
    </EASContext.Provider>
  );
};

export { EASContext, EASProvider };
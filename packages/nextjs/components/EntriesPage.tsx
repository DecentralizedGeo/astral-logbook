"use client";

/**
 * Component for displaying user's attestation entries on a map
 * Provides filtering and interactive features
 */

import React, { useCallback, useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import EntriesMap from './EntriesMap';
import EntriesFilter, { FilterOptions } from './EntriesFilter';
import easConfig from "~~/EAS.config";
import { useAccount } from 'wagmi';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

// Initialize Apollo Client for GraphQL queries
const client = new ApolloClient({
  uri: 'https://sepolia.easscan.org/graphql',
  cache: new InMemoryCache(),
});

 // Single entry with location and metadata
interface Entry {
  id: string;                    
  coordinates: [number, number]; 
  timestamp: string;            
  memo: string;
  media?: string;                 
  uid: string;                  
}

 // GraphQL query to fetch attestations for a specific address and schema
const GET_ATTESTATIONS = gql`
  query GetAttestations($attester: String!, $schemaId: String!) {
    attestations(where: { attester: { equals: $attester }, schemaId: { equals: $schemaId } }) {
      id attester decodedDataJson time schemaId
    }
  }
`;

// Debounce function to limit the rate of function calls
const debounce = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
};

// Helper function to check if entry passes time of day filter
const getTimeOfDay = (timestamp: string): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hours = new Date(timestamp).getHours();
  if (hours >= 6 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 18) return 'afternoon';
  if (hours >= 18 && hours < 24) return 'evening';
  return 'night';
};

// Fetching, processing, and displaying attestation data on a map
const EntriesPage = () => {
  const router = useRouter();
  const { targetNetwork } = useTargetNetwork();
  const { address } = useAccount();
  
  // Component state
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredEntry, setHoveredEntry] = useState<Entry | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number, y: number } | null>(null);
  const navigationLock = useRef(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: { from: null, to: null },
    keywords: '',
    hasMedia: null,
    timeOfDay: {
      morning: false,
      afternoon: false,
      evening: false,
      night: false
    }
  });

  // Fetches and processes attestation entries from the blockchain
  const fetchEntries = useCallback(async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    try {
      // Get schema ID for current network
      const schemaId = easConfig.chains[targetNetwork.id.toString() as keyof typeof easConfig.chains]?.schemaUID;
      
      // Fetch attestations
      const { data } = await client.query({
        query: GET_ATTESTATIONS,
        variables: { attester: address, schemaId }
      });

      // Process and validate attestation data
      const processedEntries = data?.attestations
        .map((att: any) => {
          try {
            const decodedData = JSON.parse(att.decodedDataJson);
            
            // Extract required fields from attestation
            const locationData = decodedData.find((item: any) => item.name === 'location')?.value?.value;
            const timestampData = decodedData.find((item: any) => item.name === 'eventTimestamp')?.value?.value?.hex;
            const memoData = decodedData.find((item: any) => item.name === 'memo')?.value?.value;
            const mediaData = decodedData.find((item: any) => item.name === 'mediaData')?.value?.value?.[0];

            if (!locationData || !timestampData) return null;

            // Parse location string into coordinates
            const [longitude, latitude] = locationData.split(',').map(Number);
            if (isNaN(longitude) || isNaN(latitude)) return null;

            const entry = {
              id: att.id,
              coordinates: [longitude, latitude] as [number, number],
              timestamp: new Date(parseInt(timestampData, 16) * 1000).toISOString(),
              memo: memoData || '',
              media: mediaData || undefined,
              uid: att.id
            };

            console.log('Processed entry with media:', { decodedData, mediaData, entry });
            return entry;
          } catch (error) {
            return null;
          }
        })
        .filter(Boolean);

      setEntries(processedEntries);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch entries');
    } finally {
      setIsLoading(false);
    }
  }, [address, targetNetwork.id]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Apply filters to entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Date range filter
      if (filters.dateRange.from && new Date(entry.timestamp) < filters.dateRange.from) {
        return false;
      }
      if (filters.dateRange.to) {
        const endDate = new Date(filters.dateRange.to);
        endDate.setDate(endDate.getDate() + 1);
        if (new Date(entry.timestamp) > endDate) {
          return false;
        }
      }

      // Keywords filter
      if (filters.keywords && !entry.memo.toLowerCase().includes(filters.keywords.toLowerCase())) {
        return false;
      }

      // Media filter
      if (filters.hasMedia === true && !entry.media) {
        return false;
      }
      if (filters.hasMedia === false && entry.media) {
        return false;
      }

      // Time of day filter
      const entryTimeOfDay = getTimeOfDay(entry.timestamp);
      const timeFiltersActive = Object.values(filters.timeOfDay).some(v => v);
      
      if (timeFiltersActive && !filters.timeOfDay[entryTimeOfDay]) {
        return false;
      }

      return true;
    });
  }, [entries, filters]);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  const handleEntryClick = useCallback(
    debounce((entryUid: string) => {
      if (navigationLock.current) return;
      navigationLock.current = true;
      router.push(`/attestation/uid/${entryUid}`);
    }, 300),
    [router]
  );

  useEffect(() => {
    return () => {
      navigationLock.current = false;
    };
  }, []);

  // Handle marker hover to show entry details
  const handleMarkerHover = useCallback((entry: Entry, event: MouseEvent) => {
    console.log('Hover entry:', entry);
    setHoveredEntry({
      id: entry.id,
      coordinates: entry.coordinates,
      timestamp: entry.timestamp,
      memo: entry.memo,
      media: entry.media,
      uid: entry.uid
    });
    setHoverPosition({
      x: event.clientX,
      y: event.clientY - 20
    });
  }, []);

  // Clear both hover states when leaving a marker
  const handleMarkerLeave = useCallback(() => {
    // Ensure both states are cleared immediately
    requestAnimationFrame(() => {
      setHoveredEntry(null);
      setHoverPosition(null);
    });
  }, []);

  return (
    <main className="p-5 border border-black bg-[#f0f0f0] min-h-screen flex flex-col lg:flex-row">
      <div className="relative flex-1">
        <EntriesMap
          entries={filteredEntries}
          onMarkerClick={(entry) => handleEntryClick(entry.uid)}
          onMarkerHover={handleMarkerHover}
          onMarkerLeave={handleMarkerLeave}
        />
        {hoveredEntry && hoverPosition && (
          <div
            className="absolute z-10 p-3 mb-3 cursor-pointer bg-[#009900] text-white hover:bg-[#007700] transition-colors duration-200 rounded-lg break-words"
            style={{
              left: hoverPosition.x,
              top: hoverPosition.y,
              transform: 'translate(-50%, -100%)',
              minWidth: '200px',
              maxWidth: '300px'
            }}
          >
            <div className="text-sm mb-1">
              {new Date(hoveredEntry.timestamp).toLocaleString()}
            </div>
            <div className="text-base">
              {hoveredEntry.memo}
            </div>
            {hoveredEntry.media && (
              <div className="mt-1 text-sm">
                📎 Media attached
              </div>
            )}
          </div>
        )}
      </div>
      <div className="lg:w-1/3 p-4 border-t lg:border-t-0 lg:border-l border-black overflow-y-auto max-h-screen">
        <h2 className="text-[#009900] mb-4 text-xl font-semibold">Historical Locations</h2>
        
        {/* Filter Component */}
        <EntriesFilter 
          onFilterChange={handleFilterChange}
          entriesCount={entries.length}
          filteredCount={filteredEntries.length}
        />
        
        {filteredEntries.length === 0 ? (
          <div className="p-4 bg-gray-100 rounded text-center text-gray-500">
            No entries match your filters
          </div>
        ) : (
          [...filteredEntries]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map(entry => (
            <div 
              key={entry.id} 
              className="p-3 mb-3 cursor-pointer bg-[#009900] text-white hover:bg-[#007700] transition-colors duration-200 rounded-lg break-words" 
              onClick={() => handleEntryClick(entry.uid)}
            >
              <p className="text-sm mb-1 border-b border-[#007700] pb-1">
                <strong>Time:</strong> {new Date(entry.timestamp).toLocaleString()}
              </p>
              {entry.media && (
                <p className="text-sm mb-1">
                  <strong>Media:</strong> {entry.media}
                </p>
              )}
              {entry.memo && entry.memo !== 'No memo' && (
                <p className="text-sm">
                  <strong>Memo:</strong> {entry.memo}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
};

export default EntriesPage;
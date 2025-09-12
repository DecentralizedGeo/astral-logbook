'use client';

/**
 * Component for displaying user's attestation entries on a map
 * Provides filtering and interactive features
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import EntriesFilter, { FilterOptions } from './EntriesFilter';
import EntriesMap from './EntriesMap';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { useAccount } from 'wagmi';
import { CalendarIcon, ClockIcon, DocumentTextIcon, MapPinIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import easConfig from '~~/EAS.config';
import { useTargetNetwork } from '~~/hooks/scaffold-eth/useTargetNetwork';

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
      id
      attester
      decodedDataJson
      time
      schemaId
    }
  }
`;

// Debounce function to limit the rate of function calls
const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number): T => {
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

// Get location name from coordinates using Mapbox
const getLocationName = async (coordinates: [number, number]): Promise<string> => {
  try {
    const [longitude, latitude] = coordinates;

    // Use Mapbox's Geocoding API
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return 'Unknown location';
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=place,country`,
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract place (city) and country from features
    if (data.features && data.features.length) {
      // Try to find a place feature (city)
      const placeFeature = data.features.find((f: any) => f.place_type.includes('place'));

      // Try to find a country feature
      const countryFeature = data.features.find((f: any) => f.place_type.includes('country'));

      if (placeFeature && countryFeature) {
        return `${placeFeature.text}, ${countryFeature.text}`;
      } else if (placeFeature) {
        return placeFeature.text;
      } else if (countryFeature) {
        return countryFeature.text;
      } else if (data.features[0]) {
        // Return the most relevant result if no specific city or country found
        return data.features[0].place_name;
      }
    }

    return 'Unknown location';
  } catch (error) {
    console.error('Error fetching location data from Mapbox:', error);
    return 'Unknown location';
  }
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
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const navigationLock = useRef(false);

  const [rawFilters, setRawFilters] = useState<FilterOptions>({
    dateRange: { from: null, to: null },
    keywords: '',
    hasMedia: null,
    timeOfDay: {
      morning: false,
      afternoon: false,
      evening: false,
      night: false,
    },
  });

  const [filters, setFilters] = useState<FilterOptions>(rawFilters);
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});

  const pendingLocationFetches = useRef<Set<string>>(new Set());

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
        variables: { attester: address, schemaId },
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
              uid: att.id,
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
    setRawFilters(newFilters);
    const timeoutId = setTimeout(() => {
      setFilters(newFilters);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleEntryClick = useCallback(
    debounce((entryUid: string) => {
      if (navigationLock.current) return;
      navigationLock.current = true;
      router.push(`/attestation/uid/${entryUid}`);
    }, 300),
    [router],
  );

  useEffect(() => {
    return () => {
      navigationLock.current = false;
    };
  }, []);

  // Handle marker hover to show entry details
  const handleMarkerHover = useCallback((entry: Entry, pointPosition: { x: number; y: number }) => {
    console.log('Hover entry:', entry);
    setHoveredEntry({
      id: entry.id,
      coordinates: entry.coordinates,
      timestamp: entry.timestamp,
      memo: entry.memo,
      media: entry.media,
      uid: entry.uid,
    });
    setHoverPosition(pointPosition);
  }, []);

  // Clear hover state when leaving a marker
  const handleMarkerLeave = useCallback(() => {
    // Ensure state is cleared immediately
    requestAnimationFrame(() => {
      setHoveredEntry(null);
      setHoverPosition(null);
    });
  }, []);

  // Update the location name fetching logic
  useEffect(() => {
    const fetchLocationNames = async () => {
      const entriesToFetch = filteredEntries.filter(
        entry => !locationNames[entry.id] && !pendingLocationFetches.current.has(entry.id),
      );
      if (entriesToFetch.length === 0) return;

      entriesToFetch.forEach(entry => pendingLocationFetches.current.add(entry.id));

      const locationPromises = entriesToFetch.map(async entry => {
        try {
          const locationName = await getLocationName(entry.coordinates);
          return { id: entry.id, location: locationName };
        } catch (error) {
          console.error('Error fetching location for entry:', error);
          return { id: entry.id, location: 'Unknown location' };
        } finally {
          pendingLocationFetches.current.delete(entry.id);
        }
      });

      const results = [];
      const batchSize = 5;

      for (let i = 0; i < locationPromises.length; i += batchSize) {
        const batch = locationPromises.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch);
        results.push(...batchResults);

        if (i + batchSize < locationPromises.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Update state with new location names
      setLocationNames(prev => {
        const newLocations = { ...prev };
        results.forEach(result => {
          if (result) {
            newLocations[result.id] = result.location;
          }
        });
        return newLocations;
      });
    };

    if (filteredEntries.length > 0) {
      fetchLocationNames();
    }
  }, [filteredEntries, locationNames]);

  return (
    <main className="p-5 pb-16 bg-white min-h-screen flex flex-col lg:flex-row">
      <div className="lg:w-2/5 px-4 pb-4 lg:border-t-0 overflow-y-auto max-h-[calc(100vh-6rem)]">
        <EntriesFilter
          onFilterChange={handleFilterChange}
          entriesCount={entries.length}
          filteredCount={filteredEntries.length}
          currentFilters={rawFilters}
        />

        {filteredEntries.length === 0 ? (
          <div className="p-4 bg-base-200 rounded text-center text-gray-500">No entries match your filters</div>
        ) : (
          [...filteredEntries]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map(entry => {
              const entryDate = new Date(entry.timestamp);
              const formattedDate = entryDate.toLocaleDateString();
              const formattedTime = entryDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const locationName = locationNames[entry.id] || 'Loading location...';

              return (
                <div
                  key={entry.id}
                  className="p-3 mb-3 cursor-pointer transition-colors duration-200 rounded-lg break-words shadow-sm border 
                    bg-white border-indigo-500 hover:bg-primary hover:text-primary-content"
                  onClick={() => handleEntryClick(entry.uid)}
                >
                  <div className="flex justify-between items-center border-b border-base-200 pb-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm text-gray-600">{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm text-gray-600">{formattedTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm text-gray-600">{locationName}</span>
                    </div>
                  </div>

                  {(entry.memo || entry.media) && (
                    <div className="flex justify-between items-center w-full">
                      {entry.memo && entry.memo !== 'No memo' ? (
                        <div className="flex items-center gap-1 flex-1 truncate">
                          <DocumentTextIcon className="h-4 w-4 text-primary" />
                          <span className="text-gray-600">{entry.memo}</span>
                        </div>
                      ) : (
                        <span className="flex-1"></span>
                      )}
                      {entry.media && (
                        <div className="flex items-center gap-1 text-sm ml-2 flex-shrink-0">
                          <PaperClipIcon className="h-4 w-4 text-primary" />
                          <span className="text-gray-600">1 attachment</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
      <div className="relative lg:w-3/5 h-[calc(100vh-6rem)] overflow-hidden">
        <EntriesMap
          entries={filteredEntries}
          onMarkerClick={entry => handleEntryClick(entry.uid)}
          onMarkerHover={handleMarkerHover}
          onMarkerLeave={handleMarkerLeave}
        />
        {hoveredEntry && hoverPosition && (
          <div
            className="absolute z-50 p-4 bg-white text-gray-800 hover:bg-base-100 transition-colors duration-200 rounded-lg shadow-md"
            style={{
              position: 'fixed',
              left: hoverPosition.x,
              top: hoverPosition.y + 20,
              transform: 'translateX(-50%)',
              minWidth: '200px',
              maxWidth: '350px',
              width: 'max-content',
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              overflowWrap: 'break-word',
              wordWrap: 'break-word',
              hyphens: 'auto',
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  {new Date(hoveredEntry.timestamp).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-primary" />
                <span className="text-sm text-gray-600">
                  {new Date(hoveredEntry.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>

              {hoveredEntry.memo && hoveredEntry.memo !== 'No memo' && (
                <div className="flex items-start gap-2">
                  <DocumentTextIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600 break-words whitespace-normal">{hoveredEntry.memo}</span>
                </div>
              )}

              {hoveredEntry.media && (
                <div className="flex items-center gap-2">
                  <PaperClipIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm text-gray-600">1 attachment</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default EntriesPage;

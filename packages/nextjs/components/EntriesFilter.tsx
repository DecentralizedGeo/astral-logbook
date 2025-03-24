"use client"

/**
 * A collapsible filter interface for journal entries that allows users to:
 * - Filter by date range (from/to dates)
 * - Filter by time of day (morning, afternoon, evening, night)
 * - Search by keywords/text content
 * - Filter by presence or absence of media attachments
 * - Reset all filters to default values
 */

import React, { useState } from 'react';

export interface FilterOptions {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  keywords: string;
  // true = with media, false = without media, null = any
  hasMedia: boolean | null;  
  timeOfDay: {
    // 6AM-12PM
    morning: boolean;
    // 12PM-6PM
    afternoon: boolean;
    // 6PM-12AM
    evening: boolean;
    // 12AM-6AM
    night: boolean;  
  };
}

// Props interface for the EntriesFilter component
interface EntriesFilterProps {
  // Callback to notify parent of filter changes
  onFilterChange: (filters: FilterOptions) => void;
  // Total number of entries (unfiltered)
  entriesCount: number;
  // Number of entries that match current filters
  filteredCount: number;
}

// Display all filter options and controls
const EntriesFilter: React.FC<EntriesFilterProps> = ({ 
  onFilterChange, 
  entriesCount,
  filteredCount 
}) => {
  // Filter is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Maintain the current state of all filter options
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

  // Update filter state and notify parent component of changes
  const handleFilterChange = (updatedFilters: Partial<FilterOptions>) => {
    const newFilters = { ...filters, ...updatedFilters };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Reset all filters to their default (inactive) state
  const resetFilters = () => {
    const resetFilters = {
      dateRange: { from: null, to: null },
      keywords: '',
      hasMedia: null,
      timeOfDay: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      }
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Determine if any filters are currently active
  const hasActiveFilters = (): boolean => {
    return (
      !!filters.dateRange.from ||
      !!filters.dateRange.to ||
      !!filters.keywords ||
      filters.hasMedia !== null ||
      Object.values(filters.timeOfDay).some(value => value)
    );
  };

  // Format Date objects for HTML date input fields
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-lg shadow mb-4 overflow-hidden">
      {/* Filter header - always visible with toggle functionality */}
      <div 
        className="flex justify-between items-center p-3 bg-[#009900] text-white cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          Filter Entries
          {/* Display "Active" badge when filters are applied */}
          {hasActiveFilters() && (
            <span className="ml-2 bg-white text-[#009900] text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
        {/* Display entry count statistics */}
        <div className="text-sm">
          {filteredCount}/{entriesCount} entries
        </div>
      </div>
      
      {/* Collapsible filter panel - only visible when expanded */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          {/* Date Range Filter - allows selecting start and end dates */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex space-x-2">
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1"
                value={formatDateForInput(filters.dateRange.from)}
                onChange={(e) => handleFilterChange({
                  dateRange: {
                    ...filters.dateRange,
                    from: e.target.value ? new Date(e.target.value) : null
                  }
                })}
                placeholder="From"
              />
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1"
                value={formatDateForInput(filters.dateRange.to)}
                onChange={(e) => handleFilterChange({
                  dateRange: {
                    ...filters.dateRange,
                    to: e.target.value ? new Date(e.target.value) : null
                  }
                })}
                placeholder="To"
              />
            </div>
          </div>
          
          {/* Keywords Filter - text search within entry content */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filters.keywords}
              onChange={(e) => handleFilterChange({ keywords: e.target.value })}
              placeholder="Search in memos..."
            />
          </div>
          
          {/* Media Filter - toggle between entries with/without media */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Media</label>
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1 text-sm rounded-md ${filters.hasMedia === true ? 'bg-[#009900] text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => handleFilterChange({ hasMedia: filters.hasMedia === true ? null : true })}
              >
                With Media
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-md ${filters.hasMedia === false ? 'bg-[#009900] text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => handleFilterChange({ hasMedia: filters.hasMedia === false ? null : false })}
              >
                Without Media
              </button>
            </div>
          </div>
          
          {/* Time of Day Filter - select entries from specific time periods */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Time of Day</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'morning', label: 'Morning (6AM-12PM)' },
                { key: 'afternoon', label: 'Afternoon (12PM-6PM)' },
                { key: 'evening', label: 'Evening (6PM-12AM)' },
                { key: 'night', label: 'Night (12AM-6AM)' }
              ].map(time => (
                <button
                  key={time.key}
                  className={`px-3 py-1 text-sm rounded-md ${filters.timeOfDay[time.key as keyof typeof filters.timeOfDay] ? 'bg-[#009900] text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => handleFilterChange({
                    timeOfDay: {
                      ...filters.timeOfDay,
                      [time.key]: !filters.timeOfDay[time.key as keyof typeof filters.timeOfDay]
                    }
                  })}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Reset Button - restores all filters to default values */}
          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className={`px-4 py-2 text-sm rounded-md ${hasActiveFilters() ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}
              disabled={!hasActiveFilters()}
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntriesFilter;

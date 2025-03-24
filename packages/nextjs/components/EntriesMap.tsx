"use client";

/**
 * Interactive map component for displaying entries
 * Displays entries interactively using Mapbox GL JS.
 */

import React from 'react';
import mapboxgl from '!mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";

// Initialize Mapbox with access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Default map settings
const DEFAULT_CENTER: [number, number] = [0.1276, 51.5072];
const DEFAULT_ZOOM = 2;

interface Entry {
  id: string;
  coordinates: [number, number];
  timestamp: string;
  memo: string;
  media?: string;
  uid: string;
}

interface EntriesMapProps {
  entries: Entry[];
  onMarkerClick: (entry: Entry) => void;
  onMarkerHover?: (entry: Entry, event: MouseEvent) => void;
  onMarkerLeave?: () => void;
}

const EntriesMap: React.FC<EntriesMapProps> = ({ entries, onMarkerClick, onMarkerHover, onMarkerLeave }) => {
  const mapContainer = React.useRef<HTMLDivElement | null>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);
  const markersSource = React.useRef<mapboxgl.GeoJSONSource | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Map initialization effect
  React.useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false
    });

    map.current.on('load', () => {
      // Initialize source with initial data
      map.current!.addSource('entries', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: entries.map(entry => ({
            type: 'Feature',
            geometry: { 
              type: 'Point', 
              coordinates: entry.coordinates 
            },
            properties: entry
          }))
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Add cluster layer
      map.current!.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'entries',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#009900', 10, '#007700', 30, '#005500'],
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40]
        }
      });

      // Add cluster count layer
      map.current!.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'entries',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      // Add unclustered point layer
      map.current!.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'entries',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#009900',
          'circle-radius': 8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.5,
          'circle-stroke-opacity': 0.5
        }
      });

      // Add cluster click handler
      map.current!.on('click', 'clusters', (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });

        if (!features.length) return;

        const clusterId = features[0].properties.cluster_id;
        const source = map.current!.getSource('entries') as mapboxgl.GeoJSONSource;

        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;

          map.current!.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom,
            duration: 500
          });
        });
      });

      // Add hover effects
      map.current!.on('mouseenter', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current!.on('mouseleave', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      // Update hover handlers for unclustered points
      map.current!.on('mouseenter', 'unclustered-point', (e) => {
        if (!e.features?.length) return;
        map.current!.getCanvas().style.cursor = 'pointer';
        if (onMarkerHover) {
          onMarkerHover(e.features[0].properties as Entry, e.originalEvent as MouseEvent);
        }
      });

      map.current!.on('mouseleave', 'unclustered-point', () => {
        map.current!.getCanvas().style.cursor = '';
        if (onMarkerLeave) {
          onMarkerLeave();
        }
      });

      // Update hover handlers for map movement
      map.current!.on('movestart', () => {
        if (onMarkerLeave) {
          onMarkerLeave();
        }
      });

      setIsLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Separate effect for updating source data
  React.useEffect(() => {
    if (!map.current || !isLoaded) return;

    try {
      const source = map.current.getSource('entries');
      if (source && 'setData' in source) {
        (source as mapboxgl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: entries.map(entry => ({
            type: 'Feature',
            geometry: { 
              type: 'Point', 
              coordinates: entry.coordinates 
            },
            properties: {
              ...entry,
              coordinates: entry.coordinates
            }
          }))
        });
      }
    } catch (error) {
      console.error('Error updating source:', error);
    }
  }, [entries, isLoaded]);

  // Event handlers effect
  React.useEffect(() => {
    if (!map.current || !isLoaded) return;

    const clickHandler = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      onMarkerClick(e.features[0].properties as Entry);
    };

    const hoverHandler = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features?.length || !onMarkerHover) return;
      onMarkerHover(e.features[0].properties as Entry, e.originalEvent);
    };

    map.current.on('click', 'unclustered-point', clickHandler);
    if (onMarkerHover) map.current.on('mouseenter', 'unclustered-point', hoverHandler);
    if (onMarkerLeave) map.current.on('mouseleave', 'unclustered-point', onMarkerLeave);

    return () => {
      if (!map.current) return;
      map.current.off('click', 'unclustered-point', clickHandler);
      if (onMarkerHover) map.current.off('mouseenter', 'unclustered-point', hoverHandler);
      if (onMarkerLeave) map.current.off('mouseleave', 'unclustered-point', onMarkerLeave);
    };
  }, [isLoaded, onMarkerClick, onMarkerHover, onMarkerLeave]);

  return <div ref={mapContainer} className="w-full h-full rounded overflow-hidden shadow-lg" />;
};

export default EntriesMap;
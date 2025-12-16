import React, { useEffect, useMemo, useRef } from 'react';

declare var L: any; // Leaflet global

interface UseMapOptions {
  center: [number, number];
  zoom: number;
  zoomControl?: boolean;
}

/**
 * Custom hook to initialize and manage a Leaflet map instance.
 * @param mapRef A React ref to the div element where the map will be mounted.
 * @param options Configuration options for the map like center, zoom, etc.
 * @returns A React ref containing the initialized Leaflet map instance.
 */
export const useMap = (mapRef: React.RefObject<HTMLDivElement>, options: UseMapOptions) => {
  const mapInstanceRef = useRef<any>(null);

  // Memoize options to prevent unnecessary effect runs if the parent component re-renders
  const memoizedOptions = useMemo(() => {
    return {
      center: options.center,
      zoom: options.zoom,
      zoomControl: options.zoomControl
    };
  }, [options.center[0], options.center[1], options.zoom, options.zoomControl]);

  useEffect(() => {
    // Initialize the map only once
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: memoizedOptions.center,
        zoom: memoizedOptions.zoom,
        zoomControl: memoizedOptions.zoomControl ?? true, // Default to true
      });

      // Using CartoDB Voyager tiles for a clean, professional, Mappls-like aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    // Cleanup function to run when the component unmounts
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapRef, memoizedOptions]); // Effect runs when ref or options change

  return mapInstanceRef;
};
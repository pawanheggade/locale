
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { reverseGeocode } from '../utils/geocoding';
import { SpinnerIcon } from './Icons';
import { useMap } from '../hooks/useMap';
import { Button } from './ui/Button';

declare var L: any;

interface LocationPickerMapProps {
  initialCoordinates?: { lat: number; lng: number } | null;
  onLocationSelect: (location: { lat: number; lng: number; name: string }) => void;
  onCancel: () => void;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ initialCoordinates, onLocationSelect, onCancel }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerInstance = useRef<any>(null);
  const isMountedRef = useRef(true);

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(initialCoordinates);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const mapOptions = useMemo(() => ({
      center: (initialCoordinates ? [initialCoordinates.lat, initialCoordinates.lng] : [20.5937, 78.9629]) as [number, number],
      zoom: initialCoordinates ? 13 : 5,
  }), [initialCoordinates]);

  const mapInstanceRef = useMap(mapRef, mapOptions);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const updateMarker = useCallback((latlng: { lat: number; lng: number }) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerInstance.current) {
      markerInstance.current.setLatLng(latlng);
    } else {
      markerInstance.current = L.marker(latlng).addTo(map);
    }
    map.panTo(latlng);
    if (isMountedRef.current) {
        setSelectedCoords(latlng);
    }
  }, [mapInstanceRef]);
  
  // Fetch address on coordinate change
  useEffect(() => {
    if (selectedCoords) {
      setIsLoading(true);
      reverseGeocode(selectedCoords.lat, selectedCoords.lng)
        .then(address => {
            if (isMountedRef.current) {
                setSelectedAddress(address);
            }
        })
        .catch(error => {
            if (isMountedRef.current) {
                console.error("Reverse geocoding failed:", error);
                setSelectedAddress(error instanceof Error ? error.message : 'Could not determine address.');
            }
        })
        .finally(() => {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        });
    }
  }, [selectedCoords]);
  
  // Initialize map interaction logic
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: any) => {
      updateMarker(e.latlng);
    };
    
    map.on('click', handleClick);
    
    // Set initial marker if provided
    if (initialCoordinates) {
        updateMarker(initialCoordinates);
    }
    
    return () => {
        if (map) {
            map.off('click', handleClick);
        }
    };
  }, [mapInstanceRef, initialCoordinates, updateMarker]);

  return (
    <div className="h-[60vh] flex flex-col relative">
      <div ref={mapRef} className="flex-grow w-full" />
      <div className="p-3 bg-white/50 border-t border-black/10 flex-shrink-0 backdrop-blur-sm">
        <div className="min-h-[40px]">
          {isLoading ? (
            <div className="flex items-center text-gray-700">
                <SpinnerIcon className="w-5 h-5 mr-2" />
                <span>Identifying location...</span>
            </div>
          ) : (
            <p className="font-semibold text-gray-800">{selectedAddress || 'Click on the map to select a location'}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-2">
            <Button onClick={onCancel} variant="glass">Cancel</Button>
            <Button 
                onClick={() => selectedCoords && onLocationSelect({ ...selectedCoords, name: selectedAddress || 'Selected Location' })}
                disabled={!selectedCoords || isLoading}
                variant="glass-red"
            >
                Confirm Location
            </Button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerMap;

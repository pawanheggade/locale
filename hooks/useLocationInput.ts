
import { useState, useEffect, useCallback } from 'react';
import { geocodeLocation, reverseGeocode, fetchLocationSuggestions } from '../utils/geocoding';
import { useDebounce } from './useDebounce';
import { useIsMounted } from './useIsMounted';

export type LocationStatus = 'idle' | 'typing' | 'verifying' | 'geolocating' | 'verified' | 'error';

export const useLocationInput = (initialValue: string = '', initialCoords: { lat: number, lng: number } | null = null) => {
    const [location, setLocation] = useState(initialValue);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(initialCoords);
    const [status, setStatus] = useState<LocationStatus>(initialCoords ? 'verified' : 'idle');
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    
    const isMounted = useIsMounted();
    const debouncedLocation = useDebounce(location, 300);

    useEffect(() => {
        if (status === 'typing' && debouncedLocation.trim().length > 2) {
            const fetch = async () => {
                try {
                    const fetchedSuggestions = await fetchLocationSuggestions(debouncedLocation);
                    if (isMounted()) {
                        setSuggestions(fetchedSuggestions);
                        if (error) setError(null);
                    }
                } catch (err) {
                    console.error('Failed to fetch location suggestions:', err);
                    if (isMounted()) {
                        setSuggestions([]);
                        setError("Location suggestions unavailable.");
                    }
                }
            };
            fetch();
        } else if (debouncedLocation.trim().length <= 2) {
            if (isMounted()) setSuggestions([]);
        }
    }, [debouncedLocation, status, isMounted]);
    
    const verifyLocation = useCallback(async (locationToVerify: string): Promise<{ lat: number; lng: number } | null> => {
        if (!isMounted()) return null;
        setStatus('verifying');
        setError(null);

        try {
            const coords = await geocodeLocation(locationToVerify);
            if (isMounted()) {
                if (coords) {
                    const canonicalName = await reverseGeocode(coords.lat, coords.lng);
                    if (isMounted()) {
                        setLocation(canonicalName);
                        setCoordinates(coords);
                        setStatus('verified');
                    }
                    return coords;
                } else {
                    setError("Could not find this location. Please be more specific or use the map.");
                    setCoordinates(null);
                    setStatus('error');
                    return null;
                }
            }
        } catch (err) {
            if (isMounted()) {
                setError(err instanceof Error ? err.message : "Location verification failed.");
                setCoordinates(null);
                setStatus('error');
            }
        }
        return null;
    }, [isMounted]);

    const handleLocationChange = (newValue: string) => {
        setLocation(newValue);
        setStatus('typing');
        setCoordinates(null);
        setError(null);
    };

    const handleSuggestionSelect = (suggestion: string) => {
        setLocation(suggestion);
        setSuggestions([]);
        verifyLocation(suggestion);
    };

    const verify = async (): Promise<{ lat: number; lng: number } | null> => {
        if (coordinates && status === 'verified') return coordinates;
        if (location.trim() && status !== 'verifying') {
            return await verifyLocation(location);
        }
        return null;
    };
    
    const selectFromMap = (selected: { lat: number; lng: number; name: string }) => {
        setLocation(selected.name);
        setCoordinates({ lat: selected.lat, lng: selected.lng });
        setStatus('verified');
        setError(null);
        setSuggestions([]);
    };
    
    const useMyLocation = useCallback(async (): Promise<{ lat: number, lng: number } | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                if (isMounted()) {
                    setError("Geolocation is not supported by your browser.");
                    setStatus('error');
                }
                resolve(null);
                return;
            }
    
            if (!isMounted()) {
                resolve(null);
                return;
            }
            setStatus('geolocating');
            setError(null);
    
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    try {
                        const address = await reverseGeocode(coords.lat, coords.lng);
                        if (isMounted()) {
                            selectFromMap({ ...coords, name: address });
                        }
                        resolve(coords);
                    } catch (err) {
                         if (isMounted()) {
                            setError(err instanceof Error ? err.message : "Could not fetch address for your location.");
                            setStatus('error');
                            setLocation(`Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`);
                            setCoordinates(coords);
                        }
                        resolve(coords);
                    }
                },
                (err) => {
                    let message = "Could not get your location.";
                    switch (err.code) {
                        case err.PERMISSION_DENIED:
                            message = "Location access denied. Please enable it in your browser settings.";
                            break;
                        case err.POSITION_UNAVAILABLE:
                            message = "Location information is unavailable.";
                            break;
                        case err.TIMEOUT:
                            message = "The request to get user location timed out.";
                            break;
                    }
                    if (isMounted()) {
                        setError(message);
                        setStatus('error');
                    }
                    resolve(null);
                }
            );
        });
    }, [isMounted]);

    const reset = useCallback(() => {
        setLocation('');
        setCoordinates(null);
        setStatus('idle');
        setError(null);
        setSuggestions([]);
    }, []);

    return {
        location,
        coordinates,
        status,
        error,
        suggestions,
        setLocation: handleLocationChange,
        selectSuggestion: handleSuggestionSelect,
        verify,
        selectFromMap,
        useMyLocation,
        reset,
    };
};

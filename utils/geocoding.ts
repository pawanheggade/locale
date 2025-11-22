import { handleApiError, withRetry } from './gemini';

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeocodingCache {
  [location: string]: Coordinates | null;
}

const GEOCODING_CACHE_KEY = 'localeGeocodingCache';

const getCache = (): GeocodingCache => {
  try {
    const cachedData = window.localStorage.getItem(GEOCODING_CACHE_KEY);
    return cachedData ? JSON.parse(cachedData) : {};
  } catch (error) {
    console.error('Error reading geocoding cache:', error);
    return {};
  }
};

const setCache = (cache: GeocodingCache) => {
  try {
    window.localStorage.setItem(GEOCODING_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving geocoding cache:', error);
  }
};

export const geocodeLocation = async (location: string): Promise<Coordinates | null> => {
  if (!location) {
    return null;
  }

  const cache = getCache();
  const normalizedLocation = location.toLowerCase().trim();
  if (cache.hasOwnProperty(normalizedLocation)) {
    return cache[normalizedLocation];
  }

  try {
    const data = await withRetry(async () => {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`);
        if (!response.ok) {
            const error: any = new Error(`Geocoding API request failed with status ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return response.json();
    });

    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      const coordinates = { lat: parseFloat(lat), lng: parseFloat(lon) };
      
      cache[normalizedLocation] = coordinates;
      setCache(cache);

      return coordinates;
    }
    
    // Cache null result to avoid re-querying invalid locations
    cache[normalizedLocation] = null;
    setCache(cache);
    return null;
  } catch (error) {
    throw handleApiError(error, `geocoding "${location}"`);
  }
};

export const fetchLocationSuggestions = async (query: string): Promise<string[]> => {
  if (query.trim().length < 3) {
    return [];
  }

  try {
    const data = await withRetry(async () => {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
        if (!response.ok) {
            const error: any = new Error(`Location suggestion API request failed with status ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return response.json();
    });
    if (data && data.length > 0) {
      return data.map((item: any) => item.display_name);
    }
    return [];
  } catch (error) {
    throw handleApiError(error, 'fetching location suggestions');
  }
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const data = await withRetry(async () => {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: {
                // Per Nominatim's usage policy, a valid User-Agent is required to prevent being blocked.
                'User-Agent': 'Locale App v1.0 (for demonstration purposes)'
            }
        });
        if (!response.ok) {
            const error: any = new Error(`Reverse geocoding API request failed with status ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return response.json();
    });

    if (data && data.display_name) {
      return data.display_name;
    }
    // Handle cases where the API returns a valid response but no address (e.g., in the middle of the ocean)
    // without throwing an error that gets misinterpreted as a network failure.
    if (data && data.error) {
        console.error('Nominatim API error:', data.error);
        throw new Error(data.error);
    }
    
    console.warn(`Could not determine address for coordinates: ${lat}, ${lng}`);
    return `Location near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    throw handleApiError(error, 'reverse geocoding');
  }
};

export const haversineDistance = (coords1: Coordinates, coords2: Coordinates): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (coords2.lat - coords1.lat) * (Math.PI / 180);
  const dLng = (coords2.lng - coords1.lng) * (Math.PI / 180);
  const lat1 = coords1.lat * (Math.PI / 180);
  const lat2 = coords2.lat * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};
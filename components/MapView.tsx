import React, { useEffect, useRef, useState, useMemo } from 'react';
import { DisplayablePost, PostType, Subscription } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import { SpinnerIcon, MapPinIcon, SearchIcon, CrosshairsIcon, PlusIcon, MinusIcon } from './Icons';
import { useMap } from '../hooks/useMap';
import { Button } from './ui/Button';

// Declare Leaflet global object
declare var L: any;

interface MapViewProps {
  posts: DisplayablePost[];
  userLocation?: { lat: number; lng: number } | null;
  isLoading?: boolean;
  onFindNearby: () => void;
  isFindingNearby: boolean;
  postToFocusOnMap: string | null;
  onPostFocusComplete: () => void;
  onViewPostDetails: (post: DisplayablePost) => void;
  locationToFocus: { coords: { lat: number; lng: number; }; name: string; } | null;
  onLocationFocusComplete: () => void;
}

// Define a type for the saved map state
interface MapState {
  lat: number;
  lng: number;
  zoom: number;
}

const MAP_STATE_KEY = 'localeMapViewState';

const MapSkeleton: React.FC = () => {
    return (
        <div className="h-full w-full bg-gray-300 flex items-center justify-center animate-pulse">
            <div className="relative flex items-center justify-center">
                <MapPinIcon className="w-16 h-16 text-gray-400" />
                <div className="absolute w-24 h-24 border-4 border-gray-400 rounded-full animate-ping"></div>
            </div>
        </div>
    );
};

const createMarkerIcon = (post: DisplayablePost) => {
    const tier = post.author?.subscription?.tier || 'Personal';
    
    let tierColorBg: string;
    let tierColorBorder: string;
    let ringColor: string;

    switch (tier) {
      case 'Business':
      case 'Organisation':
        tierColorBg = 'bg-amber-500';
        tierColorBorder = 'border-t-amber-500';
        ringColor = 'ring-amber-500';
        break;
      case 'Verified':
        tierColorBg = 'bg-red-500';
        tierColorBorder = 'border-t-red-500';
        ringColor = 'ring-red-500';
        break;
      case 'Basic':
      case 'Personal':
      default:
        tierColorBg = 'bg-gray-900';
        tierColorBorder = 'border-t-gray-900';
        ringColor = 'ring-gray-900';
        break;
    }
    
    const priceText = formatCompactCurrency(post.price);
    const isServiceOrEvent = post.type === PostType.SERVICE || post.type === PostType.EVENT;

    // Products: Colored Header, White Body
    // Services/Events: White Header, Colored Body
    const headerClass = isServiceOrEvent ? 'bg-white text-gray-900' : `${tierColorBg} text-white`;
    const bodyClass = isServiceOrEvent ? `${tierColorBg} text-white` : 'bg-white text-gray-900';
    const arrowClass = isServiceOrEvent ? tierColorBorder : 'border-t-white';

    const iconHtml = `
      <div style="transform: translate(-50%, -100%); position: absolute; left: 0; top: 0; width: max-content;">
        <div class="custom-marker marker-pop-in-animation cursor-pointer group flex flex-col items-center">
          <div class="marker-content bg-white rounded-lg text-center transform-gpu ring-1 ${ringColor} overflow-hidden w-[120px]">
            <div class="text-xs font-semibold px-1 py-1 whitespace-normal leading-tight ${headerClass}" title="${post.title}">
              ${post.title}
            </div>
            <div class="text-sm font-bold px-1 py-1 ${bodyClass}">
              ${priceText}
            </div>
          </div>
          <div class="marker-arrow w-0 h-0
            border-l-[6px] border-l-transparent
            border-r-[6px] border-r-transparent
            border-t-[6px] ${arrowClass} -mt-[1px]">
          </div>
        </div>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: '', // important to remove default styling
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
};


const MapViewComponent: React.FC<MapViewProps> = ({ posts, userLocation, isLoading, onFindNearby, isFindingNearby, postToFocusOnMap, onPostFocusComplete, onViewPostDetails, locationToFocus, onLocationFocusComplete }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const clusterGroupRef = useRef<any>(null);
  const userLocationMarkerRef = useRef<any>(null);
  const tempMarkerRef = useRef<any>(null);
  const isInitialLoadRef = useRef(true);
  const hasCenteredOnUser = useRef(false);
  const markersRef = useRef<Record<string, any>>({});
  const displayedMarkerIdsRef = useRef(new Set<string>());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const initialMapState = useMemo(() => {
    try {
      const savedStateJSON = localStorage.getItem(MAP_STATE_KEY);
      if (savedStateJSON) {
        const savedState: MapState = JSON.parse(savedStateJSON);
        return { center: [savedState.lat, savedState.lng] as [number, number], zoom: savedState.zoom };
      }
    } catch (error) {
      console.error("Failed to read map state from localStorage", error);
    }
    // Default center on India if no saved state
    return { center: [20.5937, 78.9629] as [number, number], zoom: 5 };
  }, []);

  const mapInstanceRef = useMap(mapRef, { ...initialMapState, zoomControl: false });

  // Initialize map logic (clusters, controls, event listeners)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // We are using custom zoom buttons now, so no L.control.zoom()

    // Set max bounds to restrict scrolling to the world map (approx -85 to 85 lat)
    const southWest = L.latLng(-85, -180);
    const northEast = L.latLng(85, 180);
    const bounds = L.latLngBounds(southWest, northEast);
    map.setMaxBounds(bounds);
    map.setMinZoom(2); // Prevent zooming out too far

    // Initialize MarkerClusterGroup only once
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 80,
        iconCreateFunction: (cluster: any) => {
            const count = cluster.getChildCount();
            let c = ' marker-cluster-';
            let size: number;
            if (count < 10) {
                c += 'small';
                size = 40;
            } else if (count < 100) {
                c += 'medium';
                size = 50;
            } else {
                c += 'large';
                size = 60;
            }
            return L.divIcon({
                html: `<div><span>${count}</span></div>`,
                className: 'marker-cluster' + c,
                iconSize: L.point(size, size)
            });
        }
      });
      map.addLayer(clusterGroupRef.current);
    }

    const saveMapState = () => {
      if (map) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const mapState: MapState = { lat: center.lat, lng: center.lng, zoom: zoom };
        try {
          localStorage.setItem(MAP_STATE_KEY, JSON.stringify(mapState));
        } catch (error) {
          console.error("Failed to save map state to localStorage", error);
        }
      }
    };

    const handleMapClick = () => {
        if (isMountedRef.current) setSelectedPostId(null);
    };
    
    map.on('moveend', saveMapState);
    map.on('zoomend', saveMapState);
    map.on('click', handleMapClick);

    // Cleanup listeners
    return () => {
      if (map) {
        map.off('moveend', saveMapState);
        map.off('zoomend', saveMapState);
        map.off('click', handleMapClick);
      }
    };
  }, [mapInstanceRef]);

  // Center map on initial user location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && userLocation && !hasCenteredOnUser.current) {
      // Don't re-center if a specific post is being focused
      if (!postToFocusOnMap) {
        map.setView([userLocation.lat, userLocation.lng], 13);
      }
      hasCenteredOnUser.current = true;
    }
  }, [userLocation, mapInstanceRef, postToFocusOnMap]);

  // Update markers when posts change (Diffing Algorithm)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    const postsWithCoords = posts.filter(post => post.coordinates || (post.type === PostType.EVENT && post.eventCoordinates));
    
    const newPostIds = new Set(postsWithCoords.map(p => p.id));
    const currentPostIds = displayedMarkerIdsRef.current;
    const markersToAdd: any[] = [];
    const markersToRemove: any[] = [];

    // Find markers to remove
    currentPostIds.forEach(postId => {
        if (!newPostIds.has(postId)) {
            const markerToRemove = markersRef.current[postId];
            if (markerToRemove) {
                markersToRemove.push(markerToRemove);
                delete markersRef.current[postId];
            }
        }
    });

    // Find markers to add
    for (const post of postsWithCoords) {
      if (!currentPostIds.has(post.id)) {
          const coords = post.type === PostType.EVENT && post.eventCoordinates ? post.eventCoordinates : post.coordinates;
          if (coords) {
              const icon = createMarkerIcon(post);
              const marker = L.marker([coords.lat, coords.lng], {
                  icon: icon,
                  postId: post.id,
                  keyboard: true,
                  title: post.title,
                  alt: `Marker for ${post.title}`,
              });
              
              const hasImage = post.media && post.media.length > 0 && post.media[0].type === 'image';
              
              const popupContent = `
                <div class="w-56 overflow-hidden">
                  ${ hasImage ? `<img src="${post.media[0].url}" alt="" class="w-full h-24 object-cover bg-gray-200">` : `<div class="w-full h-24 bg-gray-200 flex items-center justify-center text-gray-600 text-sm">No Image</div>` }
                  <div class="p-3">
                    <h3 class="font-bold text-base text-gray-800 truncate" title="${post.title}">${post.title}</h3>
                    <div class="flex justify-between items-center mt-2">
                        <p class="text-lg font-extrabold text-gray-900">${formatCurrency(post.price)}</p>
                        <button class="view-details-btn text-center button-pill-red text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-colors">
                            Details
                        </button>
                    </div>
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, { offset: L.point(0, -25) });
              
              marker.on('popupopen', (e: any) => {
                  if (isMountedRef.current) setSelectedPostId(post.id);
                  const popupEl = e.popup.getElement();
                  if (!popupEl) return;

                  const btn = popupEl.querySelector('.view-details-btn');
                  const clickHandler = (event: MouseEvent) => {
                      L.DomEvent.stopPropagation(event);
                      onViewPostDetails(post);
                  };

                  if (btn) {
                      L.DomEvent.on(btn, 'click', clickHandler);
                      e.popup.on('remove', () => L.DomEvent.off(btn, 'click', clickHandler));
                  }
              });
        
              marker.on('popupclose', () => { if (isMountedRef.current) setSelectedPostId(null); });
              
              markersRef.current[post.id] = marker;
              markersToAdd.push(marker);
          }
      }
    }
    
    if (markersToRemove.length > 0) {
        clusterGroup.removeLayers(markersToRemove);
    }
    if (markersToAdd.length > 0) {
        clusterGroup.addLayers(markersToAdd);
    }
    
    displayedMarkerIdsRef.current = newPostIds;
    
    if (isInitialLoadRef.current && markersToAdd.length > 0) {
        if (markersToAdd.length > 1) {
            map.fitBounds(clusterGroup.getBounds().pad(0.2));
        } else {
            const firstPostCoords = postsWithCoords[0].type === PostType.EVENT && postsWithCoords[0].eventCoordinates ? postsWithCoords[0].eventCoordinates : postsWithCoords[0].coordinates;
            if (firstPostCoords) {
                map.setView([firstPostCoords.lat, firstPostCoords.lng], 13);
            }
        }
        isInitialLoadRef.current = false;
    }
  }, [posts, onViewPostDetails, mapInstanceRef]);

  // Effect to manage marker selection styling
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([postId, marker]) => {
        const leafletMarker = marker as any;
        if (leafletMarker && leafletMarker._icon) {
            if (postId === selectedPostId) {
                leafletMarker._icon.classList.add('marker-selected');
                leafletMarker.setZIndexOffset(1000); // Bring to front
            } else {
                leafletMarker._icon.classList.remove('marker-selected');
                leafletMarker.setZIndexOffset(0);
            }
        }
    });
  }, [selectedPostId]);

  // Update user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
        if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        } else {
            const userIcon = L.divIcon({
                html: `<div class="user-location-marker"><div class="pulse-blue"></div></div>`,
                className: '', // important to remove default styling
                iconSize: L.point(40, 40),
                iconAnchor: L.point(20, 20),
            });
            userLocationMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
                icon: userIcon,
                zIndexOffset: 1000 // Ensure it's on top
            }).addTo(map);
        }
    } else {
        // Remove marker if user location is lost
        if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.remove();
            userLocationMarkerRef.current = null;
        }
    }
  }, [userLocation, mapInstanceRef]);
  
  // Effect to focus on a specific post
  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!postToFocusOnMap || !map || !clusterGroup) return;

    const markerToFocus = markersRef.current[postToFocusOnMap];
    
    if (markerToFocus) {
      clusterGroup.zoomToShowLayer(markerToFocus, () => {
        markerToFocus.openPopup();
      });
    }
    
    onPostFocusComplete();
    
  }, [postToFocusOnMap, onPostFocusComplete, mapInstanceRef]);
  
  // Effect to focus on a specific location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (locationToFocus && map) {
        map.setView(locationToFocus.coords, 15);

        if (tempMarkerRef.current) {
            tempMarkerRef.current.remove();
        }

        const tempIcon = L.divIcon({
            html: `<div class="user-location-marker"><div class="pulse-red"></div></div>`,
            className: '',
            iconSize: L.point(40, 40),
            iconAnchor: L.point(20, 20),
        });

        tempMarkerRef.current = L.marker(locationToFocus.coords, { icon: tempIcon }).addTo(map);
        tempMarkerRef.current.bindPopup(`<b>${locationToFocus.name}'s Area</b>`).openPopup();

        const timer = setTimeout(() => {
            if (tempMarkerRef.current) {
                tempMarkerRef.current.remove();
                tempMarkerRef.current = null;
            }
        }, 10000); // Remove after 10 seconds

        onLocationFocusComplete();

        return () => clearTimeout(timer); // Cleanup timer on re-run or unmount
    }
  }, [locationToFocus, onLocationFocusComplete, mapInstanceRef]);

  const handleRecenter = () => {
    if (userLocation && mapInstanceRef.current) {
        mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 13);
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  if (isLoading) {
    return <MapSkeleton />;
  }

  const whiteButtonClass = "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200";

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      <div className="absolute top-4 right-4 z-[401] flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 flex-row">
            <Button
                onClick={onFindNearby}
                disabled={isFindingNearby}
                variant="outline"
                className={`flex items-center justify-center gap-2 ${whiteButtonClass}`}
                aria-label="Find posts near a location"
                title="Find Nearby"
            >
                {isFindingNearby ? <SpinnerIcon className="w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
                <span className="hidden sm:inline">Find Nearby</span>
            </Button>
            {userLocation && (
            <Button
                onClick={handleRecenter}
                variant="outline"
                size="icon"
                className={whiteButtonClass}
                aria-label="Center map on my location"
                title="My Location"
            >
                <CrosshairsIcon className="w-5 h-5" />
            </Button>
            )}
        </div>
        <div className="flex flex-col gap-2">
            <Button onClick={handleZoomIn} variant="outline" size="icon" className={whiteButtonClass} aria-label="Zoom In" title="Zoom In">
                <PlusIcon className="w-5 h-5" />
            </Button>
            <Button onClick={handleZoomOut} variant="outline" size="icon" className={whiteButtonClass} aria-label="Zoom Out" title="Zoom Out">
                <MinusIcon className="w-5 h-5" />
            </Button>
        </div>
      </div>
    </div>
  );
};

export const MapView = React.memo(MapViewComponent);
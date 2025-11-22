
import React, { useState, useRef } from 'react';
import { SpinnerIcon, AlertIcon, MapPinIcon, CrosshairsIcon } from './Icons';
import LocationPickerMap from './LocationPickerMap';
import ModalShell from './ModalShell';
import LocationInput from './LocationInput';
import { useLocationInput } from '../hooks/useLocationInput';
import { Button } from './ui/Button';

interface FindNearbyModalProps {
  onClose: () => void;
  onSearch: (coords: { lat: number; lng: number }) => void;
  isSearching: boolean;
}

export const FindNearbyModal: React.FC<FindNearbyModalProps> = ({ onClose, onSearch, isSearching }) => {
  const locationInput = useLocationInput();
  const [formError, setFormError] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const searchCoords = await locationInput.verify();
    
    if (!searchCoords) {
        if (!locationInput.location) {
            setFormError("Please enter a location to search.");
        }
        return;
    }
    onSearch(searchCoords);
  };

  const handleMapLocationSelect = (selected: { lat: number; lng: number; name: string }) => {
    locationInput.selectFromMap(selected);
    setShowMapPicker(false);
  };

  const handleUseMyLocationClick = async () => {
    if (isSearching || locationInput.status === 'geolocating') return;
    setFormError('');
    const coords = await locationInput.useMyLocation();
    if (coords) {
      onSearch(coords);
    }
  };

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title={showMapPicker ? 'Select Location' : 'Find Posts Near a Location'}
      titleId="find-nearby-title"
      trapFocus={!showMapPicker}
    >
      {showMapPicker ? (
        <LocationPickerMap
          initialCoordinates={locationInput.coordinates}
          onLocationSelect={handleMapLocationSelect}
          onCancel={() => setShowMapPicker(false)}
        />
      ) : (
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Button
                type="button"
                onClick={handleUseMyLocationClick}
                disabled={isSearching || locationInput.status === 'geolocating'}
                variant="glass-red"
                className="w-full flex items-center justify-center gap-2 h-12 text-base"
              >
                {isSearching || locationInput.status === 'geolocating' ? <SpinnerIcon className="w-6 h-6" /> : <CrosshairsIcon className="w-6 h-6" />}
                Use My Current Location
              </Button>
            </div>

            {locationInput.status === 'error' && locationInput.error && (
                <div role="alert" className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md flex items-center gap-2 animate-fade-in-up">
                    <AlertIcon className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{locationInput.error}</p>
                </div>
            )}

            <div className="relative flex items-center text-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-sm font-medium text-gray-500">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <div className="space-y-4">
               <LocationInput
                  id="location-search"
                  label="Search for a location"
                  value={locationInput.location}
                  onValueChange={locationInput.setLocation}
                  onSuggestionSelect={locationInput.selectSuggestion}
                  onVerify={locationInput.verify}
                  placeholder="e.g., City, State, Landmark"
                  onOpenMapPicker={() => setShowMapPicker(true)}
                  suggestions={locationInput.suggestions}
                  status={locationInput.status}
                  error={locationInput.error}
                  formError={formError}
              />
              <Button type="submit" disabled={isSearching} variant="glass-dark" className="w-full h-12 text-base">
                {isSearching ? <><SpinnerIcon className="w-5 h-5 mr-2" /> Searching...</> : 'Search at Location'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </ModalShell>
  );
};

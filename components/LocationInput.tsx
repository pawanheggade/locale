import React, { useEffect, useRef } from 'react';
import { SpinnerIcon, MapPinIcon, CheckIcon, AlertIcon, CrosshairsIcon } from './Icons';
import { LocationStatus } from '../hooks/useLocationInput';
import { useSuggestionKeyboardNav } from '../hooks/useSearchSuggestions';
import { Button } from './ui/Button';

interface LocationInputProps {
    id: string;
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    onSuggestionSelect: (suggestion: string) => void;
    onVerify: () => void; // onBlur
    onOpenMapPicker: () => void;
    onUseMyLocation?: () => void;
    placeholder?: string;
    required?: boolean;
    suggestions: string[];
    status: LocationStatus;
    error?: string | null;
    formError?: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
    id, label, value, onValueChange, onSuggestionSelect, onVerify, onOpenMapPicker, onUseMyLocation,
    placeholder, required, suggestions, status, error, formError
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isDropdownOpen = suggestions.length > 0;

    const { activeIndex, setActiveIndex, listRef, handleKeyDown: handleNavKeyDown } = useSuggestionKeyboardNav(
        suggestions.length,
        (index) => onSuggestionSelect(suggestions[index]),
        () => inputRef.current?.blur(), // Blur will trigger onVerify
        isDropdownOpen
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onVerify();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onVerify]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Let nav hook handle its keys
        handleNavKeyDown(e);

        // If the event was not handled by the nav hook and is Enter, verify the input
        if (!e.defaultPrevented && e.key === 'Enter') {
            e.preventDefault();
            onVerify();
        }
    };

    const isVerifying = status === 'verifying' || status === 'geolocating';
    const hasError = !!formError || !!error;
    const displayError = formError || error;

    return (
        <div ref={containerRef} className="relative w-full">
            <label htmlFor={id} className="block text-sm font-medium text-gray-800">{label}</label>
            <div className="relative mt-1 flex gap-2">
                <div className="relative flex-grow">
                    <input
                        ref={inputRef}
                        type="text"
                        id={id}
                        value={value}
                        onChange={e => { onValueChange(e.target.value); }}
                        onKeyDown={handleKeyDown}
                        onBlur={onVerify}
                        placeholder={placeholder}
                        className={`block w-full bg-white rounded-md border pr-10 text-gray-900 focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors duration-150 ${hasError ? 'border-red-500' : 'border-gray-300'}`}
                        autoComplete="off"
                        required={required}
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={isDropdownOpen}
                        aria-controls={`${id}-suggestions-listbox`}
                        aria-activedescendant={activeIndex > -1 ? `${id}-suggestion-${activeIndex}` : undefined}
                        aria-invalid={hasError}
                        aria-describedby={hasError ? `${id}-location-error` : undefined}
                    />
                    {isVerifying && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <SpinnerIcon className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                </div>
                {onUseMyLocation && (
                    <Button 
                        type="button" 
                        onClick={onUseMyLocation} 
                        disabled={isVerifying}
                        variant="glass"
                        size="icon"
                        className="flex-shrink-0 text-gray-600"
                        aria-label="Use my current location" 
                        title="Use my current location"
                    >
                        {status === 'geolocating' ? <SpinnerIcon className="w-5 h-5"/> : <CrosshairsIcon className="w-5 h-5"/>}
                    </Button>
                )}
                <Button 
                    type="button" 
                    onClick={onOpenMapPicker} 
                    variant="glass"
                    size="icon"
                    className="flex-shrink-0 text-gray-600"
                    aria-label="Select location on maps" 
                    title="Select location on maps"
                >
                    <MapPinIcon className="w-5 h-5"/>
                </Button>
            </div>
            {isDropdownOpen && (
                <ul ref={listRef} id={`${id}-suggestions-listbox`} role="listbox" className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {suggestions.map((suggestion, index) => {
                         const matchIndex = suggestion.toLowerCase().indexOf(value.toLowerCase());
                         const before = matchIndex > -1 ? suggestion.slice(0, matchIndex) : suggestion;
                         const match = matchIndex > -1 ? suggestion.slice(matchIndex, matchIndex + value.length) : '';
                         const after = matchIndex > -1 ? suggestion.slice(matchIndex + value.length) : '';
                        return (
                            <li 
                                id={`${id}-suggestion-${index}`}
                                key={suggestion}
                                role="option"
                                aria-selected={index === activeIndex}
                                onMouseOver={() => setActiveIndex(index)}
                                onClick={() => onSuggestionSelect(suggestion)}
                                className={`px-4 py-2 text-sm text-gray-700 cursor-pointer ${ index === activeIndex ? 'bg-red-500 text-white' : ''}`}
                            >
                                {matchIndex > -1 ? (
                                    <>
                                        {before}
                                        <strong className={index === activeIndex ? 'text-white' : 'text-gray-900'}>{match}</strong>
                                        {after}
                                    </>
                                ) : ( suggestion )}
                            </li>
                        );
                    })}
                </ul>
            )}
            
            <div id={`${id}-location-error`} className="mt-1.5 min-h-[20px]">
                {displayError ? (
                    <div className="flex items-center gap-1.5 text-xs text-red-700 animate-fade-in-up">
                        <AlertIcon className="w-4 h-4 text-red-600" />
                        <span className="font-medium">{displayError}</span>
                    </div>
                ) : status === 'verified' ? (
                    <div className="flex items-center gap-1.5 text-xs text-green-700 animate-fade-in-up">
                        <CheckIcon className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Location Verified</span>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default LocationInput;
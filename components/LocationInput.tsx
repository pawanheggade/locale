

import React, { useEffect, useRef } from 'react';
import { SpinnerIcon, MapPinIcon, CheckIcon, CrosshairsIcon } from './Icons';
import { LocationStatus } from '../hooks/useLocationInput';
import { useSuggestionKeyboardNav } from '../hooks/useSearchSuggestions';
import { Button } from './ui/Button';
import { useClickOutside } from '../hooks/useClickOutside';
import { cn, inputBaseStyles } from '../lib/utils';

interface LocationInputProps {
    id?: string;
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
    className?: string; // To accept className from FormField
}

export const LocationInput: React.FC<LocationInputProps> = ({
    id, value, onValueChange, onSuggestionSelect, onVerify, onOpenMapPicker, onUseMyLocation,
    placeholder, required, suggestions, status, className
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

    useClickOutside(containerRef, () => {
        // Verify logic when clicking outside
        onVerify();
    });

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

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative flex gap-2">
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
                        className={cn(inputBaseStyles, 'w-full h-10 px-3 py-2 pr-10', className)}
                        autoComplete="off"
                        required={required}
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={isDropdownOpen}
                        aria-controls={`${id}-suggestions-listbox`}
                        aria-activedescendant={activeIndex > -1 ? `${id}-suggestion-${activeIndex}` : undefined}
                    />
                    {isVerifying && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <SpinnerIcon className="w-5 h-5 text-gray-600" />
                        </div>
                    )}
                    {status === 'verified' && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <CheckIcon className="w-5 h-5 text-green-600" />
                        </div>
                    )}
                </div>
                {onUseMyLocation && (
                    <Button 
                        type="button" 
                        onClick={onUseMyLocation} 
                        disabled={isVerifying}
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 text-gray-600 border border-gray-300"
                        aria-label="Use my current location" 
                        title="Use my current location"
                    >
                        {status === 'geolocating' ? <SpinnerIcon className="w-5 h-5"/> : <CrosshairsIcon className="w-5 h-5"/>}
                    </Button>
                )}
                <Button 
                    type="button" 
                    onClick={onOpenMapPicker} 
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-gray-600 border border-gray-300"
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
                                onClick={() => onSuggestionSelect(suggestion)}
                                className={`px-4 py-2 text-sm text-gray-600 cursor-pointer ${ index === activeIndex ? 'bg-red-500 text-white' : ''}`}
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
        </div>
    );
};

export default LocationInput;

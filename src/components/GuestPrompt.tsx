import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from './Icons';
import { Button } from './ui/Button';
import { STORAGE_KEYS } from '../lib/constants';
import { useIsMounted } from '../hooks/useIsMounted';

interface GuestPromptProps {
    onSignIn: () => void;
    onCreateAccount: () => void;
}

export const GuestPrompt: React.FC<GuestPromptProps> = ({ onSignIn, onCreateAccount }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const isMounted = useIsMounted();

    useEffect(() => {
        try {
            const dismissed = sessionStorage.getItem(STORAGE_KEYS.GUEST_PROMPT);
            if (!dismissed) {
                // Delay showing the prompt slightly to not be too jarring on load
                setTimeout(() => {
                    if (isMounted()) {
                        setIsVisible(true);
                    }
                }, 2000);
            }
        } catch (error) {
            console.error("Could not access sessionStorage:", error);
        }
    }, [isMounted]);

    const handleDismiss = () => {
        setIsClosing(true);
        try {
            sessionStorage.setItem(STORAGE_KEYS.GUEST_PROMPT, 'true');
        } catch (error) {
            console.error("Could not write to sessionStorage:", error);
        }
        setTimeout(() => {
            if (isMounted()) {
                setIsVisible(false);
            }
        }, 300); // Animation duration
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div 
            className={`fixed bottom-0 left-0 right-0 z-[1000] p-4 flex justify-center pointer-events-none ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
            role="dialog"
            aria-labelledby="guest-prompt-title"
            aria-describedby="guest-prompt-description"
        >
            <div className={`relative w-full max-w-lg bg-white/80 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 pointer-events-auto border border-white/20 ${isClosing ? 'animate-slide-out-down' : 'animate-slide-in-up'}`}>
                <div className="flex-1">
                    <h2 id="guest-prompt-title" className="font-bold text-gray-800">Join the community!</h2>
                    <p id="guest-prompt-description" className="text-sm text-gray-800 mt-1">Sign up to save items, create posts, and connect with locale sellers.</p>
                </div>
                <div className="flex flex-col gap-2 items-stretch flex-shrink-0">
                    <Button onClick={onSignIn} variant="pill-red" size="sm">
                        Sign In
                    </Button>
                    <Button onClick={onCreateAccount} variant="pill-dark" size="sm">
                        Create Account
                    </Button>
                </div>
                 <Button 
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleDismiss} 
                    className="absolute -top-3 -right-3 bg-white/80 backdrop-blur-md rounded-xl border border-white/20 text-gray-500 z-10"
                    aria-label="Dismiss"
                >
                    <XMarkIcon className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
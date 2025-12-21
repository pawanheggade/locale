
import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook to determine the animation class for tab transitions.
 * @param activeTab The currently active tab identifier.
 * @param tabs An array of all tab identifiers in order.
 * @returns The appropriate CSS animation class ('animate-slide-in-from-right' or 'animate-slide-in-from-left').
 */
export const useTabAnimation = (activeTab: string, tabs: string[]) => {
    const [animationClass, setAnimationClass] = useState('');
    const prevTabRef = useRef(activeTab);

    useEffect(() => {
        const prevIndex = tabs.indexOf(prevTabRef.current);
        const currentIndex = tabs.indexOf(activeTab);

        if (prevIndex !== -1 && prevIndex !== currentIndex) {
            setAnimationClass(currentIndex > prevIndex ? 'animate-slide-in-from-right' : 'animate-slide-in-from-left');
        }
        
        prevTabRef.current = activeTab;
    }, [activeTab, tabs]);

    return animationClass;
};

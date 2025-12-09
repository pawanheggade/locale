import React from 'react';
import { ModalState } from '../types';
import { ModalRenderer } from './ModalRenderer';

interface AppModalsProps {
    activeModal: ModalState | null;
    closeModal: () => void;
    openModal: (modalState: ModalState) => void;
    isFindingNearby: boolean;
    handleFindNearby: (coords: { lat: number, lng: number }) => Promise<void>;
    userLocation: { lat: number; lng: number } | null;
    onSignOut: () => void;
    onEnableLocation: () => Promise<void>;
}

export const AppModals: React.FC<AppModalsProps> = (props) => {
    const { activeModal } = props;

    // If there is no active modal, do not render anything
    if (!activeModal) {
        return null;
    }

    // Delegate rendering to the dedicated ModalRenderer component
    return (
        <ModalRenderer 
            {...props} 
            activeModal={activeModal} 
        />
    );
};
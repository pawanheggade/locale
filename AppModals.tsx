import * as React from 'react';
import { ModalState } from './types';
import { ModalRenderer } from './components/ModalRenderer';

interface AppModalsProps {
    activeModal: ModalState | null;
    closeModal: () => void;
    openModal: (modalState: ModalState) => void;
    
    // Location State (Managed in App.tsx due to map coordination)
    isFindingNearby: boolean;
    handleFindNearby: (coords: { lat: number, lng: number }) => Promise<void>;
    userLocation: { lat: number; lng: number } | null;
    
    // Session mgmt override if needed, otherwise handled locally
    onSignOut: () => void;
    onEnableLocation: () => Promise<void>;
}

export const AppModals: React.FC<AppModalsProps> = (props) => {
    const { activeModal } = props;

    if (!activeModal) {
        return null;
    }
    
    return <ModalRenderer {...props} />;
};

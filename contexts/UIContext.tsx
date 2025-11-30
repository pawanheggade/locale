
import React, { createContext, useReducer, useContext, useMemo, useCallback } from 'react';
import { ModalState } from '../types';

// State
interface UIState {
    activeModal: ModalState | null;
}

const initialState: UIState = {
    activeModal: null,
};

// Actions
type UIAction =
    | { type: 'OPEN_MODAL'; payload: ModalState }
    | { type: 'CLOSE_MODAL' };

// Reducer
const uiReducer = (state: UIState, action: UIAction): UIState => {
    switch (action.type) {
        case 'OPEN_MODAL':
            return { ...state, activeModal: action.payload };
        case 'CLOSE_MODAL':
            return { ...state, activeModal: null };
        default:
            return state;
    }
};

// Context
interface UIContextType {
    activeModal: ModalState | null;
    openModal: (modalState: ModalState | null) => void;
    closeModal: () => void;
    // @FIX: Add addToast to fix missing property errors.
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

// Provider
export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(uiReducer, initialState);

    const openModal = useCallback((modalState: ModalState | null) => {
        if (modalState) {
            dispatch({ type: 'OPEN_MODAL', payload: modalState });
        } else {
            dispatch({ type: 'CLOSE_MODAL' });
        }
    }, []);

    const closeModal = useCallback(() => {
        dispatch({ type: 'CLOSE_MODAL' });
    }, []);
    
    // @FIX: Add dummy addToast function to satisfy type.
    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        console.log(`Toast: [${type}] ${message}`);
        // In a real app, this would dispatch an action to show a toast message.
    }, []);

    const value = useMemo(() => ({
        activeModal: state.activeModal,
        openModal,
        closeModal,
        addToast,
    }), [state.activeModal, openModal, closeModal, addToast]);

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

// Hook
export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

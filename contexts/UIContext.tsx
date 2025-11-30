


import React, { createContext, useReducer, useContext, useMemo, useCallback } from 'react';
import { ModalState } from '../types';

// State

// FIX: Add Toast type definition
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
  onUndo?: () => void;
}

interface UIState {
    activeModal: ModalState | null;
    toasts: Toast[];
}

const initialState: UIState = {
    activeModal: null,
    toasts: [],
};

// Actions
type UIAction =
    | { type: 'OPEN_MODAL'; payload: ModalState }
    | { type: 'CLOSE_MODAL' }
    | { type: 'ADD_TOAST'; payload: Toast }
    | { type: 'REMOVE_TOAST'; payload: number };

// Reducer
const uiReducer = (state: UIState, action: UIAction): UIState => {
    switch (action.type) {
        case 'OPEN_MODAL':
            return { ...state, activeModal: action.payload };
        case 'CLOSE_MODAL':
            return { ...state, activeModal: null };
        case 'ADD_TOAST':
            return { ...state, toasts: [...state.toasts, action.payload] };
        case 'REMOVE_TOAST':
            return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
        default:
            return state;
    }
};

// Context
interface UIContextType {
    activeModal: ModalState | null;
    openModal: (modalState: ModalState | null) => void;
    closeModal: () => void;
    toasts: Toast[];
    addToast: (message: string, type?: 'success' | 'error', onUndo?: () => void) => void;
    removeToast: (id: number) => void;
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

    const removeToast = useCallback((id: number) => {
        dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, []);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success', onUndo?: () => void) => {
        const id = Date.now();
        dispatch({ type: 'ADD_TOAST', payload: { id, message, type, onUndo } });

        if (!onUndo) {
            setTimeout(() => {
                removeToast(id);
            }, 5000);
        }
    }, [removeToast]);

    const value = useMemo(() => ({
        activeModal: state.activeModal,
        openModal,
        closeModal,
        toasts: state.toasts,
        addToast,
        removeToast,
    }), [state.activeModal, state.toasts, openModal, closeModal, addToast, removeToast]);

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

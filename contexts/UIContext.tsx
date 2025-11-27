

import React, { createContext, useReducer, useContext, useMemo, useCallback, useRef, useEffect } from 'react';
import { ToastMessage, ModalState } from '../types';

// State
interface UIState {
    toasts: ToastMessage[];
    activeModal: ModalState | null;
}

const initialState: UIState = {
    toasts: [],
    activeModal: null,
};

// Actions
type UIAction =
    | { type: 'ADD_TOAST'; payload: ToastMessage }
    | { type: 'REMOVE_TOAST'; payload: { id: number } }
    | { type: 'OPEN_MODAL'; payload: ModalState }
    | { type: 'CLOSE_MODAL' };

// Reducer
const uiReducer = (state: UIState, action: UIAction): UIState => {
    switch (action.type) {
        case 'ADD_TOAST':
            return { ...state, toasts: [...state.toasts, action.payload] };
        case 'REMOVE_TOAST':
            return { ...state, toasts: state.toasts.filter(toast => toast.id !== action.payload.id) };
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
    toasts: ToastMessage[];
    activeModal: ModalState | null;
    addToast: (message: string, type?: 'success' | 'error', onUndo?: (toastId: number) => void, onTimeout?: () => void) => void;
    removeToast: (id: number) => void;
    openModal: (modalState: ModalState | null) => void;
    closeModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

// Provider
export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(uiReducer, initialState);
    const toastTimeouts = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        return () => {
            Object.values(toastTimeouts.current).forEach(clearTimeout);
        };
    }, []);

    const removeToast = useCallback((id: number) => {
        if (toastTimeouts.current[id]) {
            clearTimeout(toastTimeouts.current[id]);
            delete toastTimeouts.current[id];
        }
        dispatch({ type: 'REMOVE_TOAST', payload: { id } });
    }, []);

    const addToast = useCallback((
        message: string,
        type: 'success' | 'error' = 'success',
        onUndo?: (toastId: number) => void,
        onTimeout?: () => void
    ) => {
        const id = Date.now();
        const toast: ToastMessage = {
            id,
            message,
            type,
            onUndo: onUndo ? () => onUndo(id) : undefined,
            onTimeout
        };
        dispatch({ type: 'ADD_TOAST', payload: toast });

        const timeout = setTimeout(() => {
            removeToast(id);
            if (onTimeout) {
                onTimeout();
            }
        }, 5000);
        toastTimeouts.current[id] = timeout;
    }, [removeToast]);

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

    const value = useMemo(() => ({
        toasts: state.toasts,
        activeModal: state.activeModal,
        addToast,
        removeToast,
        openModal,
        closeModal,
    }), [state.toasts, state.activeModal, addToast, removeToast, openModal, closeModal]);

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




import React, { createContext, useReducer, useContext, useMemo, useCallback, useEffect } from 'react';
import { ModalState, UIState, UIAction, Toast } from '../types';
import { STORAGE_KEYS } from '../lib/constants';

const initialState: UIState = {
    activeModal: null,
    toasts: [],
    gridView: 'default',
    isTabletOrDesktop: window.innerWidth >= 768,
};

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
        case 'SET_GRID_VIEW':
            return { ...state, gridView: action.payload };
        case 'SET_IS_TABLET_OR_DESKTOP':
            return { ...state, isTabletOrDesktop: action.payload };
        default:
            return state;
    }
};

const init = (defaultState: UIState): UIState => {
    try {
        const storedGridView = window.localStorage.getItem(STORAGE_KEYS.GRID_VIEW);
        if (storedGridView) {
            return { ...defaultState, gridView: JSON.parse(storedGridView) };
        }
    } catch (e) {
        console.error("Failed to load grid view from storage", e);
    }
    return defaultState;
}

// Context
interface UIContextType {
    activeModal: ModalState | null;
    openModal: (modalState: ModalState | null) => void;
    closeModal: () => void;
    toasts: Toast[];
    addToast: (message: string, type?: 'success' | 'error', onUndo?: () => void) => void;
    removeToast: (id: number) => void;
    gridView: 'default' | 'compact';
    setGridView: (view: 'default' | 'compact') => void;
    isTabletOrDesktop: boolean;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

// Provider
export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(uiReducer, initialState, init);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.GRID_VIEW, JSON.stringify(state.gridView));
        } catch(e) {
            console.error("Failed to save grid view to storage", e);
        }
    }, [state.gridView]);

    useEffect(() => {
        const handleResize = () => {
            dispatch({ type: 'SET_IS_TABLET_OR_DESKTOP', payload: window.innerWidth >= 768 });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const openModal = useCallback((modalState: ModalState | null) => {
        dispatch({ type: 'OPEN_MODAL', payload: modalState });
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

    const setGridView = useCallback((view: 'default' | 'compact') => {
        dispatch({ type: 'SET_GRID_VIEW', payload: view });
    }, []);

    const value = useMemo(() => ({
        activeModal: state.activeModal,
        openModal,
        closeModal,
        toasts: state.toasts,
        addToast,
        removeToast,
        gridView: state.gridView,
        setGridView,
        isTabletOrDesktop: state.isTabletOrDesktop,
    }), [state, openModal, closeModal, addToast, removeToast, setGridView]);

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
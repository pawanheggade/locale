
import React, { useReducer, useState, useCallback } from 'react';

// Generic reducer action
type Action<T> =
    | { type: 'SET_FIELD'; field: keyof T; payload: any }
    | { type: 'RESET'; payload?: Partial<T> };

// Generic reducer function
const createFormReducer = <T>() => (state: T, action: Action<T>): T => {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.payload };
        case 'RESET':
            // This assumes initialState is in scope, or payload is provided
            return { ...(action.payload as T) };
        default:
            return state;
    }
};

export const useFormState = <T extends {}>(initialState: T) => {
    const formReducer = useCallback(createFormReducer<T>(), []);
    const [state, dispatch] = useReducer(formReducer, initialState);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const setField = useCallback((field: keyof T, payload: any) => {
        dispatch({ type: 'SET_FIELD', field, payload });
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [errors]);

    const resetForm = useCallback((payload?: Partial<T>) => {
        dispatch({ type: 'RESET', payload: payload || initialState });
        setErrors({});
    }, [initialState]);

    const handleSubmit = useCallback((
        submitFn: (state: T) => Promise<void> | void,
        validateFn?: (state: T) => Partial<Record<keyof T, string>>
    ) => async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (validateFn) {
            const validationErrors = validateFn(state);
            if (Object.keys(validationErrors).length > 0 && Object.values(validationErrors).some(v => v)) {
                setErrors(validationErrors);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await submitFn(state);
        } catch (error) {
            console.error("Form submission error:", error);
            // In a real app, you might set a generic form error here
        } finally {
            setIsSubmitting(false);
        }
    }, [state]);

    return {
        state,
        setField,
        resetForm,
        errors,
        setErrors,
        isSubmitting,
        handleSubmit,
    };
};

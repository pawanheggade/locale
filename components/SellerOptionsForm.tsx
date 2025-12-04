import React, { useReducer, useEffect } from 'react';
import { ContactOption } from '../types';
import { CheckboxGroup } from './ui/CheckboxGroup';

const PAYMENT_OPTIONS = ['UPI', 'Credit/Debit Card', 'Cash on Delivery'];
const DELIVERY_OPTIONS = ['Local Pickup', 'Home Delivery'];
const CONTACT_OPTIONS: { id: ContactOption, label: string }[] = [
    { id: 'email', label: 'Email' },
    { id: 'mobile', label: 'Mobile (for calls)' },
    { id: 'message', label: 'Message (e.g. WhatsApp)' }
];

// Reducer logic
export interface SellerOptionsState {
    paymentMethods: string[];
    deliveryOptions: string[];
    contactOptions: ContactOption[];
}

type Action =
    | { type: 'SET_PAYMENT_METHODS'; payload: string[] }
    | { type: 'SET_DELIVERY_OPTIONS'; payload: string[] }
    | { type: 'SET_CONTACT_OPTIONS'; payload: ContactOption[] }
    | { type: 'RESET'; payload: SellerOptionsState };

const reducer = (state: SellerOptionsState, action: Action): SellerOptionsState => {
    switch (action.type) {
        case 'SET_PAYMENT_METHODS':
            return { ...state, paymentMethods: action.payload };
        case 'SET_DELIVERY_OPTIONS':
            return { ...state, deliveryOptions: action.payload };
        case 'SET_CONTACT_OPTIONS':
            return { ...state, contactOptions: action.payload };
        case 'RESET':
            return action.payload;
        default:
            return state;
    }
};

interface SellerOptionsFormProps {
    initialState: SellerOptionsState;
    onChange: (newState: SellerOptionsState) => void;
    isSeller: boolean;
    error?: string;
    hiddenContactOptions?: ContactOption[];
}

export const SellerOptionsForm: React.FC<SellerOptionsFormProps> = ({
    initialState,
    onChange,
    isSeller,
    error,
    hiddenContactOptions = [],
}) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Effect to inform parent component of changes
    useEffect(() => {
        onChange(state);
    }, [state, onChange]);

    // Effect to reset internal state if the initial state from parent changes
    useEffect(() => {
        dispatch({ type: 'RESET', payload: initialState });
    }, [initialState]);

    const filteredContactOptions = CONTACT_OPTIONS.filter(opt => !hiddenContactOptions.includes(opt.id));

    return (
        <>
            <CheckboxGroup
                title="Payment Methods Accepted"
                options={PAYMENT_OPTIONS}
                selectedOptions={state.paymentMethods}
                onChange={(payload) => dispatch({ type: 'SET_PAYMENT_METHODS', payload })}
            />
            <CheckboxGroup
                title="Delivery Options"
                options={DELIVERY_OPTIONS}
                selectedOptions={state.deliveryOptions}
                onChange={(payload) => dispatch({ type: 'SET_DELIVERY_OPTIONS', payload })}
            />
             {isSeller && filteredContactOptions.length > 0 && (
                <div className="md:col-span-2">
                    <CheckboxGroup
                        title="Contact Methods"
                        description="Select how customers can contact you (at least one is required)."
                        options={filteredContactOptions}
                        selectedOptions={state.contactOptions}
                        onChange={(payload) => dispatch({ type: 'SET_CONTACT_OPTIONS', payload: payload as ContactOption[] })}
                        error={error}
                    />
                </div>
            )}
        </>
    );
};

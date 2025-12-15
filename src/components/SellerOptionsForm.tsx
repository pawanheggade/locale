
import React from 'react';
import { ContactOption } from '../types';
import { CheckboxGroup } from './ui/CheckboxGroup';

const PAYMENT_OPTIONS = ['UPI', 'Credit/Debit Card', 'Cash on Delivery'];
const DELIVERY_OPTIONS = ['Local Pickup', 'Home Delivery'];
const CONTACT_OPTIONS: { id: ContactOption, label: string }[] = [
    { id: 'email', label: 'Email' },
    { id: 'mobile', label: 'Mobile (Voice Call)' },
    { id: 'message', label: 'Messaging (WhatsApp, etc.)' }
];

export interface SellerOptionsState {
    paymentMethods: string[];
    deliveryOptions: string[];
    contactOptions: ContactOption[];
}

interface SellerOptionsFormProps {
    paymentMethods: string[];
    deliveryOptions: string[];
    contactOptions: ContactOption[];
    onPaymentChange: (methods: string[]) => void;
    onDeliveryChange: (options: string[]) => void;
    onContactChange: (options: ContactOption[]) => void;
    isSeller: boolean;
    error?: Record<string, string | undefined>;
}

export const SellerOptionsForm: React.FC<SellerOptionsFormProps> = ({
    paymentMethods,
    deliveryOptions,
    contactOptions,
    onPaymentChange,
    onDeliveryChange,
    onContactChange,
    isSeller,
    error,
}) => {
    return (
        <>
            <CheckboxGroup
                title="Payment Methods Accepted"
                options={PAYMENT_OPTIONS}
                selectedOptions={paymentMethods}
                onChange={onPaymentChange}
                error={error?.paymentMethods}
            />
            <CheckboxGroup
                title="Delivery Options"
                options={DELIVERY_OPTIONS}
                selectedOptions={deliveryOptions}
                onChange={onDeliveryChange}
                error={error?.deliveryOptions}
            />
             {isSeller && (
                <div className="md:col-span-2">
                    <CheckboxGroup
                        title="Contact Methods"
                        description="Select how customers can contact you (at least one is required)."
                        options={CONTACT_OPTIONS}
                        selectedOptions={contactOptions}
                        onChange={(payload) => onContactChange(payload as ContactOption[])}
                        error={error?.contactOptions}
                    />
                </div>
            )}
        </>
    );
};

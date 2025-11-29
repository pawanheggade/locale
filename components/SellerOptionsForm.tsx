import React from 'react';
import { ContactOption } from '../types';
import { CheckboxGroup } from './ui/CheckboxGroup';

const PAYMENT_OPTIONS = ['UPI', 'Credit/Debit Card', 'Cash on Delivery'];
const DELIVERY_OPTIONS = ['Local Pickup', 'Home Delivery'];
const CONTACT_OPTIONS: { id: ContactOption, label: string }[] = [
    { id: 'email', label: 'Email' },
    { id: 'mobile', label: 'Mobile (for calls)' },
    { id: 'message', label: 'Message (e.g. WhatsApp)' }
];

interface SellerOptionsFormProps {
    paymentMethods?: string[];
    onPaymentMethodsChange?: (methods: string[]) => void;
    deliveryOptions: string[];
    onDeliveryOptionsChange: (options: string[]) => void;
    contactOptions?: ContactOption[];
    onContactOptionsChange?: (options: ContactOption[]) => void;
    isSeller: boolean;
    error?: string;
    showContactOptions?: boolean;
}

export const SellerOptionsForm: React.FC<SellerOptionsFormProps> = ({
    paymentMethods,
    onPaymentMethodsChange,
    deliveryOptions,
    onDeliveryOptionsChange,
    contactOptions,
    onContactOptionsChange,
    isSeller,
    error,
    showContactOptions = true,
}) => {
    return (
        <>
            {paymentMethods && onPaymentMethodsChange && (
                <CheckboxGroup
                    title="Payment Methods Accepted"
                    options={PAYMENT_OPTIONS}
                    selectedOptions={paymentMethods}
                    onChange={onPaymentMethodsChange}
                />
            )}
            <CheckboxGroup
                title="Delivery Options"
                options={DELIVERY_OPTIONS}
                selectedOptions={deliveryOptions}
                onChange={onDeliveryOptionsChange}
            />
             {isSeller && showContactOptions && contactOptions && onContactOptionsChange && (
                <div className="md:col-span-2">
                    <CheckboxGroup
                        title="Contact Methods"
                        description="Select how customers can contact you (at least one is required)."
                        options={CONTACT_OPTIONS}
                        selectedOptions={contactOptions}
                        onChange={onContactOptionsChange}
                        error={error}
                    />
                </div>
            )}
        </>
    );
};

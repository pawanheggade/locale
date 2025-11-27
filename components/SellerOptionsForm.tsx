
import React from 'react';
import { ContactOption } from '../types';

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
    const handleCheckboxChange = (
        currentSelection: string[],
        setter: (newSelection: any[]) => void,
        option: string
    ) => {
        const newSelection = currentSelection.includes(option)
            ? currentSelection.filter(item => item !== option)
            : [...currentSelection, option];
        setter(newSelection);
    };

    return (
        <>
            {paymentMethods && onPaymentMethodsChange && (
                <div>
                    <label className="block text-sm font-medium text-gray-600">Payment Methods Accepted</label>
                    <div className="mt-2 space-y-2">
                        {PAYMENT_OPTIONS.map(option => (
                            <div key={option} className="flex items-center">
                                <input
                                    id={`payment-${option}`}
                                    type="checkbox"
                                    checked={paymentMethods.includes(option)}
                                    onChange={() => handleCheckboxChange(paymentMethods, onPaymentMethodsChange, option)}
                                    className="h-4 w-4 text-red-600 border-gray-300 rounded"
                                />
                                <label htmlFor={`payment-${option}`} className="ml-2 block text-sm text-gray-900">{option}</label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-600">Delivery Options</label>
                <div className="mt-2 space-y-2">
                    {DELIVERY_OPTIONS.map(option => (
                        <div key={option} className="flex items-center">
                            <input
                                id={`delivery-${option}`}
                                type="checkbox"
                                checked={deliveryOptions.includes(option)}
                                onChange={() => handleCheckboxChange(deliveryOptions, onDeliveryOptionsChange, option)}
                                className="h-4 w-4 text-red-600 border-gray-300 rounded"
                            />
                            <label htmlFor={`delivery-${option}`} className="ml-2 block text-sm text-gray-900">{option}</label>
                        </div>
                    ))}
                </div>
            </div>
             {isSeller && showContactOptions && (
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600">Contact Methods</label>
                    <p className="text-xs text-gray-600">Select how customers can contact you (at least one is required).</p>
                    <div className="mt-2 space-y-2">
                        {CONTACT_OPTIONS.map(option => (
                            <div key={option.id} className="flex items-center">
                                <input
                                    id={`contact-${option.id}`}
                                    type="checkbox"
                                    checked={contactOptions?.includes(option.id)}
                                    onChange={() => handleCheckboxChange(contactOptions || [], onContactOptionsChange!, option.id)}
                                    className="h-4 w-4 text-red-600 border-gray-300 rounded"
                                />
                                <label htmlFor={`contact-${option.id}`} className="ml-2 block text-sm text-gray-900">{option.label}</label>
                            </div>
                        ))}
                    </div>
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>
            )}
        </>
    );
};

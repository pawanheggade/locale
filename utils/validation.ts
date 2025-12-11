import { Account, PostType } from '../types';

// Validates 10 digits, starting with 6, 7, 8, or 9 (Standard Mobile Format)
export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

// A subset of Account fields relevant for validation
export interface AccountValidationData {
    name?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    mobile?: string;
    messageNumber?: string;
    googleMapsUrl?: string;
    address?: string;
}

type FieldToValidate = keyof AccountValidationData;

/**
 * Validates account form data for creation or editing.
 * Can validate the entire form or a single field.
 * @param formData The data from the form.
 * @param allAccounts An array of all existing accounts to check for uniqueness.
 * @param isEditing A boolean indicating if the form is for editing an existing account.
 * @param currentAccountId The ID of the account being edited (if applicable).
 * @param fieldToValidate The specific field to validate (for on-blur validation).
 * @returns An object containing error messages for invalid fields.
 */
export const validateAccountData = (
    formData: AccountValidationData,
    allAccounts: Account[],
    isEditing: boolean,
    currentAccountId?: string,
    fieldToValidate?: FieldToValidate,
    isSeller: boolean = false
): Record<string, string | undefined> => {
    const errors: Record<string, string | undefined> = {};
    const { name, username, email, password, confirmPassword, mobile, messageNumber, googleMapsUrl, address } = formData;

    const validators: Record<FieldToValidate, () => string | undefined> = {
        name: () => {
            if (name === undefined || !name.trim()) return 'Name cannot be empty.';
            return undefined;
        },
        username: () => {
            if (username === undefined) return undefined;
            const trimmedUsername = username.trim();
            if (!trimmedUsername) return 'Username cannot be empty.';
            if (!/^[a-zA-Z0-9_.]+$/.test(trimmedUsername)) return 'Username can only contain letters, numbers, underscores, and periods.';
            if (allAccounts.some(a => a.id !== currentAccountId && a.username.toLowerCase() === trimmedUsername.toLowerCase())) return 'Username is already taken.';
            return undefined;
        },
        email: () => {
            if (email === undefined) return undefined;
            const trimmedEmail = email.trim();
            if (!trimmedEmail) return 'Email cannot be empty.';
            if (!/\S+@\S+\.\S+/.test(trimmedEmail)) return 'Please enter a valid email address.';
            if (allAccounts.some(a => a.id !== currentAccountId && a.email.toLowerCase() === trimmedEmail.toLowerCase())) return 'Email is already in use.';
            return undefined;
        },
        password: () => {
            if (isEditing) return undefined; // Password not required on edit
            if (password === undefined || !password) return 'Password is required.';
            if (password.length < 8) return 'Password must be at least 8 characters long.';
            return undefined;
        },
        confirmPassword: () => {
            if (isEditing) return undefined; // Password not required on edit
            if (confirmPassword === undefined || !confirmPassword) return 'Please confirm your password.';
            if (password !== confirmPassword) return 'Passwords do not match.';
            return undefined;
        },
        mobile: () => {
            if (mobile !== undefined && mobile.trim() && !PHONE_REGEX.test(mobile.trim())) return 'Please enter a valid 10-digit mobile number (starts with 6-9).';
            return undefined;
        },
        messageNumber: () => {
            if (messageNumber !== undefined && messageNumber.trim() && !PHONE_REGEX.test(messageNumber.trim())) return 'Please enter a valid 10-digit message number (starts with 6-9).';
            return undefined;
        },
        googleMapsUrl: () => {
            if (isSeller) {
                if (googleMapsUrl === undefined || !googleMapsUrl.trim()) return 'Google Maps location is required for sellers.';
                if (!URL_REGEX.test(googleMapsUrl.trim())) return 'Please enter a valid URL.';
            }
            return undefined;
        },
        address: () => {
            if (address !== undefined && address.trim()) {
                if (address.trim().length < 10) return 'Address is too short. Please provide a complete address.';
            }
            return undefined;
        },
    };

    if (fieldToValidate) {
        errors[fieldToValidate] = validators[fieldToValidate]();
    } else {
        // Validate all fields by calling each validator
        for (const key of Object.keys(validators)) {
            const fieldKey = key as FieldToValidate;
            errors[fieldKey] = validators[fieldKey]();
        }
    }

    // Clean up undefined errors
    for (const key in errors) {
        if (errors[key] === undefined) {
            delete errors[key];
        }
    }

    return errors;
};


interface PostValidationData {
    title: string;
    description: string;
    location: string;
    hasCoordinates: boolean;
    price: string;
    isOnSale: boolean;
    salePrice: string;
    type: PostType;
    eventLocation: string;
    eventStartDate: string;
    hasExpiry: boolean;
    expiryDate: string;
    contactForPrice?: boolean;
}

interface PostValidationOptions {
    TITLE_MAX_LENGTH: number;
    DESCRIPTION_MAX_LENGTH: number;
    MAX_PRICE: number;
}

export const validatePostData = (
    data: PostValidationData,
    options: PostValidationOptions
): Record<string, string> => {
    const errors: Record<string, string> = {};
    const {
        title, description, location, hasCoordinates, price, isOnSale, salePrice,
        type, eventLocation, eventStartDate, hasExpiry, expiryDate, contactForPrice
    } = data;
    const { TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, MAX_PRICE } = options;
    const priceNum = parseFloat(price);

    if (!title.trim()) errors.title = 'Title is required.';
    else if (title.length > TITLE_MAX_LENGTH) errors.title = `Title cannot exceed ${TITLE_MAX_LENGTH} characters.`;

    if (!description.trim()) errors.description = 'Description is required.';
    else if (description.length > DESCRIPTION_MAX_LENGTH) errors.description = `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.`;
    
    if (type !== 'EVENT' && (!location.trim() || !hasCoordinates)) errors.location = 'A verified location is required. Use the map to pinpoint your location.';
    
    if (!contactForPrice) {
        if (!price) {
            errors.price = 'Price is required unless "Contact for price" is checked.';
        } else if (isNaN(priceNum) || priceNum < 0) {
            errors.price = 'Please enter a valid, non-negative price.';
        } else if (priceNum > MAX_PRICE) {
            errors.price = `Price cannot exceed ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(MAX_PRICE)}.`;
        }
    }

    if (isOnSale) {
        const salePriceNum = parseFloat(salePrice);
        if (!salePrice) errors.salePrice = 'Sale price is required.';
        else if (isNaN(salePriceNum) || salePriceNum < 0) errors.salePrice = 'Please enter a valid, non-negative sale price.';
        else if (salePriceNum >= priceNum) errors.salePrice = 'Sale price must be less than the original price.';
    }
    
    if (type === 'EVENT' && !eventLocation.trim()) errors.eventLocation = 'Event location is required for events.';
    if (type === 'EVENT' && !eventStartDate) errors.eventStartDate = 'Event start date is required for events.';
    if (type !== 'EVENT' && hasExpiry && !expiryDate) errors.expiryDate = 'An expiry date is required when checked.';
    
    return errors;
};

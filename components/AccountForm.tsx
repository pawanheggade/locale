import React, { useState, useEffect, useRef, useReducer } from 'react';
import { Account, ContactOption, SocialLink, SocialPlatform } from '../types';
import { EnvelopeIcon, LockClosedIcon, PhoneIcon, ChatBubbleBottomCenterTextIcon, SpinnerIcon, PhotoIcon, GlobeAltIcon, InstagramIcon, YouTubeIcon, CheckIcon } from './Icons';
import { validateAccountData, AccountValidationData, URL_REGEX } from '../utils/validation';
import { InputWithIcon } from './InputWithIcon';
import { fileToDataUrl, compressImage } from '../utils/media';
import { SellerOptionsForm, SellerOptionsState } from './SellerOptionsForm';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { Button } from './ui/Button';
import { Avatar } from './Avatar';
import { useLocationInput } from '../hooks/useLocationInput';
import LocationInput from './LocationInput';
import LocationPickerMap from './LocationPickerMap';
import { FormField } from './FormField';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const DESCRIPTION_MAX_LENGTH = 150;

interface AccountFormProps {
    account?: Account | null;
    isEditing: boolean;
    allAccounts: Account[];
    onSubmit: (formData: Partial<Account>, confirmPassword?: string, referralCode?: string) => Promise<void>;
    formId: string;
    isSubmitting?: boolean;
    isSellerSignup?: boolean;
    onToggleMap?: (isOpen: boolean) => void;
}

// Initial state for the reducer
const initialState = {
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    description: '',
    avatarUrl: '',
    bannerUrl: '',
    mobile: '',
    messageNumber: '',
    taxInfo: '',
    googleMapsUrl: '',
    appleMapsUrl: '',
    businessName: '',
    sellerOptions: {
        paymentMethods: [] as string[],
        deliveryOptions: [] as string[],
        contactOptions: [] as ContactOption[],
    },
    referralCode: '',
    socials: {
        website: '',
        instagram: '',
        youtube: '',
    } as Record<SocialPlatform, string>,
};

type FormState = typeof initialState;
type Action = 
    | { type: 'SET_FIELD'; field: keyof Omit<FormState, 'sellerOptions' | 'socials'>; value: any }
    | { type: 'SET_SELLER_OPTIONS'; payload: SellerOptionsState }
    | { type: 'SET_SOCIAL'; platform: SocialPlatform; value: string }
    | { type: 'RESET'; payload: Partial<FormState> };

const formReducer = (state: FormState, action: Action): FormState => {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value };
        case 'SET_SELLER_OPTIONS':
            return { ...state, sellerOptions: action.payload };
        case 'SET_SOCIAL':
            return { ...state, socials: { ...state.socials, [action.platform]: action.value } };
        case 'RESET':
            return { ...state, ...action.payload };
        default:
            return state;
    }
};

export const AccountForm: React.FC<AccountFormProps> = ({ account, isEditing, allAccounts, onSubmit, formId, isSubmitting, isSellerSignup = false, onToggleMap }) => {
    const { currentAccount } = useAuth();
    const [state, dispatch] = useReducer(formReducer, initialState);
    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    
    const locationInput = useLocationInput(
        !isEditing && currentAccount?.address ? currentAccount.address : '',
        !isEditing && currentAccount?.coordinates ? currentAccount.coordinates : null
    );

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const isCreating = !isEditing;

    useEffect(() => {
        if (account) {
            const socials = { ...initialState.socials };
            account.socialLinks?.forEach(link => {
                if (link.platform in socials) socials[link.platform] = link.url;
            });

            const initialSellerOptions: SellerOptionsState = {
                paymentMethods: account.paymentMethods || [],
                deliveryOptions: account.deliveryOptions || [],
                contactOptions: (isEditing && isSellerSignup) ? ['email'] : (account.contactOptions || ['email']),
            };

            dispatch({
                type: 'RESET',
                payload: {
                    name: account.name || '',
                    username: account.username || '',
                    email: account.email || '',
                    description: account.description || '',
                    avatarUrl: account.avatarUrl || '',
                    bannerUrl: account.bannerUrl || '',
                    mobile: account.mobile || '',
                    messageNumber: account.messageNumber || '',
                    taxInfo: account.taxInfo || '',
                    googleMapsUrl: account.googleMapsUrl || '',
                    appleMapsUrl: account.appleMapsUrl || '',
                    businessName: account.businessName || '',
                    sellerOptions: initialSellerOptions,
                    socials,
                }
            });
        }
    }, [account, isEditing, isSellerSignup]);

    const handleFieldChange = (field: keyof Omit<FormState, 'sellerOptions' | 'socials'>, value: any) => {
        dispatch({ type: 'SET_FIELD', field, value });
        if (errors[field as string]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field as string];
                return newErrors;
            });
        }
    };

    const handleSellerOptionChange = (field: keyof SellerOptionsState, value: any) => {
        dispatch({
            type: 'SET_SELLER_OPTIONS',
            payload: { ...state.sellerOptions, [field]: value }
        });
        if (errors[field as keyof SellerOptionsState]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleMapToggle = (isOpen: boolean) => {
        setShowMapPicker(isOpen);
        if (onToggleMap) onToggleMap(isOpen);
    };

    const validate = (fieldToValidate?: keyof AccountValidationData): boolean => {
        const isSeller = isSellerSignup || (isEditing && account?.subscription.tier !== 'Personal');
        const validationData: AccountValidationData = { 
            name: state.name, 
            username: state.username, 
            email: state.email, 
            password: state.password, 
            confirmPassword: state.confirmPassword, 
            mobile: state.mobile, 
            messageNumber: state.messageNumber, 
            googleMapsUrl: state.googleMapsUrl, 
            address: locationInput.location 
        };
        
        const validationErrors = validateAccountData(
            validationData,
            allAccounts,
            isEditing,
            account?.id,
            fieldToValidate,
            isSeller
        );
        
        if (isSeller && state.sellerOptions.contactOptions.length === 0) {
            validationErrors.contactOptions = 'As a seller, you must select at least one contact method.';
        }
        if (isSeller && state.sellerOptions.paymentMethods.length === 0) {
            validationErrors.paymentMethods = 'As a seller, you must select at least one payment method.';
        }
        if (isSeller && state.sellerOptions.deliveryOptions.length === 0) {
            validationErrors.deliveryOptions = 'As a seller, you must select at least one delivery option.';
        }

        (Object.keys(state.socials) as SocialPlatform[]).forEach(platform => {
            const url = state.socials[platform].trim();
            if (url && !URL_REGEX.test(url)) {
                validationErrors[`social-${platform}`] = 'Please enter a valid URL.';
            }
        });
        
        if (fieldToValidate) {
            setErrors(prev => ({ ...prev, [fieldToValidate]: validationErrors[fieldToValidate] }));
            return validationErrors[fieldToValidate] === undefined;
        } else {
            setErrors(validationErrors);
            return Object.keys(validationErrors).length === 0;
        }
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const maxWidth = type === 'banner' ? 1200 : 400;
                const compressedFile = await compressImage(file, { maxWidth, quality: 0.8 });
                const dataUrl = await fileToDataUrl(compressedFile);
                handleFieldChange(type === 'avatar' ? 'avatarUrl' : 'bannerUrl', dataUrl);
            } catch (error) {
                console.error(`Failed to process ${type}:`, error);
                setErrors(prev => ({ ...prev, [type]: `Failed to process image.` }));
            }
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'mobile' | 'messageNumber') => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
        handleFieldChange(fieldName, val);
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFieldChange('username', e.target.value);
        setIsUsernameAvailable(false);
    };

    const handleUsernameBlur = () => {
        const isValid = validate('username');
        if (isValid && state.username.trim()) {
            setIsUsernameAvailable(true);
        } else {
            setIsUsernameAvailable(false);
        }
    };

    const handleNext = () => {
        setErrors({});
        const fieldsToValidate: (keyof AccountValidationData | 'contactOptions' | 'paymentMethods' | 'deliveryOptions')[] = ['name', 'username', 'email', 'password', 'confirmPassword'];
        if (isSellerSignup) {
            fieldsToValidate.push('googleMapsUrl', 'address', 'contactOptions', 'paymentMethods', 'deliveryOptions');
        }

        if (!validate()) {
            // Re-validate to get all errors, then filter for step 1
            const allErrors = validateAccountData({ ...state, address: locationInput.location }, allAccounts, false, undefined, undefined, isSellerSignup);
            if (isSellerSignup) {
                if (state.sellerOptions.contactOptions.length === 0) allErrors.contactOptions = 'At least one contact method is required.';
                if (state.sellerOptions.paymentMethods.length === 0) allErrors.paymentMethods = 'At least one payment method is required.';
                if (state.sellerOptions.deliveryOptions.length === 0) allErrors.deliveryOptions = 'At least one delivery option is required.';
            }
            
            const step1Errors: Record<string, string | undefined> = {};
            fieldsToValidate.forEach(field => {
                if (allErrors[field as string]) {
                    step1Errors[field as string] = allErrors[field as string];
                }
            });

            if (Object.keys(step1Errors).length > 0) {
                setErrors(step1Errors);
                return;
            }
        }

        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await locationInput.verify();
        
        if (!validate()) return;
        setErrors({});

        const platformOrder: SocialPlatform[] = ['website', 'youtube', 'instagram'];
        const socialLinks: SocialLink[] = platformOrder
            .filter(platform => state.socials[platform] && state.socials[platform].trim() !== '')
            .map(platform => ({ platform, url: state.socials[platform].trim() }));

        const { sellerOptions, socials, password, confirmPassword, referralCode, ...restOfState } = state;

        const submissionData: Partial<Account> = {
            ...restOfState,
            ...sellerOptions,
            name: state.name.trim(),
            username: state.username.trim(),
            email: state.email.trim(),
            description: state.description.trim(),
            address: locationInput.location.trim(),
            coordinates: locationInput.coordinates,
            socialLinks,
        };

        if (!isEditing) {
            submissionData.password = state.password;
        }

        await onSubmit(submissionData, state.confirmPassword, state.referralCode);
    };

    const isSeller = isSellerSignup || (isEditing && account?.subscription.tier !== 'Personal');

    if (showMapPicker) {
        return (
            <LocationPickerMap
                initialCoordinates={locationInput.coordinates}
                onLocationSelect={(loc) => {
                    locationInput.selectFromMap(loc);
                    handleMapToggle(false);
                }}
                onCancel={() => handleMapToggle(false)}
            />
        );
    }

    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
            {(step === 1 || !isCreating) && (
                <div className="space-y-4">
                     {isCreating && <h3 className="text-base font-medium text-gray-800 border-b pb-2">{isSellerSignup ? 'Step 1: Required Information' : 'Step 1: Required Information'}</h3>}

                    {!isCreating && (
                        <div>
                             <h3 className="text-base font-medium text-gray-800">Profile Appearance</h3>
                            <div>
                                <span className="block text-sm font-medium text-gray-600 mb-1">Banner Image</span>
                                <div 
                                    className="mt-1 relative w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
                                    onClick={() => bannerInputRef.current?.click()}
                                >
                                    {state.bannerUrl ? (
                                        <img src={state.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-600">
                                            <PhotoIcon className="w-8 h-8 mb-1" />
                                            <span className="text-xs">Click to upload banner</span>
                                        </div>
                                    )}
                                    <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} className="hidden" accept="image/png, image/jpeg, image/gif" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                                <Avatar src={state.avatarUrl} alt="Profile avatar preview" size="xl" className="border-2 border-gray-200 bg-gray-100" />
                                <div>
                                    <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" accept="image/png, image/jpeg, image/gif" />
                                    <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">Upload Avatar</Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="pt-4 mt-4 border-t border-gray-200">
                        <FormField id="account-name" label="Name" error={errors.name}>
                            <Input type="text" value={state.name} onChange={(e) => handleFieldChange('name', e.target.value)} onBlur={() => validate('name')} autoFocus />
                        </FormField>
                    </div>
                    <div>
                        <FormField id="account-username" label="Username" error={errors.username}>
                            <InputWithIcon type="text" value={state.username} onChange={handleUsernameChange} onBlur={handleUsernameBlur} icon={<span className="text-gray-600 sm:text-sm">@</span>} />
                        </FormField>
                        {isUsernameAvailable && !errors.username && (
                            <p className="mt-1 text-sm text-green-600 flex items-center gap-1 animate-fade-in"><CheckIcon className="w-4 h-4" /> Username available</p>
                        )}
                    </div>
                    <FormField id="account-email" label="Email" error={errors.email}>
                        <InputWithIcon type="email" value={state.email} onChange={(e) => handleFieldChange('email', e.target.value)} onBlur={() => validate('email')} icon={<EnvelopeIcon className="w-5 h-5 text-gray-400" />} />
                    </FormField>

                    {!isEditing && (
                        <>
                            <div>
                                <FormField id="account-password" label="Password" error={errors.password}>
                                    <InputWithIcon type="password" value={state.password} onChange={(e) => handleFieldChange('password', e.target.value)} onBlur={() => validate('password')} icon={<LockClosedIcon className="w-5 h-5 text-gray-400" />} />
                                </FormField>
                                <PasswordStrengthMeter password={state.password} />
                            </div>
                            <FormField id="account-confirm-password" label="Confirm Password" error={errors.confirmPassword}>
                                <InputWithIcon type="password" value={state.confirmPassword} onChange={(e) => handleFieldChange('confirmPassword', e.target.value)} onBlur={() => validate('confirmPassword')} icon={<LockClosedIcon className="w-5 h-5 text-gray-400" />} />
                            </FormField>
                            <div className="pt-4 border-t">
                                <FormField id="referral-code" label="Referral Code (Optional)">
                                    <Input type="text" value={state.referralCode} onChange={(e) => handleFieldChange('referralCode', e.target.value)} placeholder="e.g. PRIYA7582" />
                                </FormField>
                            </div>
                        </>
                    )}

                    {isSeller && (isCreating ? isSellerSignup && step === 1 : true) && (
                         <div className="animate-fade-in-down space-y-4 pt-4 mt-4 border-t">
                            {isCreating && isSellerSignup && <h3 className="text-base font-medium text-gray-800">Business Information</h3>}
                            {!isCreating && <h3 className="text-base font-medium text-gray-800">Business Information</h3>}
                             
                             {!isCreating && (
                                <>
                                <FormField id="account-business-name" label="Business Name (Optional)" description="If different from your personal name.">
                                     <Input type="text" value={state.businessName} onChange={(e) => handleFieldChange('businessName', e.target.value)} placeholder="e.g., The Vintage Corner" />
                                 </FormField>
                                 <FormField id="account-tax-info" label="Tax Info (Optional)" description="Provide your 15-digit GSTIN.">
                                     <Input type="text" value={state.taxInfo} onChange={(e) => handleFieldChange('taxInfo', e.target.value)} placeholder="e.g., GSTIN" maxLength={15} />
                                 </FormField>
                                </>
                             )}
                              <div>
                                <FormField id="account-google-maps" label="Google Maps Location" error={errors.googleMapsUrl}>
                                    <Input type="url" value={state.googleMapsUrl} onChange={(e) => handleFieldChange('googleMapsUrl', e.target.value)} onBlur={() => validate('googleMapsUrl')} placeholder="https://maps.app.goo.gl/..." />
                                </FormField>
                                <p className="mt-1 text-xs text-gray-600">Share a link to your business on Google Maps. This is required for sellers.</p>
                             </div>
                             <div>
                                <FormField id="account-address" label="Location" error={errors.address || locationInput.error}>
                                    <LocationInput value={locationInput.location} onValueChange={locationInput.setLocation} onSuggestionSelect={locationInput.selectSuggestion} onVerify={locationInput.verify} onOpenMapPicker={() => handleMapToggle(true)} suggestions={locationInput.suggestions} status={locationInput.status} placeholder="e.g., 123 Main St, Mumbai" />
                                </FormField>
                                <p className="mt-1 text-xs text-gray-600">This location helps calculate distance for others. It may be displayed publicly.</p>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SellerOptionsForm
                                    paymentMethods={state.sellerOptions.paymentMethods}
                                    deliveryOptions={state.sellerOptions.deliveryOptions}
                                    contactOptions={state.sellerOptions.contactOptions}
                                    onPaymentChange={(methods) => handleSellerOptionChange('paymentMethods', methods)}
                                    onDeliveryChange={(options) => handleSellerOptionChange('deliveryOptions', options)}
                                    onContactChange={(options) => handleSellerOptionChange('contactOptions', options)}
                                    isSeller={isSeller}
                                    error={errors}
                                />
                            </div>
                         </div>
                    )}
                </div>
            )}
            
            {(!isCreating || step === 2) && (
                <div className={cn("space-y-4", isCreating && "animate-fade-in-down")}>
                    {isCreating && <h3 className="text-base font-medium text-gray-800 border-b pb-2">Step 2: Optional Information</h3>}

                    {isCreating && (
                         <div className="space-y-4">
                            <h3 className="text-base font-medium text-gray-800">Profile Appearance</h3>
                            <div>
                                <span className="block text-sm font-medium text-gray-600 mb-1">Banner Image</span>
                                <div className="mt-1 relative w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden" onClick={() => bannerInputRef.current?.click()}>
                                    {state.bannerUrl ? (
                                        <img src={state.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-600"><PhotoIcon className="w-8 h-8 mb-1" /><span className="text-xs">Click to upload banner</span></div>
                                    )}
                                    <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} className="hidden" accept="image/png, image/jpeg, image/gif" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Avatar src={state.avatarUrl} alt="Profile avatar preview" size="xl" className="border-2 border-gray-200 bg-gray-100" />
                                <div>
                                    <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" accept="image/png, image/jpeg, image/gif" />
                                    <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">Upload Avatar</Button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="pt-4 mt-4 border-t border-gray-200 space-y-4">
                        {!isCreating && <h3 className="text-base font-medium text-gray-800">Additional Info</h3>}
                        
                        {isCreating && isSellerSignup && (
                            <>
                                <FormField id="account-business-name" label="Business Name (Optional)" description="If different from your personal name.">
                                     <Input type="text" value={state.businessName} onChange={(e) => handleFieldChange('businessName', e.target.value)} placeholder="e.g., The Vintage Corner" />
                                 </FormField>
                                 <FormField id="account-tax-info" label="Tax Info (Optional)" description="Provide your 15-digit GSTIN.">
                                     <Input type="text" value={state.taxInfo} onChange={(e) => handleFieldChange('taxInfo', e.target.value)} placeholder="e.g., GSTIN" maxLength={15} />
                                 </FormField>
                            </>
                        )}

                        <FormField id="account-description" label="Bio" description={`${state.description.length} / ${DESCRIPTION_MAX_LENGTH}`}>
                            <Textarea rows={3} value={state.description} onChange={(e) => handleFieldChange('description', e.target.value)} maxLength={DESCRIPTION_MAX_LENGTH} placeholder="Tell others a little about yourself or what you sell." />
                        </FormField>
                        <FormField id="account-mobile" label="Mobile Number" error={errors.mobile}>
                            <InputWithIcon type="tel" value={state.mobile} onChange={(e) => handlePhoneChange(e, 'mobile')} onBlur={() => validate('mobile')} icon={<PhoneIcon className="w-5 h-5 text-gray-400" />} placeholder="e.g. 9876543210" maxLength={10} inputMode="numeric" />
                        </FormField>
                        <div>
                            <FormField id="account-message" label="Message Number" error={errors.messageNumber}>
                                <InputWithIcon type="tel" value={state.messageNumber} onChange={(e) => handlePhoneChange(e, 'messageNumber')} onBlur={() => validate('messageNumber')} icon={<ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-gray-400" />} placeholder="e.g. 9876543210" maxLength={10} inputMode="numeric" />
                            </FormField>
                            <p className="mt-1 text-xs text-gray-600">Number for messaging apps like WhatsApp.</p>
                        </div>

                        {isCreating && !isSellerSignup && (
                           <div>
                                <FormField id="account-address" label="Location (Optional)" error={errors.address || locationInput.error}>
                                    <LocationInput value={locationInput.location} onValueChange={locationInput.setLocation} onSuggestionSelect={locationInput.selectSuggestion} onVerify={locationInput.verify} onOpenMapPicker={() => handleMapToggle(true)} suggestions={locationInput.suggestions} status={locationInput.status} placeholder="e.g., 123 Main St, Mumbai" />
                                </FormField>
                                <p className="mt-1 text-xs text-gray-600">This location helps calculate distance for others. It may be displayed publicly.</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <span className="block text-sm font-medium text-gray-600 mb-2">Social Profiles</span>
                            <div className="space-y-3">
                                {[
                                    { id: 'website', icon: GlobeAltIcon, placeholder: 'Website URL' },
                                    { id: 'youtube', icon: YouTubeIcon, placeholder: 'YouTube URL' },
                                    { id: 'instagram', icon: InstagramIcon, placeholder: 'Instagram URL' },
                                ].map(social => (
                                    <FormField key={social.id} id={`social-${social.id}`} label="" error={errors[`social-${social.id}`]}>
                                        <InputWithIcon placeholder={social.placeholder} icon={<social.icon className="w-5 h-5 text-gray-400"/>} value={state.socials[social.id as SocialPlatform]} onChange={e => dispatch({ type: 'SET_SOCIAL', platform: social.id as SocialPlatform, value: e.target.value })} />
                                    </FormField>
                                ))}
                            </div>
                        </div>

                        {isSeller && (isCreating ? isSellerSignup && step === 2 : true) && (
                            <FormField id="account-apple-maps" label="Apple Maps Location (Optional)">
                                <Input type="url" value={state.appleMapsUrl} onChange={(e) => handleFieldChange('appleMapsUrl', e.target.value)} placeholder="https://maps.apple.com/?q=..." />
                            </FormField>
                        )}
                    </div>
                </div>
            )}
            
            {isCreating && (
                <div className="mt-6 pt-4 border-t flex justify-end gap-2">
                    {step === 1 && (
                        <Button type="button" onClick={handleNext} variant="pill-red" className="w-full">
                            Next
                        </Button>
                    )}
                    {step === 2 && (
                        <>
                            <Button type="button" variant="overlay-dark" onClick={() => setStep(1)} className="mr-auto">Back</Button>
                            <Button type="submit" isLoading={isSubmitting} variant="pill-red" className="w-36">Create Account</Button>
                        </>
                    )}
                </div>
            )}
        </form>
    );
};
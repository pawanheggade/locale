

import React, { useState, useEffect, useRef } from 'react';
import { Account, ContactOption, SocialLink, SocialPlatform } from '../types';
import { EnvelopeIcon, LockClosedIcon, PhoneIcon, ChatBubbleBottomCenterTextIcon, SpinnerIcon, PhotoIcon, GlobeAltIcon, InstagramIcon, XIcon, FacebookIcon, YouTubeIcon, CheckIcon } from './Icons';
import { validateAccountData, AccountValidationData } from '../utils/validation';
import { InputWithIcon } from './InputWithIcon';
import { fileToDataUrl, compressImage } from '../utils/media';
import { SellerOptionsForm } from './SellerOptionsForm';
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

interface AccountFormData {
    name: string;
    username: string;
    email: string;
    password?: string;
    description: string;
    avatarUrl: string;
    bannerUrl?: string;
    mobile: string;
    messageNumber: string;
    taxInfo: string;
    address: string;
    coordinates?: { lat: number; lng: number } | null;
    googleMapsUrl: string;
    appleMapsUrl: string;
    businessName: string;
    paymentMethods: string[];
    deliveryOptions: string[];
    contactOptions: ContactOption[];
    socialLinks: SocialLink[];
}

interface AccountFormProps {
    account?: Account | null;
    isEditing: boolean;
    allAccounts: Account[];
    onSubmit: (formData: Partial<AccountFormData>, confirmPassword?: string, referralCode?: string) => Promise<void>;
    formId: string;
    isSubmitting?: boolean;
    isSellerSignup?: boolean;
    onToggleMap?: (isOpen: boolean) => void;
}

export const AccountForm: React.FC<AccountFormProps> = ({ account, isEditing, allAccounts, onSubmit, formId, isSubmitting, isSellerSignup = false, onToggleMap }) => {
    const { currentAccount } = useAuth();
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [description, setDescription] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [mobile, setMobile] = useState('');
    const [messageNumber, setMessageNumber] = useState('');
    const [taxInfo, setTaxInfo] = useState('');
    const [googleMapsUrl, setGoogleMapsUrl] = useState('');
    const [appleMapsUrl, setAppleMapsUrl] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
    const [deliveryOptions, setDeliveryOptions] = useState<string[]>([]);
    const [contactOptions, setContactOptions] = useState<ContactOption[]>(isSellerSignup ? ['email', 'mobile', 'message'] : ['email']);
    const [referralCode, setReferralCode] = useState('');
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [isVerifyingGst, setIsVerifyingGst] = useState(false);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    
    const locationInput = useLocationInput(
        !isEditing && currentAccount?.address ? currentAccount.address : '',
        !isEditing && currentAccount?.coordinates ? currentAccount.coordinates : null
    );

    // Social Media State
    const [socials, setSocials] = useState<Record<SocialPlatform, string>>({
        website: '',
        instagram: '',
        twitter: '',
        facebook: '',
        youtube: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const isCreating = !isEditing;

    useEffect(() => {
        if (account) {
            setName(account.name || '');
            setUsername(account.username || '');
            setEmail(account.email || '');
            setDescription(account.description || '');
            setAvatarUrl(account.avatarUrl || '');
            setBannerUrl(account.bannerUrl || '');
            setMobile(account.mobile || '');
            setMessageNumber(account.messageNumber || '');
            setTaxInfo(account.taxInfo || '');
            setGoogleMapsUrl(account.googleMapsUrl || '');
            setAppleMapsUrl(account.appleMapsUrl || '');
            setBusinessName(account.businessName || '');
            setPaymentMethods(account.paymentMethods || []);
            setDeliveryOptions(account.deliveryOptions || []);
            // When upgrading, don't load old contact options. Default to all selected.
            if (!(isEditing && isSellerSignup)) {
                setContactOptions(account.contactOptions || ['email']);
            }
            
            // Populate social links
            if (account.socialLinks) {
                const newSocials = { ...socials };
                account.socialLinks.forEach(link => {
                    // Check if the platform exists in our current state structure (handles deprecated platforms like linkedin gracefully)
                    if (link.platform in newSocials) {
                        newSocials[link.platform] = link.url;
                    }
                });
                setSocials(newSocials);
            }
        }
    }, [account, isEditing, isSellerSignup]);

    const handleMapToggle = (isOpen: boolean) => {
        setShowMapPicker(isOpen);
        if (onToggleMap) onToggleMap(isOpen);
    };

    const validate = (fieldToValidate?: keyof AccountValidationData, forStep1: boolean = false): boolean => {
        const isSeller = isSellerSignup || (isEditing && account?.subscription.tier !== 'Personal');
        const formData: AccountValidationData = { 
            name, 
            username, 
            email, 
            password, 
            confirmPassword, 
            mobile, 
            messageNumber, 
            googleMapsUrl, 
            address: locationInput.location 
        };
        const validationErrors = validateAccountData(
            formData,
            allAccounts,
            isEditing,
            account?.id,
            fieldToValidate,
            isSeller
        );
        
        const fieldsToValidate = fieldToValidate ? [fieldToValidate] : Object.keys(validationErrors);
        
        if (!forStep1) {
            if (isSeller && contactOptions.length === 0) {
                validationErrors.contactOptions = 'As a seller, you must select at least one contact method.';
            }

            // Validate Social Links
            const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
            (Object.keys(socials) as SocialPlatform[]).forEach(platform => {
                const url = socials[platform].trim();
                if (url && !urlRegex.test(url)) {
                    validationErrors[`social-${platform}`] = 'Please enter a valid URL.';
                }
            });
        }
        
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
                // Max width larger for banners
                const maxWidth = type === 'banner' ? 1200 : 400;
                const compressedFile = await compressImage(file, { maxWidth, quality: 0.8 });
                const dataUrl = await fileToDataUrl(compressedFile);
                if (type === 'avatar') setAvatarUrl(dataUrl);
                else setBannerUrl(dataUrl);
            } catch (error) {
                console.error(`Failed to process ${type}:`, error);
                setErrors(prev => ({ ...prev, [type]: `Failed to process image. Please try another file.` }));
            }
        }
    };

    const handleSocialChange = (platform: SocialPlatform, value: string) => {
        setSocials(prev => ({ ...prev, [platform]: value }));
        if (errors[`social-${platform}`]) {
             setErrors(prev => {
                 const newErrors = { ...prev };
                 delete newErrors[`social-${platform}`];
                 return newErrors;
             });
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, fieldName: keyof AccountValidationData) => {
        // Remove non-digits and limit to 10 characters
        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
        setter(val);
        
        // Clear error if present (validation will run again on blur)
        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
        setIsUsernameAvailable(false);
        if (errors.username) {
             setErrors(prev => {
                 const newErrors = { ...prev };
                 delete newErrors.username;
                 return newErrors;
             });
        }
    };

    const handleUsernameBlur = () => {
        const isValid = validate('username');
        if (isValid && username.trim()) {
            setIsUsernameAvailable(true);
        } else {
            setIsUsernameAvailable(false);
        }
    };

    const handleNext = () => {
        let stepIsValid = true;
        const fieldsToValidate: (keyof AccountValidationData)[] = ['name', 'username', 'email', 'password', 'confirmPassword'];
        fieldsToValidate.forEach(field => {
            if (!validate(field, true)) {
                stepIsValid = false;
            }
        });

        if (stepIsValid) {
            setStep(2);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await locationInput.verify();
        
        if (!validate()) {
            return;
        }
        setErrors({});

        // Enforce specific order: Website, YouTube, Instagram, Facebook, X
        const platformOrder: SocialPlatform[] = ['website', 'youtube', 'instagram', 'facebook', 'twitter'];

        const socialLinks: SocialLink[] = platformOrder
            .filter(platform => socials[platform] && socials[platform].trim() !== '')
            .map(platform => ({ platform, url: socials[platform].trim() }));

        const formData: Partial<AccountFormData> = {
            name: name.trim(),
            username: username.trim(),
            email: email.trim(),
            description: description.trim(),
            avatarUrl: avatarUrl.trim(),
            bannerUrl: bannerUrl.trim(),
            mobile: mobile.trim(),
            messageNumber: messageNumber.trim(),
            taxInfo: taxInfo.trim(),
            address: locationInput.location.trim(),
            coordinates: locationInput.coordinates,
            googleMapsUrl: googleMapsUrl.trim(),
            appleMapsUrl: appleMapsUrl.trim(),
            businessName: businessName.trim(),
            paymentMethods,
            deliveryOptions,
            contactOptions,
            socialLinks,
        };

        if (!isEditing) {
            formData.password = password;
        }

        await onSubmit(formData, confirmPassword, referralCode);
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
                     {isCreating && <h3 className="text-base font-medium text-gray-800 border-b pb-2">Step 1: Required Information</h3>}

                    {/* Show all profile appearance fields in edit mode, but only in step 2 for create */}
                    {!isCreating && (
                        <div>
                             <h3 className="text-base font-medium text-gray-800">Profile Appearance</h3>
                            <div>
                                <span className="block text-sm font-medium text-gray-600 mb-1">Banner Image</span>
                                <div 
                                    className="mt-1 relative w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
                                    onClick={() => bannerInputRef.current?.click()}
                                >
                                    {bannerUrl ? (
                                        <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-600">
                                            <PhotoIcon className="w-8 h-8 mb-1" />
                                            <span className="text-xs">Click to upload banner</span>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={bannerInputRef} 
                                        onChange={(e) => handleFileChange(e, 'banner')} 
                                        className="hidden" 
                                        accept="image/png, image/jpeg, image/gif"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                                <Avatar 
                                    src={avatarUrl} 
                                    alt="Profile avatar preview" 
                                    size="xl"
                                    className="border-2 border-gray-200 bg-gray-100"
                                />
                                <div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={(e) => handleFileChange(e, 'avatar')} 
                                        className="hidden" 
                                        accept="image/png, image/jpeg, image/gif"
                                    />
                                    <Button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Upload Avatar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="pt-4 mt-4 border-t border-gray-200">
                        <FormField id="account-name" label="Name" error={errors.name}>
                            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => validate('name')} autoFocus />
                        </FormField>
                    </div>
                    <div>
                        <FormField id="account-username" label="Username" error={errors.username}>
                            <InputWithIcon
                                type="text"
                                value={username}
                                onChange={handleUsernameChange}
                                onBlur={handleUsernameBlur}
                                icon={<span className="text-gray-600 sm:text-sm">@</span>}
                            />
                        </FormField>
                        {isUsernameAvailable && !errors.username && (
                            <p className="mt-1 text-sm text-green-600 flex items-center gap-1 animate-fade-in">
                                <CheckIcon className="w-4 h-4" /> Username available
                            </p>
                        )}
                    </div>
                    <FormField id="account-email" label="Email" error={errors.email}>
                        <InputWithIcon
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => validate('email')}
                            icon={<EnvelopeIcon className="w-5 h-5 text-gray-400" />}
                        />
                    </FormField>

                    {!isEditing && (
                        <>
                            <div>
                                <FormField id="account-password" label="Password" error={errors.password}>
                                    <InputWithIcon
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onBlur={() => validate('password')}
                                        icon={<LockClosedIcon className="w-5 h-5 text-gray-400" />}
                                    />
                                </FormField>
                                <PasswordStrengthMeter password={password} />
                            </div>
                            <FormField id="account-confirm-password" label="Confirm Password" error={errors.confirmPassword}>
                                <InputWithIcon
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onBlur={() => validate('confirmPassword')}
                                    icon={<LockClosedIcon className="w-5 h-5 text-gray-400" />}
                                />
                            </FormField>
                            <div className="pt-4 border-t">
                                <FormField id="referral-code" label="Referral Code (Optional)">
                                    <Input
                                        type="text"
                                        value={referralCode}
                                        onChange={(e) => setReferralCode(e.target.value)}
                                        placeholder="e.g. PRIYA7582"
                                    />
                                </FormField>
                            </div>
                        </>
                    )}
                </div>
            )}
            
            {(!isCreating || step === 2) && (
                <div className={cn("space-y-4", isCreating && "animate-fade-in-up")}>
                    {isCreating && <h3 className="text-base font-medium text-gray-800 border-b pb-2">Step 2: Optional Information</h3>}

                    {isCreating && (
                         <div className="space-y-4">
                            <h3 className="text-base font-medium text-gray-800">Profile Appearance</h3>
                            <div>
                                <span className="block text-sm font-medium text-gray-600 mb-1">Banner Image</span>
                                <div 
                                    className="mt-1 relative w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
                                    onClick={() => bannerInputRef.current?.click()}
                                >
                                    {bannerUrl ? (
                                        <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-600">
                                            <PhotoIcon className="w-8 h-8 mb-1" />
                                            <span className="text-xs">Click to upload banner</span>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={bannerInputRef} 
                                        onChange={(e) => handleFileChange(e, 'banner')} 
                                        className="hidden" 
                                        accept="image/png, image/jpeg, image/gif"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Avatar 
                                    src={avatarUrl} 
                                    alt="Profile avatar preview" 
                                    size="xl"
                                    className="border-2 border-gray-200 bg-gray-100"
                                />
                                <div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={(e) => handleFileChange(e, 'avatar')} 
                                        className="hidden" 
                                        accept="image/png, image/jpeg, image/gif"
                                    />
                                    <Button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Upload Avatar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="pt-4 mt-4 border-t border-gray-200 space-y-4">
                        {!isCreating && <h3 className="text-base font-medium text-gray-800">Additional Info</h3>}
                        <FormField
                            id="account-description"
                            label="Bio"
                            description={`${description.length} / ${DESCRIPTION_MAX_LENGTH}`}
                        >
                            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={DESCRIPTION_MAX_LENGTH} placeholder="Tell others a little about yourself or what you sell." />
                        </FormField>
                        <FormField id="account-mobile" label="Mobile Number" error={errors.mobile}>
                            <InputWithIcon
                                type="tel"
                                value={mobile}
                                onChange={(e) => handlePhoneChange(e, setMobile, 'mobile')}
                                onBlur={() => validate('mobile')}
                                icon={<PhoneIcon className="w-5 h-5 text-gray-400" />}
                                placeholder="e.g. 9876543210"
                                maxLength={10}
                                inputMode="numeric"
                            />
                        </FormField>
                        <div>
                            <FormField id="account-message" label="Message Number" error={errors.messageNumber}>
                                <InputWithIcon
                                    type="tel"
                                    value={messageNumber}
                                    onChange={(e) => handlePhoneChange(e, setMessageNumber, 'messageNumber')}
                                    onBlur={() => validate('messageNumber')}
                                    icon={<ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-gray-400" />}
                                    placeholder="e.g. 9876543210"
                                    maxLength={10}
                                    inputMode="numeric"
                                />
                            </FormField>
                            <p className="mt-1 text-xs text-gray-600">Number for messaging apps like WhatsApp.</p>
                        </div>

                        <div>
                            <FormField id="account-address" label="Location (Optional)" error={errors.address || locationInput.error}>
                                <LocationInput
                                    value={locationInput.location}
                                    onValueChange={locationInput.setLocation}
                                    onSuggestionSelect={locationInput.selectSuggestion}
                                    onVerify={locationInput.verify}
                                    onOpenMapPicker={() => handleMapToggle(true)}
                                    suggestions={locationInput.suggestions}
                                    status={locationInput.status}
                                    placeholder="e.g., 123 Main St, Mumbai"
                                />
                            </FormField>
                            <p className="mt-1 text-xs text-gray-600">This location helps calculate distance for others. It may be displayed publicly.</p>
                        </div>

                        {/* Social Profiles */}
                        <div className="pt-2">
                            <span className="block text-sm font-medium text-gray-600 mb-2">Social Profiles</span>
                            <div className="space-y-3">
                                <FormField id="social-website" label="" error={errors['social-website']}>
                                    <InputWithIcon
                                        placeholder="Website URL"
                                        icon={<GlobeAltIcon className="w-5 h-5 text-gray-400"/>}
                                        value={socials.website}
                                        onChange={e => handleSocialChange('website', e.target.value)}
                                    />
                                </FormField>
                                <FormField id="social-youtube" label="" error={errors['social-youtube']}>
                                    <InputWithIcon
                                        placeholder="YouTube URL"
                                        icon={<YouTubeIcon className="w-5 h-5 text-gray-400"/>}
                                        value={socials.youtube}
                                        onChange={e => handleSocialChange('youtube', e.target.value)}
                                    />
                                </FormField>
                                <FormField id="social-instagram" label="" error={errors['social-instagram']}>
                                    <InputWithIcon
                                        placeholder="Instagram URL"
                                        icon={<InstagramIcon className="w-5 h-5 text-gray-400"/>}
                                        value={socials.instagram}
                                        onChange={e => handleSocialChange('instagram', e.target.value)}
                                    />
                                </FormField>
                                <FormField id="social-facebook" label="" error={errors['social-facebook']}>
                                    <InputWithIcon
                                        placeholder="Facebook URL"
                                        icon={<FacebookIcon className="w-5 h-5 text-gray-400"/>}
                                        value={socials.facebook}
                                        onChange={e => handleSocialChange('facebook', e.target.value)}
                                    />
                                </FormField>
                                <FormField id="social-twitter" label="" error={errors['social-twitter']}>
                                    <InputWithIcon
                                        placeholder="X URL"
                                        icon={<XIcon className="w-5 h-5 text-gray-400"/>}
                                        value={socials.twitter}
                                        onChange={e => handleSocialChange('twitter', e.target.value)}
                                    />
                                </FormField>
                            </div>
                        </div>

                        {(isSellerSignup || (isEditing && account?.subscription.tier !== 'Personal')) && (
                            <div className="animate-fade-in-up space-y-4 pt-4 mt-4 border-t">
                                <h3 className="text-base font-medium text-gray-800">Business Information</h3>
                                <FormField id="account-tax-info" label="Tax Info (Optional)" description="Provide your 15-digit GSTIN.">
                                    <Input
                                        type="text"
                                        value={taxInfo}
                                        onChange={(e) => setTaxInfo(e.target.value)}
                                        placeholder="e.g., GSTIN"
                                        maxLength={15}
                                    />
                                </FormField>
                                <FormField id="account-business-name" label="Business Name (Optional)" description="If different from your personal name. Auto-fills from valid GSTIN.">
                                    <div className="relative mt-1">
                                        <Input
                                            type="text"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            placeholder="e.g., The Vintage Corner"
                                            disabled={isVerifyingGst}
                                        />
                                        {isVerifyingGst && (
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <SpinnerIcon className="w-5 h-5 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                </FormField>
                                <div>
                                    <FormField id="account-google-maps" label="Google Maps Location" error={errors.googleMapsUrl}>
                                        <Input
                                            type="url"
                                            value={googleMapsUrl}
                                            onChange={(e) => setGoogleMapsUrl(e.target.value)}
                                            onBlur={() => validate('googleMapsUrl')}
                                            placeholder="https://maps.app.goo.gl/..."
                                        />
                                    </FormField>
                                    <p className="mt-1 text-xs text-gray-600">Share a link to your business on Google Maps. This is required for sellers.</p>
                                </div>
                                <FormField id="account-apple-maps" label="Apple Maps Location (Optional)">
                                    <Input
                                        type="url"
                                        value={appleMapsUrl}
                                        onChange={(e) => setAppleMapsUrl(e.target.value)}
                                        placeholder="https://maps.apple.com/?q=..."
                                    />
                                </FormField>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SellerOptionsForm
                                        paymentMethods={paymentMethods}
                                        onPaymentMethodsChange={setPaymentMethods}
                                        deliveryOptions={deliveryOptions}
                                        onDeliveryOptionsChange={setDeliveryOptions}
                                        contactOptions={contactOptions}
                                        onContactOptionsChange={setContactOptions}
                                        isSeller={isSeller}
                                        error={errors.contactOptions}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {isCreating && (
                <div className="mt-6 pt-4 border-t flex justify-end gap-2">
                    {step === 1 && (
                        <Button type="button" onClick={handleNext} variant="pill-red" className="w-full">
                            Next (Optional Fields)
                        </Button>
                    )}
                    {step === 2 && (
                        <>
                            <Button type="button" variant="overlay-dark" onClick={() => setStep(1)} className="mr-auto">
                                Back
                            </Button>
                            <Button type="submit" isLoading={isSubmitting} variant="pill-red" className="w-36">
                                Create Account
                            </Button>
                        </>
                    )}
                </div>
            )}
        </form>
    );
};
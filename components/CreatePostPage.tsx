import React, { useState, useRef, useEffect, useCallback, useMemo, KeyboardEvent, useReducer } from 'react';
import { Post, PostType, Media, PostCategory, Account } from '../types';
import LocationPickerMap from './LocationPickerMap';
import LocationInput from './LocationInput';
import { SpinnerIcon, XMarkIcon } from './Icons';
import { suggestTagsForPost, suggestCategoriesForPost } from '../utils/gemini';
import { formatCurrency, toDateTimeLocal, fromDateTimeLocal } from '../utils/formatters';
import { SellerOptionsForm, SellerOptionsState } from './SellerOptionsForm';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { useMediaUploader } from '../hooks/useMediaUploader';
import { useLocationInput } from '../hooks/useLocationInput';
import { validatePostData } from '../utils/validation';
import { MediaUploader } from './MediaUploader';
import { usePosts } from '../contexts/PostsContext';
import { FormField } from './FormField';
import { STORAGE_KEYS } from '../lib/constants';

interface CreatePostPageProps {
  onBack: () => void;
  onSubmitPost: (post: Omit<Post, 'id' | 'isLiked' | 'authorId'>) => Post;
  onUpdatePost?: (post: Post) => Promise<Post>;
  onNavigateToPost: () => void;
  editingPost?: Post | null;
  currentAccount: Account;
  categories: PostCategory[];
  onUpdateCurrentAccountDetails?: (updatedAccount: Partial<Account>) => void;
}

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const MAX_PRICE = 10000000; // 1 Crore
const maxFileSizeMB = 10;

const initialState = {
    title: '',
    description: '',
    price: '',
    priceUnit: 'Fixed',
    isOnSale: false,
    salePrice: '',
    type: PostType.PRODUCT,
    category: '',
    tags: [] as string[],
    tagInput: '',
    hasExpiry: false,
    expiryDate: '',
    eventStartDate: '',
    eventEndDate: '',
    errors: {} as Record<string, string>,
};

type FormState = typeof initialState;

type Action =
    | { type: 'SET_FIELD'; field: keyof Omit<FormState, 'tags'>; payload: any }
    | { type: 'ADD_TAG' }
    | { type: 'REMOVE_TAG'; payload: string }
    | { type: 'SET_TAGS'; payload: string[] }
    | { type: 'SET_ERRORS'; payload: Record<string, string> }
    | { type: 'RESET_FORM'; payload: Partial<FormState> };

function formReducer(state: FormState, action: Action): FormState {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.payload, errors: { ...state.errors, [action.field]: undefined } };
        case 'ADD_TAG': {
            const newTag = state.tagInput.trim();
            if (newTag && !state.tags.includes(newTag)) {
                return { ...state, tags: [...state.tags, newTag], tagInput: '' };
            }
            return { ...state, tagInput: '' };
        }
        case 'REMOVE_TAG':
            return { ...state, tags: state.tags.filter(tag => tag !== action.payload) };
        case 'SET_TAGS':
            return { ...state, tags: action.payload };
        case 'SET_ERRORS':
            return { ...state, errors: action.payload };
        case 'RESET_FORM':
            return { ...initialState, ...action.payload };
        default:
            return state;
    }
}


export const CreatePostPage: React.FC<CreatePostPageProps> = ({ onBack, onSubmitPost, onUpdatePost, onNavigateToPost, editingPost, currentAccount, categories, onUpdateCurrentAccountDetails }) => {
  const isEditing = !!editingPost;
  const { priceUnits } = usePosts();
  
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { title, description, price, priceUnit, isOnSale, salePrice, type, category, tags, tagInput, hasExpiry, expiryDate, eventStartDate, eventEndDate, errors } = state;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [isSuggestingCategories, setIsSuggestingCategories] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  const locationInput = useLocationInput(
    !isEditing && currentAccount.address ? currentAccount.address : '',
    !isEditing && currentAccount.coordinates ? currentAccount.coordinates : null
  );
  const eventLocationInput = useLocationInput();

  const needsSellerDetails = currentAccount.subscription.tier !== 'Personal' && (!currentAccount.deliveryOptions?.length || !currentAccount.paymentMethods?.length);
  const [sellerOptions, setSellerOptions] = useState<SellerOptionsState>({
    deliveryOptions: currentAccount.deliveryOptions || [],
    paymentMethods: currentAccount.paymentMethods || [],
    contactOptions: currentAccount.contactOptions || [],
  });

  const maxFiles = useMemo(() => {
    switch (currentAccount.subscription.tier) {
        case 'Business': return 25;
        case 'Verified': return 15;
        default: return 10;
    }
  }, [currentAccount.subscription.tier]);

  const { mediaUploads, setMediaUploads, handleFiles, removeMedia, reorderMedia } = useMediaUploader({ maxFiles, maxFileSizeMB, subscriptionTier: currentAccount.subscription.tier });

  useEffect(() => {
      if (!isEditing) {
          try {
              const savedDraft = localStorage.getItem(STORAGE_KEYS.POST_DRAFT);
              if (savedDraft) {
                  const draft = JSON.parse(savedDraft);
                  dispatch({ type: 'RESET_FORM', payload: {
                      title: draft.title || '',
                      description: draft.description || '',
                      type: draft.type || PostType.PRODUCT,
                      category: draft.category || categories[0] || '',
                      tags: draft.tags || [],
                      price: draft.price || '',
                      priceUnit: draft.priceUnit || 'Fixed',
                  }});
                  if(draft.media) setMediaUploads(draft.media.map((m: Media, i: number) => ({ id: `loaded-${i}`, previewUrl: m.url, finalUrl: m.url, progress: 100, status: 'complete', type: m.type })));
              }
          } catch (e) { console.error("Failed to load draft", e); }
      }
  }, [isEditing, categories, setMediaUploads]);

  useEffect(() => {
    if (!isEditing) {
        const draft = { title, description, type, category, tags, price, priceUnit, media: mediaUploads.filter(m => m.status === 'complete').map(m => ({ type: m.type, url: m.finalUrl! })) };
        localStorage.setItem(STORAGE_KEYS.POST_DRAFT, JSON.stringify(draft));
    }
  }, [title, description, type, category, tags, price, priceUnit, mediaUploads, isEditing]);

  useEffect(() => {
      if (editingPost) {
          dispatch({ type: 'RESET_FORM', payload: {
              title: editingPost.title,
              description: editingPost.description,
              price: editingPost.price?.toString() || '',
              priceUnit: editingPost.priceUnit || 'Fixed',
              isOnSale: !!editingPost.salePrice,
              salePrice: editingPost.salePrice?.toString() || '',
              type: editingPost.type,
              category: editingPost.category,
              tags: editingPost.tags,
              hasExpiry: !!editingPost.expiryDate,
              expiryDate: toDateTimeLocal(editingPost.expiryDate),
              eventStartDate: toDateTimeLocal(editingPost.eventStartDate),
              eventEndDate: toDateTimeLocal(editingPost.eventEndDate),
          }});
          
          if (editingPost.coordinates) {
              locationInput.selectFromMap({ ...editingPost.coordinates, name: editingPost.location });
          }
          if (editingPost.eventCoordinates) {
              eventLocationInput.selectFromMap({ ...editingPost.eventCoordinates, name: editingPost.eventLocation || '' });
          }

          setMediaUploads(
              editingPost.media.map((m, i) => ({
                  id: `editing-${m.url}-${i}`,
                  previewUrl: m.url,
                  finalUrl: m.url,
                  progress: 100,
                  status: 'complete',
                  type: m.type,
              }))
          );
      }
  }, [editingPost, setMediaUploads]);

  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      dispatch({ type: 'ADD_TAG' });
    }
  };
  
  const handleSuggestTags = async () => {
    if (!title && !description) {
        console.error("Please provide a title or description first.");
        return;
    }
    setIsSuggestingTags(true);
    try {
        const suggested = await suggestTagsForPost(title, description);
        dispatch({ type: 'SET_TAGS', payload: [...new Set([...tags, ...suggested])].slice(0, 10) });
    } catch (e) {
        console.error(e);
    } finally {
        setIsSuggestingTags(false);
    }
  };

  const handleSuggestCategories = async () => {
    if (!title && !description) {
        console.error("Please provide a title or description first.");
        return;
    }
    setIsSuggestingCategories(true);
    try {
        const suggested = await suggestCategoriesForPost(title, description, categories);
        if(suggested.length > 0) dispatch({ type: 'SET_FIELD', field: 'category', payload: suggested[0] });
    } catch (e) {
        console.error(e);
    } finally {
        setIsSuggestingCategories(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (type === PostType.EVENT) {
        await eventLocationInput.verify();
    } else {
        await locationInput.verify();
    }

    const effectiveLocation = type === PostType.EVENT ? eventLocationInput.location : locationInput.location;
    const effectiveHasCoordinates = type === PostType.EVENT ? !!eventLocationInput.coordinates : !!locationInput.coordinates;

    const validationErrors = validatePostData({
        title, description, price, isOnSale, salePrice, type,
        location: effectiveLocation,
        hasCoordinates: effectiveHasCoordinates,
        eventLocation: eventLocationInput.location,
        eventStartDate, hasExpiry, expiryDate,
    }, { TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, MAX_PRICE });
    
    if (needsSellerDetails && onUpdateCurrentAccountDetails && (sellerOptions.deliveryOptions.length === 0 || sellerOptions.paymentMethods.length === 0)) {
        validationErrors.sellerOptions = "Please select at least one delivery and one payment option to continue.";
    }

    dispatch({ type: 'SET_ERRORS', payload: validationErrors });

    if (Object.keys(validationErrors).length > 0) {
        setIsSubmitting(false);
        const firstErrorKey = Object.keys(validationErrors)[0];
        let elementId = `post-${firstErrorKey}`;
        
        if (type === PostType.EVENT && (firstErrorKey === 'location' || firstErrorKey === 'eventLocation')) {
             elementId = 'event-location';
        } else if (firstErrorKey === 'eventStartDate') {
             elementId = 'event-start-date';
        }

        const errorElement = document.getElementById(elementId);
        if(errorElement) errorElement.focus();
        return;
    }

    if (needsSellerDetails && onUpdateCurrentAccountDetails) {
        onUpdateCurrentAccountDetails({ deliveryOptions: sellerOptions.deliveryOptions, paymentMethods: sellerOptions.paymentMethods });
    }
    
    const postData: Omit<Post, 'id' | 'isLiked' | 'authorId'> = {
        title: title.trim(),
        description: description.trim(),
        location: type === PostType.EVENT ? eventLocationInput.location : locationInput.location,
        coordinates: type === PostType.EVENT ? eventLocationInput.coordinates : locationInput.coordinates,
        type,
        category,
        price: price ? parseFloat(price) : undefined,
        priceUnit: type === PostType.SERVICE ? priceUnit : undefined,
        salePrice: isOnSale ? parseFloat(salePrice) : undefined,
        media: mediaUploads.filter(m => m.status === 'complete').map(m => ({ type: m.type, url: m.finalUrl! })),
        tags: tags.map(t => t.trim()).filter(Boolean),
        lastUpdated: Date.now(),
        expiryDate: hasExpiry && type !== 'EVENT' ? fromDateTimeLocal(expiryDate) : null,
        eventLocation: type === 'EVENT' ? eventLocationInput.location : undefined,
        eventCoordinates: type === 'EVENT' ? eventLocationInput.coordinates : undefined,
        eventStartDate: type === 'EVENT' ? fromDateTimeLocal(eventStartDate) : undefined,
        eventEndDate: type === 'EVENT' ? fromDateTimeLocal(eventEndDate) : undefined,
    };
    
    if (isEditing && onUpdatePost && editingPost) {
        await onUpdatePost({ ...editingPost, ...postData, lastUpdated: Date.now() });
        onNavigateToPost();
    } else if (onSubmitPost) {
        onSubmitPost(postData);
        localStorage.removeItem(STORAGE_KEYS.POST_DRAFT);
        onNavigateToPost();
    }
  };

  const setField = useCallback((field: keyof Omit<FormState, 'tags'>, payload: any) => {
      dispatch({ type: 'SET_FIELD', field, payload });
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto animate-fade-in-down pb-28 p-4 sm:p-6 lg:p-8">
          {showMapPicker ? (
          <LocationPickerMap
              initialCoordinates={type === PostType.EVENT ? eventLocationInput.coordinates : locationInput.coordinates}
              onLocationSelect={(loc) => {
                if (type === PostType.EVENT) {
                  eventLocationInput.selectFromMap(loc);
                } else {
                  locationInput.selectFromMap(loc);
                }
                setShowMapPicker(false);
              }}
              onCancel={() => setShowMapPicker(false)}
          />
          ) : (
          <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">{isEditing ? 'Edit Post' : 'Create Post'}</h1>
              <form id="create-post-form" onSubmit={handleSubmit} className="space-y-6">
                  {needsSellerDetails && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in-down">
                          <h3 className="font-semibold text-amber-900">Complete Your Seller Profile</h3>
                          <p className="text-sm text-amber-800 mb-4">Before you can post, please set your payment and delivery options. This helps buyers know how they can purchase from you.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <SellerOptionsForm
                                  paymentMethods={sellerOptions.paymentMethods}
                                  deliveryOptions={sellerOptions.deliveryOptions}
                                  contactOptions={sellerOptions.contactOptions}
                                  onPaymentChange={(methods) => setSellerOptions(prev => ({...prev, paymentMethods: methods}))}
                                  onDeliveryChange={(options) => setSellerOptions(prev => ({...prev, deliveryOptions: options}))}
                                  onContactChange={(options) => setSellerOptions(prev => ({...prev, contactOptions: options}))}
                                  isSeller={true}
                                  error={errors.sellerOptions}
                              />
                          </div>
                      </div>
                  )}
                  <FormField id="post-title" label="Title" error={errors.title} description={`${title.length} / ${TITLE_MAX_LENGTH}`}>
                      <Input value={title} onChange={e => setField('title', e.target.value)} required maxLength={TITLE_MAX_LENGTH} />
                  </FormField>

                  <FormField id="post-description" label="Description" error={errors.description} description={`${description.length} / ${DESCRIPTION_MAX_LENGTH}`}>
                      <Textarea value={description} onChange={e => setField('description', e.target.value)} required maxLength={DESCRIPTION_MAX_LENGTH} rows={5} />
                  </FormField>
                  
                  <div>
                      <Label>Media</Label>
                      <p className="text-xs text-gray-500 mb-2">Add up to {maxFiles} images or videos. The first item will be the cover.</p>
                      <MediaUploader
                          mediaUploads={mediaUploads}
                          handleFiles={handleFiles}
                          removeMedia={removeMedia}
                          reorderMedia={reorderMedia}
                          maxFiles={maxFiles}
                          maxFileSizeMB={maxFileSizeMB}
                      />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField id="post-type" label="Type">
                          <Select value={type} onChange={e => setField('type', e.target.value as PostType)}>
                              {Object.values(PostType).map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                          </Select>
                      </FormField>
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <Label htmlFor="post-category">Category</Label>
                              <Button type="button" size="xs" variant="outline" onClick={handleSuggestCategories} isLoading={isSuggestingCategories}>
                                  AI Suggest
                              </Button>
                          </div>
                          <Select id="post-category" value={category} onChange={e => setField('category', e.target.value)}>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </Select>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                      <div>
                          {type === PostType.SERVICE ? (
                              <div className="grid grid-cols-2 gap-2">
                                  <FormField id="post-price" label="Price (Optional)" error={errors.price}>
                                      <Input 
                                          type="number" 
                                          value={price} 
                                          onChange={e => setField('price', e.target.value)}
                                          placeholder="e.g. 500"
                                          max={MAX_PRICE}
                                      />
                                  </FormField>
                                  <FormField id="post-price-unit" label="Unit">
                                      <Select value={priceUnit} onChange={e => setField('priceUnit', e.target.value)}>
                                          {priceUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                      </Select>
                                  </FormField>
                              </div>
                          ) : (
                              <FormField id="post-price" label="Price" error={errors.price}>
                                  <Input type="number" value={price} onChange={e => setField('price', e.target.value)} required placeholder="e.g. 1200" max={MAX_PRICE} />
                              </FormField>
                          )}
                      </div>
                      {type === PostType.PRODUCT && (
                          <div>
                              <div className="flex items-center mb-1">
                                  <input
                                      id="is-on-sale"
                                      type="checkbox"
                                      checked={isOnSale}
                                      onChange={e => setField('isOnSale', e.target.checked)}
                                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor="is-on-sale" className="ml-2 block text-sm font-medium text-gray-700">
                                      Put item on sale
                                  </label>
                              </div>
                              {isOnSale && (
                                  <FormField id="post-sale-price" label="Sale Price" error={errors.salePrice} className="animate-fade-in-down">
                                      <Input type="number" value={salePrice} onChange={e => setField('salePrice', e.target.value)} required max={MAX_PRICE} />
                                  </FormField>
                              )}
                          </div>
                      )}
                  </div>

                  {type === PostType.EVENT ? (
                      <div className="space-y-4 pt-4 border-t">
                          <FormField id="event-location" label="Event Location" error={errors.eventLocation || eventLocationInput.error}>
                              <LocationInput 
                                  value={eventLocationInput.location}
                                  onValueChange={eventLocationInput.setLocation}
                                  onSuggestionSelect={eventLocationInput.selectSuggestion}
                                  onVerify={eventLocationInput.verify}
                                  onOpenMapPicker={() => setShowMapPicker(true)}
                                  suggestions={eventLocationInput.suggestions}
                                  status={eventLocationInput.status}
                                  placeholder="e.g., Address or Venue Name"
                              />
                          </FormField>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField id="event-start-date" label="Start Date & Time" error={errors.eventStartDate}>
                                  <Input type="datetime-local" value={eventStartDate} onChange={e => setField('eventStartDate', e.target.value)} required />
                              </FormField>
                              <FormField id="event-end-date" label="End Date & Time (Optional)">
                                  <Input type="datetime-local" value={eventEndDate} onChange={e => setField('eventEndDate', e.target.value)} min={eventStartDate} />
                              </FormField>
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-4 pt-4 border-t">
                          <FormField id="post-location" label="Item Location" error={errors.location || locationInput.error}>
                              <LocationInput 
                                  value={locationInput.location}
                                  onValueChange={locationInput.setLocation}
                                  onSuggestionSelect={locationInput.selectSuggestion}
                                  onVerify={locationInput.verify}
                                  onOpenMapPicker={() => setShowMapPicker(true)}
                                  suggestions={locationInput.suggestions}
                                  status={locationInput.status}
                                  placeholder="e.g., City, Neighborhood"
                              />
                          </FormField>
                          <div className="flex items-center">
                              <input
                                  id="has-expiry"
                                  type="checkbox"
                                  checked={hasExpiry}
                                  onChange={e => setField('hasExpiry', e.target.checked)}
                                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                              <label htmlFor="has-expiry" className="ml-2 block text-sm font-medium text-gray-700">
                                  Set an expiry date
                              </label>
                          </div>
                          {hasExpiry && (
                              <FormField id="post-expiry-date" label="Expiry Date" error={errors.expiryDate} className="animate-fade-in-down">
                                  <Input type="datetime-local" value={expiryDate} onChange={e => setField('expiryDate', e.target.value)} required min={toDateTimeLocal(Date.now())} />
                              </FormField>
                          )}
                      </div>
                  )}

                  <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 mb-1">
                          <Label htmlFor="post-tags">Tags</Label>
                          <Button type="button" size="xs" variant="outline" onClick={handleSuggestTags} isLoading={isSuggestingTags}>
                              AI Suggest
                          </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-md">
                          {tags.map(tag => (
                              <div key={tag} className="flex items-center gap-1 bg-gray-200 text-gray-800 text-sm font-medium px-2 py-1 rounded">
                                  <span>{tag}</span>
                                  <button type="button" onClick={() => dispatch({ type: 'REMOVE_TAG', payload: tag })} className="text-gray-500">
                                      <XMarkIcon className="w-4 h-4" />
                                  </button>
                              </div>
                          ))}
                          <input
                              id="post-tags"
                              type="text"
                              value={tagInput}
                              onChange={e => setField('tagInput', e.target.value)}
                              onKeyDown={handleTagInputKeyDown}
                              onBlur={() => dispatch({ type: 'ADD_TAG' })}
                              placeholder={tags.length === 0 ? "Add tags (e.g., vintage, handmade)" : "Add more..."}
                              className="flex-grow bg-transparent focus:outline-none"
                          />
                      </div>
                  </div>
              </form>
          </div>
        )}
      </div>
      {!showMapPicker && (
          <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-in-up" style={{ animationDelay: '200ms' }}>
              <div className="bg-white border-t border-gray-100">
                  <div className="max-w-2xl mx-auto px-4 sm:px-6">
                      <div className="py-3 flex items-center gap-3">
                          <Button variant="overlay-dark" onClick={onBack} className="mr-auto">Cancel</Button>
                          <Button type="submit" form="create-post-form" isLoading={isSubmitting} size="lg" variant="pill-red">
                              {isEditing ? 'Save Changes' : 'Publish Post'}
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
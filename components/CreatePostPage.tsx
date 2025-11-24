
import React, { useState, useRef, useEffect, useCallback, useMemo, KeyboardEvent } from 'react';
import { Post, PostType, Media, PostCategory, Account, ContactOption } from '../types';
import LocationPickerMap from './LocationPickerMap';
import LocationInput from './LocationInput';
import { SpinnerIcon, XMarkIcon, ChevronLeftIcon } from './Icons';
import { suggestTagsForPost, suggestCategoriesForPost } from '../utils/gemini';
import { formatCurrency, toDateTimeLocal, fromDateTimeLocal } from '../utils/formatters';
import { SellerOptionsForm } from './SellerOptionsForm';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { useMediaUploader, MediaUpload } from '../hooks/useMediaUploader';
import { useUI } from '../contexts/UIContext';
import { useLocationInput } from '../hooks/useLocationInput';
import { validatePostData } from '../utils/validation';
import { MediaUploader } from './MediaUploader';
import { usePosts } from '../contexts/PostsContext';

interface CreatePostPageProps {
  onBack: () => void;
  onSubmitPost: (post: Omit<Post, 'id' | 'isLiked' | 'authorId'>) => Post;
  onUpdatePost?: (post: Post) => Promise<Post>;
  onNavigateToPost: (postId: string) => void;
  editingPost?: Post | null;
  currentAccount: Account;
  categories: PostCategory[];
  onUpdateCurrentAccountDetails?: (updatedAccount: Partial<Account>) => void;
}

const DRAFT_KEY = 'locale_post_draft_v2';
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const MAX_PRICE = 10000000; // 1 Crore
const maxFileSizeMB = 10;

export const CreatePostPage: React.FC<CreatePostPageProps> = ({ onBack, onSubmitPost, onUpdatePost, onNavigateToPost, editingPost, currentAccount, categories, onUpdateCurrentAccountDetails }) => {
  const isEditing = !!editingPost;
  const { addToast } = useUI();
  const { priceUnits } = usePosts();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('Fixed');
  const [isOnSale, setIsOnSale] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [type, setType] = useState<PostType>(PostType.PRODUCT);
  const [category, setCategory] = useState<PostCategory>(categories[0] || '');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  // Event specific fields
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [isSuggestingCategories, setIsSuggestingCategories] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  const locationInput = useLocationInput(
    !isEditing && currentAccount.address ? currentAccount.address : '',
    !isEditing && currentAccount.coordinates ? currentAccount.coordinates : null
  );
  const eventLocationInput = useLocationInput();

  // Seller details state
  const needsSellerDetails = currentAccount.subscription.tier !== 'Personal' && (!currentAccount.deliveryOptions?.length || !currentAccount.paymentMethods?.length);
  const [deliveryOptions, setDeliveryOptions] = useState<string[]>(currentAccount.deliveryOptions || []);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(currentAccount.paymentMethods || []);

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
              const savedDraft = localStorage.getItem(DRAFT_KEY);
              if (savedDraft) {
                  const draft = JSON.parse(savedDraft);
                  setTitle(draft.title || '');
                  setDescription(draft.description || '');
                  setType(draft.type || PostType.PRODUCT);
                  setCategory(draft.category || categories[0] || '');
                  setTags(draft.tags || []);
                  setPrice(draft.price || '');
                  setPriceUnit(draft.priceUnit || 'Fixed');
                  if(draft.media) setMediaUploads(draft.media.map((m: Media, i: number) => ({ id: `loaded-${i}`, previewUrl: m.url, finalUrl: m.url, progress: 100, status: 'complete', type: m.type })));
              }
          } catch (e) { console.error("Failed to load draft", e); }
      }
  }, [isEditing, categories, setMediaUploads]);

  useEffect(() => {
    if (!isEditing) {
        const draft = { title, description, type, category, tags, price, priceUnit, media: mediaUploads.filter(m => m.status === 'complete').map(m => ({ type: m.type, url: m.finalUrl! })) };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [title, description, type, category, tags, price, priceUnit, mediaUploads, isEditing]);

  useEffect(() => {
      if (editingPost) {
          setTitle(editingPost.title);
          setDescription(editingPost.description);
          setPrice(editingPost.price?.toString() || '');
          setPriceUnit(editingPost.priceUnit || 'Fixed');
          setIsOnSale(!!editingPost.salePrice);
          setSalePrice(editingPost.salePrice?.toString() || '');
          setType(editingPost.type);
          setCategory(editingPost.category);
          setTags(editingPost.tags);
          setHasExpiry(!!editingPost.expiryDate);
          setExpiryDate(toDateTimeLocal(editingPost.expiryDate));
          setEventStartDate(toDateTimeLocal(editingPost.eventStartDate));
          setEventEndDate(toDateTimeLocal(editingPost.eventEndDate));
          
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
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleSuggestTags = async () => {
    if (!title && !description) {
        addToast("Please provide a title or description first.", "error");
        return;
    }
    setIsSuggestingTags(true);
    try {
        const suggested = await suggestTagsForPost(title, description);
        setTags(prev => [...new Set([...prev, ...suggested])].slice(0, 10));
    } catch (e) {
        addToast(e instanceof Error ? e.message : 'Could not suggest tags.', 'error');
    } finally {
        setIsSuggestingTags(false);
    }
  };

  const handleSuggestCategories = async () => {
    if (!title && !description) {
        addToast("Please provide a title or description first.", "error");
        return;
    }
    setIsSuggestingCategories(true);
    try {
        const suggested = await suggestCategoriesForPost(title, description, categories);
        if(suggested.length > 0) setCategory(suggested[0]);
    } catch (e) {
        addToast(e instanceof Error ? e.message : 'Could not suggest a category.', 'error');
    } finally {
        setIsSuggestingCategories(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // For events, we use eventLocation as the main location
    if (type === PostType.EVENT) {
        await eventLocationInput.verify();
    } else {
        await locationInput.verify();
    }

    // Map fields for validation. For events, we treat the event location as the 'required' main location.
    const effectiveLocation = type === PostType.EVENT ? eventLocationInput.location : locationInput.location;
    const effectiveHasCoordinates = type === PostType.EVENT ? !!eventLocationInput.coordinates : !!locationInput.coordinates;

    const validationErrors = validatePostData({
        title, description, price, isOnSale, salePrice, type,
        location: effectiveLocation,
        hasCoordinates: effectiveHasCoordinates,
        eventLocation: eventLocationInput.location,
        eventStartDate, hasExpiry, expiryDate,
    }, { TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, MAX_PRICE });
    
    if (needsSellerDetails && onUpdateCurrentAccountDetails && (deliveryOptions.length === 0 || paymentMethods.length === 0)) {
        validationErrors.sellerOptions = "Please select at least one delivery and one payment option to continue.";
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
        setIsSubmitting(false);
        const firstErrorKey = Object.keys(validationErrors)[0];
        let elementId = `post-${firstErrorKey}`;
        
        // Redirect focus for location error in Event mode
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
        onUpdateCurrentAccountDetails({ deliveryOptions, paymentMethods });
    }
    
    const postData: Omit<Post, 'id' | 'isLiked' | 'authorId'> = {
        title: title.trim(),
        description: description.trim(),
        // Use event location as main location for events to ensure they appear on map/filter correctly
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
        const updatedPost = await onUpdatePost({ ...editingPost, ...postData, lastUpdated: Date.now() });
        onNavigateToPost(updatedPost.id);
    } else if (onSubmitPost) {
        const newPost = onSubmitPost(postData);
        localStorage.removeItem(DRAFT_KEY);
        onNavigateToPost(newPost.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto animate-fade-in-up pb-28 p-4 sm:p-6 lg:p-8">
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
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg animate-fade-in-up">
                          <h3 className="font-semibold text-amber-900">Complete Your Seller Profile</h3>
                          <p className="text-sm text-amber-800 mb-4">Before you can post, please set your payment and delivery options. This helps buyers know how they can purchase from you.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <SellerOptionsForm
                                  isSeller={true}
                                  paymentMethods={paymentMethods}
                                  onPaymentMethodsChange={setPaymentMethods}
                                  deliveryOptions={deliveryOptions}
                                  onDeliveryOptionsChange={setDeliveryOptions}
                                  showContactOptions={false}
                              />
                          </div>
                          {errors.sellerOptions && <p className="mt-2 text-sm text-red-600">{errors.sellerOptions}</p>}
                      </div>
                  )}
                  <div>
                      <div className="flex justify-between items-baseline">
                          <Label htmlFor="post-title">Title</Label>
                          <span className={`text-xs ${title.length > TITLE_MAX_LENGTH ? 'text-red-600' : 'text-gray-500'}`}>{title.length} / {TITLE_MAX_LENGTH}</span>
                      </div>
                      <Input id="post-title" value={title} onChange={e => setTitle(e.target.value)} required maxLength={TITLE_MAX_LENGTH} />
                      {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>

                  <div>
                      <div className="flex justify-between items-baseline">
                          <Label htmlFor="post-description">Description</Label>
                          <span className={`text-xs ${description.length > DESCRIPTION_MAX_LENGTH ? 'text-red-600' : 'text-gray-500'}`}>{description.length} / {DESCRIPTION_MAX_LENGTH}</span>
                      </div>
                      <Textarea id="post-description" value={description} onChange={e => setDescription(e.target.value)} required maxLength={DESCRIPTION_MAX_LENGTH} rows={5} />
                      {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  </div>
                  
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
                      <div>
                          <Label htmlFor="post-type">Type</Label>
                          <Select id="post-type" value={type} onChange={e => setType(e.target.value as PostType)}>
                              {Object.values(PostType).map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                          </Select>
                      </div>
                      <div>
                          <div className="flex items-center gap-2">
                              <Label htmlFor="post-category">Category</Label>
                              <Button type="button" size="xs" variant="glass" onClick={handleSuggestCategories} isLoading={isSuggestingCategories}>
                                  AI Suggest
                              </Button>
                          </div>
                          <Select id="post-category" value={category} onChange={e => setCategory(e.target.value)}>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </Select>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                      <div>
                          {type === PostType.SERVICE ? (
                              <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                      <Label htmlFor="post-price">Price (Optional)</Label>
                                      <Input 
                                          id="post-price" 
                                          type="number" 
                                          value={price} 
                                          onChange={e => setPrice(e.target.value)} 
                                          placeholder="0.00" 
                                          min="0" 
                                          step="0.01" 
                                          className="mt-1 w-full" 
                                      />
                                  </div>
                                  <div className="flex flex-col">
                                      <Label htmlFor="price-unit">Unit</Label>
                                      <Select 
                                          id="price-unit" 
                                          value={priceUnit} 
                                          onChange={(e) => setPriceUnit(e.target.value)} 
                                          className="mt-1 w-full"
                                      >
                                          {priceUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                      </Select>
                                  </div>
                              </div>
                          ) : (
                              <>
                                  <Label htmlFor="post-price">Price</Label>
                                  <Input 
                                      id="post-price" 
                                      type="number" 
                                      value={price} 
                                      onChange={e => setPrice(e.target.value)} 
                                      required 
                                      placeholder="0.00" 
                                      min="0" 
                                      step="0.01" 
                                      className="mt-1" 
                                  />
                              </>
                          )}
                          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                      </div>
                      {type !== PostType.SERVICE && (
                        <div>
                            <div className="relative flex items-start pt-2">
                                <div className="flex h-6 items-center">
                                <input id="on-sale" type="checkbox" checked={isOnSale} onChange={(e) => setIsOnSale(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"/>
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                <Label htmlFor="on-sale">Put this item on sale</Label>
                                </div>
                            </div>
                            {isOnSale && (
                                <div className="mt-1 animate-fade-in-up">
                                    <Label htmlFor="post-sale-price">Sale Price</Label>
                                    <Input id="post-sale-price" type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} required placeholder="0.00" min="0" step="0.01" />
                                    {errors.salePrice && <p className="mt-1 text-sm text-red-600">{errors.salePrice}</p>}
                                </div>
                            )}
                        </div>
                      )}
                  </div>

                  {type !== PostType.EVENT && (
                      <div>
                          <LocationInput
                              id="post-location"
                              label="Location"
                              value={locationInput.location}
                              onValueChange={locationInput.setLocation}
                              onSuggestionSelect={locationInput.selectSuggestion}
                              onVerify={locationInput.verify}
                              onOpenMapPicker={() => setShowMapPicker(true)}
                              suggestions={locationInput.suggestions}
                              status={locationInput.status}
                              error={locationInput.error}
                              formError={errors.location}
                          />
                      </div>
                  )}
                  
                  {type === PostType.EVENT && (
                      <div className="p-4 bg-gray-50 border rounded-lg space-y-4 animate-fade-in-up">
                          <h3 className="font-semibold text-gray-800">Event Details</h3>
                          <LocationInput
                              id="event-location"
                              label="Venue / Event Location"
                              value={eventLocationInput.location}
                              onValueChange={eventLocationInput.setLocation}
                              onSuggestionSelect={eventLocationInput.selectSuggestion}
                              onVerify={eventLocationInput.verify}
                              onOpenMapPicker={() => setShowMapPicker(true)}
                              suggestions={eventLocationInput.suggestions}
                              status={eventLocationInput.status}
                              error={eventLocationInput.error}
                              formError={errors.eventLocation}
                          />
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <div>
                                  <Label htmlFor="event-start-date">Start Date & Time</Label>
                                  <Input id="event-start-date" type="datetime-local" value={eventStartDate} onChange={e => setEventStartDate(e.target.value)} />
                                  {errors.eventStartDate && <p className="mt-1 text-sm text-red-600">{errors.eventStartDate}</p>}
                               </div>
                               <div>
                                  <Label htmlFor="event-end-date">End Date & Time (Optional)</Label>
                                  <Input id="event-end-date" type="datetime-local" value={eventEndDate} onChange={e => setEventEndDate(e.target.value)} />
                               </div>
                           </div>
                      </div>
                  )}
                  
                   <div>
                      <div className="flex items-center gap-2">
                          <Label htmlFor="post-tags">Tags</Label>
                          <Button type="button" size="xs" variant="glass" onClick={handleSuggestTags} isLoading={isSuggestingTags}>
                              AI Suggest
                          </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 p-2 mt-1 border rounded-md min-h-[40px] bg-gray-50">
                          {tags.map(tag => (
                              <div key={tag} className="flex items-center gap-1 bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded-full">
                                  <span>{tag}</span>
                                  <button type="button" onClick={() => removeTag(tag)} className="text-red-600"><XMarkIcon className="w-4 h-4"/></button>
                              </div>
                          ))}
                      </div>
                      <Input id="post-tags" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagInputKeyDown} placeholder="Type a tag and press Enter..." className="mt-2" />
                  </div>
                  
                   {type !== PostType.EVENT && (
                      <div className="pt-4 border-t">
                          <div className="relative flex items-start">
                            <div className="flex h-6 items-center">
                              <input id="has-expiry" type="checkbox" checked={hasExpiry} onChange={(e) => setHasExpiry(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"/>
                            </div>
                            <div className="ml-3 text-sm leading-6">
                              <Label htmlFor="has-expiry">Set an expiry date for this listing</Label>
                            </div>
                          </div>
                          {hasExpiry && (
                              <div className="mt-2 animate-fade-in-up">
                                  <Input id="expiry-date" type="datetime-local" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                                  {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>}
                              </div>
                          )}
                      </div>
                   )}
              </form>
          </div>
          )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-in-up" style={{ animationDelay: '200ms' }}>
          <div className="backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)] border-t border-black/5">
              <div className="max-w-2xl mx-auto px-4 sm:px-6">
                  <div className="py-3 flex items-center gap-3">
                      <Button variant="glass" onClick={onBack} className="mr-auto">Cancel</Button>
                      <Button type="submit" form="create-post-form" isLoading={isSubmitting} size="lg" variant="glass-red">
                          {isEditing ? 'Save Changes' : 'Publish'}
                      </Button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

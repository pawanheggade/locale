
import React, { useState, useReducer, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ModalShell from './ModalShell';
import { InputWithIcon } from './InputWithIcon';
import { FormField } from './FormField';
import { ModalFooter } from './ModalFooter';
import { GlobeAltIcon, YouTubeIcon, InstagramIcon } from './Icons';
import { SocialPlatform, SocialLink } from '../types';
import { URL_REGEX } from '../utils/validation';

interface EditSocialsModalProps {
  onClose: () => void;
}

const initialState = {
    website: '',
    instagram: '',
    youtube: '',
};

type FormState = typeof initialState;
type Action = { type: 'SET_FIELD'; field: keyof FormState; payload: string };

function reducer(state: FormState, action: Action): FormState {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.payload };
        default:
            return state;
    }
}

export const EditSocialsModal: React.FC<EditSocialsModalProps> = ({ onClose }) => {
  const { currentAccount, updateAccountDetails } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Initialize state from current account social links
  const initialSocials = { ...initialState };
  if (currentAccount?.socialLinks) {
      currentAccount.socialLinks.forEach(link => {
          if (link.platform in initialSocials) {
              initialSocials[link.platform] = link.url;
          }
      });
  }

  const [state, dispatch] = useReducer(reducer, initialSocials);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;

    // Validate
    const newErrors: Record<string, string> = {};
    (Object.keys(state) as SocialPlatform[]).forEach(platform => {
        const url = state[platform].trim();
        if (url && !URL_REGEX.test(url)) {
            newErrors[platform] = 'Please enter a valid URL.';
        }
    });

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    setIsSubmitting(true);

    const platformOrder: SocialPlatform[] = ['website', 'youtube', 'instagram'];
    const socialLinks: SocialLink[] = platformOrder
        .filter(platform => state[platform] && state[platform].trim() !== '')
        .map(platform => ({ platform, url: state[platform].trim() }));

    updateAccountDetails({ ...currentAccount, socialLinks });
    
    setIsSubmitting(false);
    onClose();
  };

  const renderFooter = () => (
    <ModalFooter
        onCancel={onClose}
        submitText="Save"
        isSubmitting={isSubmitting}
        submitFormId="edit-socials-form"
    />
  );

  return (
    <ModalShell
      panelRef={modalRef}
      onClose={onClose}
      title="Edit Social Profiles"
      footer={renderFooter()}
      panelClassName="w-full max-w-md"
      titleId="edit-socials-title"
    >
      <div className="p-6">
        <form id="edit-socials-form" onSubmit={handleSubmit} className="space-y-4">
            <FormField id="social-website" label="" error={errors.website}>
                <InputWithIcon 
                    placeholder="Website URL" 
                    icon={<GlobeAltIcon className="w-5 h-5 text-gray-600"/>} 
                    value={state.website} 
                    onChange={e => dispatch({ type: 'SET_FIELD', field: 'website', payload: e.target.value })} 
                />
            </FormField>
            
            <FormField id="social-youtube" label="" error={errors.youtube}>
                <InputWithIcon 
                    placeholder="YouTube URL" 
                    icon={<YouTubeIcon className="w-5 h-5 text-gray-600"/>} 
                    value={state.youtube} 
                    onChange={e => dispatch({ type: 'SET_FIELD', field: 'youtube', payload: e.target.value })} 
                />
            </FormField>

            <FormField id="social-instagram" label="" error={errors.instagram}>
                <InputWithIcon 
                    placeholder="Instagram URL" 
                    icon={<InstagramIcon className="w-5 h-5 text-gray-600"/>} 
                    value={state.instagram} 
                    onChange={e => dispatch({ type: 'SET_FIELD', field: 'instagram', payload: e.target.value })} 
                />
            </FormField>
        </form>
      </div>
    </ModalShell>
  );
};

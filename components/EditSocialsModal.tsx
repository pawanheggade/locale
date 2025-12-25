
import React, { useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ModalShell from './ModalShell';
import { InputWithIcon } from './InputWithIcon';
import { FormField } from './FormField';
import { ModalFooter } from './ModalFooter';
import { GlobeAltIcon, YouTubeIcon, InstagramIcon, XIcon } from './Icons';
import { SocialPlatform, SocialLink } from '../types';
import { URL_REGEX } from '../utils/validation';
import { useFormState } from '../hooks/useFormState';

interface EditSocialsModalProps {
  onClose: () => void;
}

const initialState = {
    website: '',
    instagram: '',
    youtube: '',
    x: '',
};

export const EditSocialsModal: React.FC<EditSocialsModalProps> = ({ onClose }) => {
  const { currentAccount, updateAccountDetails } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  
  const getInitialState = () => {
    const initialSocials = { ...initialState };
    if (currentAccount?.socialLinks) {
        currentAccount.socialLinks.forEach(link => {
            if (link.platform in initialSocials) {
                initialSocials[link.platform as keyof typeof initialSocials] = link.url;
            }
        });
    }
    return initialSocials;
  };
  
  const { state, setField, errors, isSubmitting, handleSubmit, setErrors } = useFormState(getInitialState());

  const handleSocialsSubmit = handleSubmit(async (currentState) => {
    if (!currentAccount) return;

    const platformOrder: SocialPlatform[] = ['website', 'instagram', 'x', 'youtube'];
    const socialLinks: SocialLink[] = platformOrder
        .filter(platform => currentState[platform as keyof typeof currentState] && currentState[platform as keyof typeof currentState].trim() !== '')
        .map(platform => ({ platform, url: currentState[platform as keyof typeof currentState].trim() }));

    updateAccountDetails({ ...currentAccount, socialLinks });
    onClose();
  }, (currentState) => {
    const newErrors: Record<string, string> = {};
    (Object.keys(currentState) as (keyof typeof currentState)[]).forEach(platform => {
        const url = currentState[platform].trim();
        if (url && !URL_REGEX.test(url)) {
            newErrors[platform] = 'Please enter a valid URL.';
        }
    });
    return newErrors;
  });

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
        <form id="edit-socials-form" onSubmit={handleSocialsSubmit} className="space-y-4">
            <FormField id="social-website" label="" error={errors.website}>
                <InputWithIcon 
                    placeholder="Website URL" 
                    icon={<GlobeAltIcon className="w-5 h-5 text-gray-600"/>} 
                    value={state.website} 
                    onChange={e => setField('website', e.target.value)} 
                />
            </FormField>
            
            <FormField id="social-youtube" label="" error={errors.youtube}>
                <InputWithIcon 
                    placeholder="YouTube URL" 
                    icon={<YouTubeIcon className="w-5 h-5 text-gray-600"/>} 
                    value={state.youtube} 
                    onChange={e => setField('youtube', e.target.value)} 
                />
            </FormField>

            <FormField id="social-instagram" label="" error={errors.instagram}>
                <InputWithIcon 
                    placeholder="Instagram URL" 
                    icon={<InstagramIcon className="w-5 h-5 text-gray-600"/>} 
                    value={state.instagram} 
                    onChange={e => setField('instagram', e.target.value)} 
                />
            </FormField>
            
            <FormField id="social-x" label="" error={errors.x}>
                <InputWithIcon 
                    placeholder="X (formerly Twitter) URL" 
                    icon={<XIcon className="w-5 h-5 text-gray-600"/>} 
                    value={state.x} 
                    onChange={e => setField('x', e.target.value)} 
                />
            </FormField>
        </form>
      </div>
    </ModalShell>
  );
};

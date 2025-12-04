import { Account, Post } from '../types';
import { PhoneIcon, EnvelopeIcon, ChatBubbleBottomCenterTextIcon } from '../components/Icons';

/**
 * Generates a list of available contact methods for a given author.
 * @param author The account of the person to contact.
 * @param currentAccount The currently logged-in account, used for pre-filling messages.
 * @param post Optional post context for the inquiry.
 * @param prefilledMessage Optional pre-filled message content.
 * @returns An array of contact method objects.
 */
export const generateContactMethods = (
    author: Account, 
    currentAccount: Account | null,
    post?: Post, 
    prefilledMessage?: string
) => {
    const subject = encodeURIComponent(post ? `Inquiry about your post: "${post.title}" on Locale` : `Inquiry from Locale`);
    const body = encodeURIComponent(prefilledMessage || (post ? `Hi ${author.name},\n\nI'm interested in your post "${post.title}" (ID: ${post.id}).\n\n[Your message here]\n\nThanks,\n${currentAccount?.name || ''}` : `Hi ${author.name},\n\nI'm interested in your profile on Locale.\n\n[Your message here]\n\nThanks,\n${currentAccount?.name || ''}`));

    return [
        {
            key: 'message' as const,
            icon: ChatBubbleBottomCenterTextIcon,
            href: `https://wa.me/${author.messageNumber?.replace(/\D/g, '')}`,
            isVisible: author.contactOptions?.includes('message') && !!author.messageNumber,
            label: 'Message',
            toast: 'Opening messaging app...',
        },
        {
            key: 'mobile' as const,
            icon: PhoneIcon,
            href: `tel:${author.mobile}`,
            isVisible: author.contactOptions?.includes('mobile') && !!author.mobile,
            label: 'Call',
            toast: 'Opening phone dialer...',
        },
        {
            key: 'email' as const,
            icon: EnvelopeIcon,
            href: `mailto:${author.email}?subject=${subject}&body=${body}`,
            isVisible: author.contactOptions?.includes('email') && !!author.email,
            label: 'Email',
            toast: 'Opening email client...',
        }
    ].filter(m => m.isVisible);
};

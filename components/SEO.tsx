import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "Join your hyperlocal community to buy, sell, and discuss everything happening in your neighborhood.", 
  image, 
  type = 'website' 
}) => {
  useEffect(() => {
    // Update Title
    const previousTitle = document.title;
    document.title = `${title} | Locale`;

    // Helper to update meta tags
    const updateMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const updateOgMeta = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update Meta Description
    updateMeta('description', description);

    // Update Open Graph
    updateOgMeta('og:title', title);
    updateOgMeta('og:description', description);
    updateOgMeta('og:type', type);
    updateOgMeta('og:url', window.location.href);
    if (image) {
      updateOgMeta('og:image', image);
      updateOgMeta('twitter:image', image);
    }

    // Update Twitter
    updateOgMeta('twitter:title', title);
    updateOgMeta('twitter:description', description);

    return () => {
      // Cleanup: Revert to defaults if component unmounts
      document.title = "Locale - Share & Discover";
      updateMeta('description', "Join your hyperlocal community to buy, sell, and discuss everything happening in your neighborhood.");
    };
  }, [title, description, image, type]);

  return null;
};
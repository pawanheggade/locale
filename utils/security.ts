
/**
 * Basic client-side HTML sanitizer to prevent XSS in dangerousSetInnerHTML usage.
 * This strips dangerous tags (script, iframe, etc.) and attributes (on*, javascript:).
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    if (!doc || !doc.body) {
      return '';
    }

    // 1. Remove dangerous tags
    // We generally want to keep structural tags like html/body to access content, 
    // but strip their attributes.
    const dangerousTags = [
      'script', 'iframe', 'object', 'embed', 
      'form', 'input', 'button', 'textarea', 'select', 'option', 
      'style', 'link', 'meta', 'base', 'head'
    ];
    
    dangerousTags.forEach(tag => {
      const elements = doc.querySelectorAll(tag);
      elements.forEach(el => el.remove());
    });

    // 2. Sanitize attributes on all remaining elements
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      const attributes = el.attributes;
      // Iterate backwards because we might remove items
      for (let i = attributes.length - 1; i >= 0; i--) {
        const attrName = attributes[i].name.toLowerCase();
        const attrValue = attributes[i].value.toLowerCase().trim();

        // Remove event handlers (e.g., onclick, onerror)
        if (attrName.startsWith('on')) {
          el.removeAttribute(attrName);
          continue;
        }

        // Remove javascript: URIs in href and src
        if ((attrName === 'href' || attrName === 'src') && attrValue.startsWith('javascript:')) {
          el.removeAttribute(attrName);
          continue;
        }
      }
    });

    return doc.body ? doc.body.innerHTML : '';
  } catch (error) {
    console.error('Sanitization error:', error);
    return '';
  }
};

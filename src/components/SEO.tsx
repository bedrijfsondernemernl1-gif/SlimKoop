import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  structuredData?: object | object[];
}

export function SEO({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage = 'https://i.ibb.co/0yGyYTqW/Screen-Shot-Tool-20260519181200.png',
  structuredData
}: SEOProps) {
  const location = useLocation();

  useEffect(() => {
    // 1. Dynamic Title
    document.title = title;

    // Helper to dynamically set/update header meta tags
    const setMetaTag = (attrName: string, attrVal: string, contentVal: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentVal);
    };

    // 2. Dynamic Description
    setMetaTag('name', 'description', description);

    // 3. Dynamic Open Graph Tags
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', ogImage);
    
    const currentOrigin = window.location.origin || 'https://occasionscan.nl';
    const currentUrl = `${currentOrigin}${location.pathname}`;
    setMetaTag('property', 'og:url', currentUrl);

    // 4. Dynamic Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);
    setMetaTag('name', 'twitter:url', currentUrl);

    // 5. Dynamic Canonical Link
    const canonicalUrl = canonical || currentUrl;
    let canonicalElement = document.querySelector('link[rel="canonical"]');
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.setAttribute('href', canonicalUrl);

    // 6. Dynamic Structured Data (JSON-LD)
    const jsonLdAttr = 'data-seo-jsonld';
    const existingScripts = document.querySelectorAll(`script[${jsonLdAttr}]`);
    existingScripts.forEach(el => el.remove());

    if (structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute(jsonLdAttr, 'true');
      script.innerHTML = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, ogType, ogImage, structuredData, location.pathname]);

  return null;
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEO({ 
  title, 
  description, 
  keywords,
  image = 'https://www.shinypull.com/og-image.png',
  type = 'website'
}) {
  const location = useLocation();
  const url = `https://www.shinypull.com${location.pathname}`;
  
  const fullTitle = title ? `${title} | Shiny Pull` : 'Shiny Pull - Social Media Analytics & Statistics';
  const defaultDescription = 'Track YouTube, Twitch, TikTok, Instagram & Twitter statistics. View subscriber counts, earnings estimates, rankings and growth analytics for your favorite creators.';
  const metaDescription = description || defaultDescription;
  
  useEffect(() => {
    // Update title
    document.title = fullTitle;
    
    // Update or create meta tags
    const updateMetaTag = (property, content, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };
    
    // Standard meta tags
    updateMetaTag('description', metaDescription);
    if (keywords) updateMetaTag('keywords', keywords);
    
    // Open Graph tags
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', metaDescription, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:site_name', 'Shiny Pull', true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', metaDescription);
    updateMetaTag('twitter:image', image);
    
    // Additional SEO tags
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('author', 'Shiny Pull');
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
    
  }, [fullTitle, metaDescription, keywords, url, image, type]);
  
  return null;
}

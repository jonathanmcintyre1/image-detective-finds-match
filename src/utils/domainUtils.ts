/**
 * Domain utilities for normalizing and categorizing domains
 */

// Common marketplaces
const MARKETPLACES = [
  'amazon', 'ebay', 'walmart', 'etsy', 'aliexpress', 'shopify', 'alibaba',
  'wish', 'target', 'newegg', 'bestbuy', 'wayfair', 'homedepot', 'overstock',
  'groupon', 'rakuten', 'costco', 'macys', 'nordstrom', 'kohls'
];

// Common social media platforms
const SOCIAL_MEDIA = [
  'facebook', 'instagram', 'twitter', 'pinterest', 'linkedin', 'tumblr',
  'reddit', 'youtube', 'tiktok', 'snapchat', 'flickr', 'medium',
  'quora', 'vimeo', 'whatsapp', 'telegram', 'discord', 'vk'
];

// Common e-commerce platforms - Updated with more patterns
const ECOMMERCE = [
  'shopify', 'magento', 'bigcommerce', 'woocommerce', 'prestashop',
  'opencart', 'squarespace', 'wix', 'weebly', '3dcart', 'volusion',
  'storenvy', 'ecwid', 'bigcartel', 'solidus', 'spree', 'boutique',
  'shop', 'store', 'market', 'apparel', 'clothing', 'fashion', 
  'wear', 'jewelry', 'accessory', 'accessories', 'baby', 'kids',
  'child', 'children', 'toys'
];

// Known CDNs
const CDNS = [
  'cloudfront.net', 'cdn.shopify', 'cloudinary', 'imgix', 'fastly', 'akamaized',
  'cdn.', 'ibb.co', 'imgur.com', 'postimg.cc', 'amazonaws.com', 's3.',
  'media-amazon.com', 'staticflickr.com', 'cdninstagram.com', 'fbcdn.net',
  'pinimg.com', 'twimg.com', 'assets.', 'static.'
];

/**
 * Get hostname from URL
 * @param url The URL to parse
 * @returns The hostname without www.
 */
export const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    // Return original if not a valid URL
    return url;
  }
};

/**
 * Get the domain from a hostname (e.g. "amazon" from "amazon.com")
 * @param hostname The hostname to parse
 * @returns The domain name without TLD
 */
export const getDomain = (hostname: string): string => {
  const parts = hostname.split('.');
  if (parts.length > 1) {
    // Handle special cases like co.uk
    if (parts.length > 2 && parts[parts.length - 2] === 'co') {
      return parts[parts.length - 3];
    }
    return parts[parts.length - 2];
  }
  return hostname;
};

/**
 * Get a friendly website name from a URL
 * @param url The URL to parse 
 * @param platform Override platform name
 * @returns A friendly name for the website
 */
export const getWebsiteName = (url: string, platform?: string): string => {
  if (platform) return platform;
  
  const hostname = getHostname(url);
  const domain = getDomain(hostname);
  
  // Capitalize the first letter
  return domain.charAt(0).toUpperCase() + domain.slice(1);
};

/**
 * Determine if a URL is from a CDN
 * @param url The URL to check
 * @returns True if the URL is from a CDN
 */
export const isCdnUrl = (url: string): boolean => {
  const urlLower = url.toLowerCase();
  return CDNS.some(pattern => urlLower.includes(pattern));
};

/**
 * Get the actual website platform or source of the image
 * @param url The URL to analyze
 * @returns The source platform name or null
 */
export const getSourcePlatform = (url: string): string | null => {
  try {
    const hostname = getHostname(url);
    const domain = getDomain(hostname);
    
    if (hostname.includes('media-amazon.com')) {
      return 'Amazon';
    } else if (hostname.includes('staticflickr.com')) {
      return 'Flickr';
    } else if (hostname.includes('cdninstagram.com') || hostname.includes('fbcdn.net')) {
      return 'Instagram';
    } else if (hostname.includes('pinimg.com')) {
      return 'Pinterest';
    } else if (hostname.includes('twimg.com')) {
      return 'Twitter';
    } else if (hostname.includes('wikimedia.org')) {
      return 'Wikimedia';
    } else if (hostname.includes('ytimg.com')) {
      return 'YouTube';
    }
    
    const domainLower = domain.toLowerCase();
    
    // Check against platform lists
    for (const marketplace of MARKETPLACES) {
      if (domainLower.includes(marketplace)) {
        return marketplace.charAt(0).toUpperCase() + marketplace.slice(1);
      }
    }
    
    for (const social of SOCIAL_MEDIA) {
      if (domainLower.includes(social)) {
        return social.charAt(0).toUpperCase() + social.slice(1);
      }
    }
    
    return null;
  } catch {
    return null;
  }
};

/**
 * Categorize a domain by its type
 * @param hostname The hostname to categorize
 * @returns The category type (marketplace, social, ecommerce, or other)
 */
export const categorizeWebsite = (hostname: string): 'marketplace' | 'social' | 'ecommerce' | 'other' => {
  const domain = getDomain(hostname).toLowerCase();
  
  // Common patterns for ecommerce sites
  const ecommercePatterns = [
    'boutique', 'shop', 'store', 'market', 'apparel', 'clothing',
    'fashion', 'wear', 'jewelry', 'accessory', 'accessories',
    'baby', 'kids', 'child', 'children', 'toys'
  ];
  
  if (MARKETPLACES.some(m => domain.includes(m))) {
    return 'marketplace';
  }
  
  if (SOCIAL_MEDIA.some(s => domain.includes(s))) {
    return 'social';
  }
  
  if (ECOMMERCE.some(e => domain.includes(e)) || 
      ecommercePatterns.some(pattern => domain.includes(pattern))) {
    return 'ecommerce';
  }
  
  return 'other';
};

/**
 * Extract CDN information from URL
 * @param url The URL to analyze
 * @returns Information about the CDN
 */
export const getCdnInfo = (url: string): string => {
  const hostname = getHostname(url);
  
  if (hostname.includes('cloudfront.net')) return 'Amazon CloudFront';
  if (hostname.includes('amazonaws.com') || hostname.includes('s3.')) return 'Amazon S3';
  if (hostname.includes('cdn.shopify')) return 'Shopify CDN';
  if (hostname.includes('cloudinary')) return 'Cloudinary CDN';
  if (hostname.includes('imgix')) return 'Imgix CDN';
  if (hostname.includes('media-amazon')) return 'Amazon Media';
  if (hostname.includes('akamaized')) return 'Akamai CDN';
  if (hostname.includes('staticflickr')) return 'Flickr CDN';
  if (hostname.includes('twimg')) return 'Twitter CDN';
  if (hostname.includes('fbcdn')) return 'Facebook CDN';
  if (hostname.includes('cdninstagram')) return 'Instagram CDN';
  if (hostname.includes('pinimg')) return 'Pinterest CDN';
  
  return hostname;
};

/**
 * Group an array of items by domain
 * @param items Items with a URL property
 * @returns Grouped items by domain
 */
export function groupByDomain<T extends { url: string }>(
  items: T[]
): { domain: string; items: T[]; platform?: string }[] {
  const domains = new Map<string, { items: T[]; platform?: string }>();
  
  items.forEach(item => {
    const hostname = getHostname(item.url);
    const sourcePlatform = getSourcePlatform(item.url);
    
    if (!domains.has(hostname)) {
      domains.set(hostname, { 
        items: [item],
        platform: sourcePlatform || undefined
      });
    } else {
      domains.get(hostname)?.items.push(item);
    }
  });
  
  return Array.from(domains.entries()).map(([domain, data]) => ({
    domain,
    items: data.items,
    platform: data.platform
  }));
}

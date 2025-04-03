
import { supabase } from '@/integrations/supabase/client';

// Constants for score thresholds and configuration
const MATCH_SCORE_THRESHOLDS = {
  MINIMUM_MATCH_THRESHOLD: 0.5,
  FULL_MATCH_SCORE: 0.98,
  PARTIAL_MATCH_SCORE: 0.85,
  VISUAL_SIMILAR_DEFAULT_SCORE: 0.65,
  PAGE_MATCH_SCORE: 0.7,
  WEB_ENTITY_MIN_SCORE: 0.5
};

// Max results to request from Google Vision API
const MAX_API_RESULTS = 100;

// Type definitions
interface WebEntity {
  entityId: string;
  score: number;
  description: string;
}

interface WebImage {
  url: string;
  score: number;
  imageUrl?: string;
  platform?: string;
}

interface WebPage {
  url: string;
  score: number;
  pageTitle: string;
  platform?: string; 
  pageType?: 'product' | 'category' | 'search' | 'unknown';
  matchingImages?: WebImage[];
}

interface MatchResult {
  webEntities: WebEntity[];
  visuallySimilarImages: WebImage[];
  pagesWithMatchingImages: WebPage[];
}

interface GoogleVisionWebDetectionResponse {
  responses: Array<{
    webDetection?: {
      webEntities?: Array<{
        entityId?: string;
        score?: number;
        description?: string;
      }>;
      fullMatchingImages?: Array<{
        url?: string;
      }>;
      partialMatchingImages?: Array<{
        url?: string;
      }>;
      visuallySimilarImages?: Array<{
        url?: string;
        score?: number;
      }>;
      pagesWithMatchingImages?: Array<{
        url?: string;
        score?: number;
        pageTitle?: string;
        fullMatchingImages?: Array<{
          url?: string;
        }>;
      }>;
    };
  }>;
}

/**
 * Main function to analyze an image using Google Cloud Vision API
 * @param apiKey Google Cloud Vision API key
 * @param imageData URL string or File object
 * @returns Promise with match results
 */
export const analyzeImage = async (apiKey: string, imageData: string | File): Promise<MatchResult> => {
  try {
    // Build the appropriate request body based on image data type
    const requestBody = buildRequestBody(imageData);
    
    // Call the Vision API
    const data = await callGoogleVisionAPI(apiKey, requestBody);
    
    // Process the response
    return processResponse(data);
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

/**
 * Build the request body for the Google Vision API call
 * @param imageData URL string or File object
 * @returns Request body object
 */
const buildRequestBody = async (imageData: string | File): Promise<object> => {
  // For URL-based images
  if (typeof imageData === 'string' && imageData.startsWith('http')) {
    return {
      requests: [
        {
          image: {
            source: {
              imageUri: imageData
            }
          },
          features: [
            {
              type: 'WEB_DETECTION',
              maxResults: MAX_API_RESULTS
            }
          ]
        }
      ]
    };
  } 
  // For File objects
  else if (imageData instanceof File) {
    const base64Image = await fileToBase64(imageData);
    return {
      requests: [
        {
          image: {
            content: base64Image.split(',')[1]
          },
          features: [
            {
              type: 'WEB_DETECTION',
              maxResults: MAX_API_RESULTS
            }
          ]
        }
      ]
    };
  }
  
  throw new Error('Invalid image data provided');
};

/**
 * Call the Google Vision API
 * @param apiKey Google Cloud Vision API key
 * @param requestBody Request body object
 * @returns Promise with API response
 */
const callGoogleVisionAPI = async (apiKey: string, requestBody: object): Promise<GoogleVisionWebDetectionResponse> => {
  const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Vision API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  
  // Log detailed response in development mode
  if (import.meta.env.DEV) {
    console.log("API Response:", JSON.stringify(data, null, 2));
  }
  
  return data;
};

/**
 * Process the response from Google Vision API
 * @param data API response data
 * @returns Match results
 */
const processResponse = (data: GoogleVisionWebDetectionResponse): MatchResult => {
  const webDetection = data.responses[0]?.webDetection || {};
  
  // Process images in their respective categories
  const fullMatchingImages = processFullMatchingImages(webDetection.fullMatchingImages || []);
  const partialMatchingImages = processPartialMatchingImages(webDetection.partialMatchingImages || []);
  const visuallySimilarImages = processVisuallySimilarImages(webDetection.visuallySimilarImages || []);

  // Combine all similar images
  const allSimilarImages = [
    ...fullMatchingImages,
    ...partialMatchingImages,
    ...visuallySimilarImages
  ];

  return {
    webEntities: processWebEntities(webDetection.webEntities || []),
    visuallySimilarImages: allSimilarImages,
    pagesWithMatchingImages: processPagesWithMatchingImages(webDetection.pagesWithMatchingImages || [])
  };
};

/**
 * Process full matching images
 * @param images Full matching images from API response
 * @returns Processed WebImage objects
 */
const processFullMatchingImages = (images: Array<{url?: string}>): WebImage[] => {
  return images
    .filter(image => !!image.url)
    .map(image => {
      const url = image.url || '';
      const platform = identifyPlatform(url);
      return {
        url,
        score: MATCH_SCORE_THRESHOLDS.FULL_MATCH_SCORE,
        imageUrl: url,
        platform
      };
    });
};

/**
 * Process partial matching images
 * @param images Partial matching images from API response
 * @returns Processed WebImage objects
 */
const processPartialMatchingImages = (images: Array<{url?: string}>): WebImage[] => {
  return images
    .filter(image => !!image.url)
    .map(image => {
      const url = image.url || '';
      const platform = identifyPlatform(url);
      return {
        url,
        score: MATCH_SCORE_THRESHOLDS.PARTIAL_MATCH_SCORE,
        imageUrl: url,
        platform
      };
    });
};

/**
 * Process visually similar images
 * @param images Visually similar images from API response
 * @returns Processed WebImage objects
 */
const processVisuallySimilarImages = (images: Array<{url?: string, score?: number}>): WebImage[] => {
  return images
    .filter(image => !!image.url)
    .map(image => {
      const url = image.url || '';
      const platform = identifyPlatform(url);
      return {
        url,
        score: image.score || MATCH_SCORE_THRESHOLDS.VISUAL_SIMILAR_DEFAULT_SCORE,
        imageUrl: url,
        platform
      };
    })
    .filter(img => img.score >= MATCH_SCORE_THRESHOLDS.MINIMUM_MATCH_THRESHOLD);
};

/**
 * Process web entities
 * @param entities Web entities from API response
 * @returns Processed WebEntity objects
 */
const processWebEntities = (entities: Array<{entityId?: string, score?: number, description?: string}>): WebEntity[] => {
  return entities
    .map(entity => ({
      entityId: entity.entityId || '',
      score: entity.score || 0,
      description: entity.description || 'Unknown Entity'
    }))
    .filter(entity => 
      entity.score >= MATCH_SCORE_THRESHOLDS.WEB_ENTITY_MIN_SCORE && 
      entity.description !== 'Unknown Entity'
    );
};

/**
 * Process pages with matching images
 * @param pages Pages with matching images from API response
 * @returns Processed WebPage objects
 */
const processPagesWithMatchingImages = (pages: Array<{
  url?: string, 
  score?: number, 
  pageTitle?: string,
  fullMatchingImages?: Array<{url?: string}>
}>): WebPage[] => {
  return pages
    .map(page => {
      const url = page.url || '';
      const platform = identifyPlatform(url);
      const pageTitle = page.pageTitle || '';
      const pageType = determinePageType(url, pageTitle);
      
      const pageMatchingImages = (page.fullMatchingImages || [])
        .filter(img => !!img.url)
        .map(img => ({
          url: img.url || '',
          score: MATCH_SCORE_THRESHOLDS.PAGE_MATCH_SCORE,
          imageUrl: img.url || '',
          platform: identifyPlatform(img.url || '')
        }));
      
      return {
        url,
        score: page.score || MATCH_SCORE_THRESHOLDS.PAGE_MATCH_SCORE,
        pageTitle,
        platform,
        pageType,
        matchingImages: pageMatchingImages.length > 0 ? pageMatchingImages : undefined
      };
    })
    .filter(page => 
      page.score >= MATCH_SCORE_THRESHOLDS.MINIMUM_MATCH_THRESHOLD && 
      !isFromCDN(page.url)
    );
};

// Platform identification mapping
const PLATFORM_MAPPING: Record<string, string> = {
  'amazon': 'Amazon',
  'amzn': 'Amazon',
  'aliexpress': 'AliExpress',
  'etsy': 'Etsy',
  'ebay': 'eBay',
  'walmart': 'Walmart',
  'shopify': 'Shopify Store',
  'target': 'Target',
  'wayfair': 'Wayfair',
  'homedepot': 'Home Depot',
  'bestbuy': 'Best Buy',
  'ikea': 'IKEA',
  'shopee': 'Shopee',
  'lazada': 'Lazada'
};

// CDN identifiers
const CDN_INDICATORS = [
  'cloudfront.net',
  'cdn.shopify',
  'cloudinary',
  'imgix',
  'fastly',
  'akamaized',
  'cdn.',
  'ibb.co',
  'imgur.com',
  'postimg.cc'
];

/**
 * Identify the platform from a URL
 * @param url URL to analyze
 * @returns Platform name or empty string
 */
const identifyPlatform = (url: string): string => {
  const urlLower = url.toLowerCase();
  
  // Check if it's a known platform
  for (const [keyword, platform] of Object.entries(PLATFORM_MAPPING)) {
    if (urlLower.includes(keyword)) {
      return platform;
    }
  }
  
  // Check if it's a CDN
  if (CDN_INDICATORS.some(cdn => urlLower.includes(cdn))) {
    return 'CDN Hosted';
  }
  
  return '';
};

/**
 * Check if a URL is from a CDN
 * @param url URL to check
 * @returns True if from CDN, false otherwise
 */
const isFromCDN = (url: string): boolean => {
  const urlLower = url.toLowerCase();
  return CDN_INDICATORS.some(cdn => urlLower.includes(cdn));
};

/**
 * Determine the type of page
 * @param url Page URL
 * @param title Page title
 * @returns Page type
 */
const determinePageType = (url: string, title: string): 'product' | 'category' | 'search' | 'unknown' => {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Category page detection patterns
  const categoryUrlPatterns = [
    '/category/', '/categories/', '/collection/', '/collections/',
    '/shop/', '/catalog/', '/department/', '/browse/',
    '/c/', '/cat/', 'category=', 'departments/'
  ];
  
  const categoryTitlePatterns = [
    'collection', 'category', 'categories',
    'shop', 'all ', 'best ', 'new ', 'featured',
    'top ', 'trending', 'catalog'
  ];
  
  const listingIndicators = [
    'results for', 'items', 'products', 'listings',
    'page', ' - page', 'found', 'showing'
  ];
  
  // Product page patterns
  const productUrlPatterns = [
    '/product/', '/item/', '/dp/', '/products/',
    'product-detail', 'productdetails'
  ];
  
  const productTitlePatterns = [
    'buy', 'product details'
  ];
  
  // Check for product pages first (higher specificity)
  if (
    productUrlPatterns.some(pattern => urlLower.includes(pattern)) ||
    productTitlePatterns.some(pattern => titleLower.includes(pattern)) ||
    urlLower.match(/\/p\/\d+/) ||
    titleLower.match(/ - \$\d+/) ||
    titleLower.match(/ \| \$\d+/) ||
    titleLower.match(/\$\d+\.\d+/)
  ) {
    return 'product';
  }
  
  // Check for category pages
  const isCategoryUrl = categoryUrlPatterns.some(pattern => urlLower.includes(pattern));
  const isCategoryTitle = categoryTitlePatterns.some(pattern => titleLower.includes(pattern));
  
  // Additional category detection logic for ecommerce sites
  if (
    isCategoryUrl || 
    isCategoryTitle || 
    (titleLower.includes('products') && !titleLower.includes('product page')) ||
    (listingIndicators.some(indicator => titleLower.includes(indicator)) && 
      !urlLower.includes('search') && !urlLower.includes('query='))
  ) {
    return 'category';
  }
  
  // Check for search pages
  if (
    urlLower.includes('/search') ||
    urlLower.includes('q=') ||
    urlLower.includes('query=') ||
    urlLower.includes('keyword=') ||
    urlLower.includes('/find/') ||
    titleLower.includes('search results') ||
    titleLower.includes('search for')
  ) {
    return 'search';
  }
  
  return 'unknown';
};

/**
 * Convert a File object to base64 string
 * @param file File object
 * @returns Promise with base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};


import { supabase } from '@/integrations/supabase/client';

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
  isValidated?: boolean;
}

interface MatchResult {
  webEntities: WebEntity[];
  visuallySimilarImages: WebImage[];
  pagesWithMatchingImages: WebPage[];
}

// Define constants for match thresholds
const MIN_MATCH_THRESHOLD = 0.65; // Lowered minimum threshold to show more similar matches
const EXACT_MATCH_THRESHOLD = 0.9; // Threshold for exact matches
const PARTIAL_MATCH_THRESHOLD = 0.7; // Lowered from 0.75 to 0.7 to include more partial matches
const FULL_MATCH_SCORE = 0.98; // Score to assign to full matches
const PARTIAL_MATCH_SCORE = 0.85; // Score to assign to partial matches

export const analyzeImage = async (imageData: string | File): Promise<MatchResult> => {
  try {
    let base64Image = '';
    let response;
    let data;
    
    console.log("Preparing to analyze image");
    
    if (typeof imageData === 'string' && imageData.startsWith('http')) {
      console.log("Processing image URL:", imageData.substring(0, 30) + "...");
      
      // Call the Supabase edge function
      const { data: functionData, error } = await supabase.functions.invoke(
        'analyze-image',
        {
          body: { imageData }
        }
      );
      
      if (error) {
        console.error("Error calling analyze-image function:", error);
        throw new Error(error.message || "Failed to analyze image");
      }
      
      data = functionData;
      
    } else if (imageData instanceof File) {
      console.log("Processing image file:", imageData.name);
      base64Image = await fileToBase64(imageData);
      
      // Call the Supabase edge function
      const { data: functionData, error } = await supabase.functions.invoke(
        'analyze-image',
        {
          body: { imageData: base64Image.split(',')[1] }
        }
      );
      
      if (error) {
        console.error("Error calling analyze-image function:", error);
        throw new Error(error.message || "Failed to analyze image");
      }
      
      data = functionData;
    } else {
      throw new Error('Invalid image data provided');
    }
    
    console.log("API Response received successfully");
    return processResponse(data);
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

// Platform identification using mapping approach
const platformMapping: { [key: string]: string } = {
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
  'lazada': 'Lazada',
};

// CDN detection patterns
const cdnPatterns = [
  'cloudfront.net',
  'cdn.shopify',
  'cloudinary',
  'imgix',
  'fastly',
  'akamaized',
  'cdn.',
  'ibb.co',
  'imgur.com',
  'postimg.cc',
  'amazonaws.com',
  's3.',
  'media-amazon.com',
  'staticflickr.com'
];

export const identifyPlatform = (url: string): string => {
  // Extract domain from URL
  let domain = '';
  try {
    const urlObj = new URL(url);
    domain = urlObj.hostname;
  } catch (e) {
    // If URL parsing fails, try to extract domain using regex
    const match = url.match(/https?:\/\/([^\/]+)/);
    domain = match ? match[1] : url;
  }
  
  const urlLower = domain.toLowerCase();
  
  // Check for platforms
  for (const [key, value] of Object.entries(platformMapping)) {
    if (urlLower.includes(key)) {
      return value;
    }
  }
  
  // Check for CDNs
  for (const pattern of cdnPatterns) {
    if (urlLower.includes(pattern)) {
      return 'CDN Hosted';
    }
  }
  
  return '';
};

const determinePageType = (url: string, title: string): 'product' | 'category' | 'search' | 'unknown' => {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Check for product pages
  if (
    urlLower.includes('/product/') || 
    urlLower.includes('/item/') || 
    urlLower.includes('/dp/') || 
    urlLower.match(/\/p\/\d+/) ||
    urlLower.includes('/products/') ||
    titleLower.includes('buy') ||
    titleLower.includes('product') ||
    titleLower.match(/ - \$\d+/) ||
    titleLower.match(/ \| \$\d+/) ||
    titleLower.match(/\$\d+\.\d+/)
  ) {
    return 'product';
  }
  
  // Check for category pages
  else if (
    urlLower.includes('/category/') ||
    urlLower.includes('/collection/') ||
    urlLower.includes('/collections/') ||
    urlLower.includes('/shop/') ||
    urlLower.includes('/catalog/') ||
    urlLower.includes('/department/') ||
    titleLower.includes('collection') ||
    titleLower.includes('category') ||
    (titleLower.includes('products') && !titleLower.includes('product page'))
  ) {
    return 'category';
  }
  
  // Check for search pages
  else if (
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

// Process full matching images
const processFullMatches = (images: any[]): WebImage[] => {
  return (images || []).map((image: any) => {
    const platform = identifyPlatform(image.url);
    return {
      url: image.url || '',
      score: FULL_MATCH_SCORE,
      imageUrl: image.url || '',
      platform
    };
  });
};

// Process partial matching images
const processPartialMatches = (images: any[]): WebImage[] => {
  return (images || []).map((image: any) => {
    const platform = identifyPlatform(image.url);
    return {
      url: image.url || '',
      score: PARTIAL_MATCH_SCORE,
      imageUrl: image.url || '',
      platform
    };
  });
};

// Process visually similar images
const processSimilarImages = (images: any[]): WebImage[] => {
  return (images || [])
    .map((image: any) => {
      const platform = identifyPlatform(image.url);
      return {
        url: image.url || '',
        score: image.score || 0.65, // Use provided score or default
        imageUrl: image.url || '',
        platform
      };
    })
    // Filter out images below the minimum threshold
    .filter((img: WebImage) => img.score >= MIN_MATCH_THRESHOLD);
};

// Process pages with matching images
const processPages = (pages: any[]): WebPage[] => {
  const processedPages: WebPage[] = (pages || [])
    .map((page: any) => {
      const platform = identifyPlatform(page.url);
      const pageTitle = page.pageTitle || '';
      const pageType = determinePageType(page.url, pageTitle);
      
      const pageMatchingImages = (page.fullMatchingImages || [])
        .map((img: any) => ({
          url: img.url,
          score: 0.95, // High confidence for page matches
          imageUrl: img.url,
          platform: identifyPlatform(img.url)
        }));
      
      return {
        url: page.url || '',
        score: page.score || 0.7,
        pageTitle: pageTitle,
        platform,
        pageType,
        matchingImages: pageMatchingImages.length > 0 ? pageMatchingImages : undefined,
        isValidated: false // Default to not validated
      };
    });
  
  // Filter out CDN pages and pages below threshold
  return processedPages.filter((page: WebPage) => {
    // Check if URL is from a CDN
    const isCDN = cdnPatterns.some(pattern => page.url.toLowerCase().includes(pattern));
    
    // Only include pages with a score above the minimum threshold and not from CDNs
    return !isCDN && page.score >= MIN_MATCH_THRESHOLD;
  });
};

const processResponse = (data: any): MatchResult => {
  const webDetection = data.responses[0]?.webDetection || {};
  console.log("Web Detection Data:", JSON.stringify(webDetection, null, 2));

  // Process different types of image matches
  const fullMatchingImages = processFullMatches(webDetection.fullMatchingImages);
  const partialMatchingImages = processPartialMatches(webDetection.partialMatchingImages);
  const visuallySimilarImages = processSimilarImages(webDetection.visuallySimilarImages);

  // Combine all similar images
  const allSimilarImages = [
    ...fullMatchingImages,
    ...partialMatchingImages,
    ...visuallySimilarImages
  ];

  // Log the count of each type for debugging
  console.log("Full matches:", fullMatchingImages.length);
  console.log("Partial matches:", partialMatchingImages.length);
  console.log("Similar matches:", visuallySimilarImages.length);
  console.log("Total similar images:", allSimilarImages.length);

  // Process pages with matching images
  const pagesWithMatchingImages = processPages(webDetection.pagesWithMatchingImages);
  
  // Process web entities
  const webEntities = (webDetection.webEntities || [])
    .map((entity: any) => ({
      entityId: entity.entityId || '',
      score: entity.score || 0,
      description: entity.description || 'Unknown Entity'
    }))
    .filter((entity: WebEntity) => entity.score > 0.5 && entity.description !== 'Unknown Entity');
  
  return {
    webEntities: webEntities || [],
    visuallySimilarImages: allSimilarImages,
    pagesWithMatchingImages
  };
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

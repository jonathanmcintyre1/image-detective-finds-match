
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
}

interface MatchResult {
  webEntities: WebEntity[];
  visuallySimilarImages: WebImage[];
  pagesWithMatchingImages: WebPage[];
}

export const analyzeImage = async (apiKey: string, imageData: string | File): Promise<MatchResult> => {
  try {
    let base64Image = '';
    
    if (typeof imageData === 'string' && imageData.startsWith('http')) {
      // If URL is provided, we'll use the imageUri field
      const requestBody = {
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
                maxResults: 100
              }
            ]
          }
        ]
      };
      
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API Response:", JSON.stringify(data, null, 2)); // Log full API response
      return processResponse(data);
      
    } else if (imageData instanceof File) {
      // Convert File to base64
      base64Image = await fileToBase64(imageData);
      
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image.split(',')[1] // Remove data URL prefix if present
            },
            features: [
              {
                type: 'WEB_DETECTION',
                maxResults: 100
              }
            ]
          }
        ]
      };
      
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API Response:", JSON.stringify(data, null, 2)); // Log full API response
      return processResponse(data);
    }
    
    throw new Error('Invalid image data provided');
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

const identifyPlatform = (url: string): string => {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('amazon') || urlLower.includes('amzn')) {
    return 'Amazon';
  } else if (urlLower.includes('aliexpress')) {
    return 'AliExpress';
  } else if (urlLower.includes('etsy')) {
    return 'Etsy';
  } else if (urlLower.includes('ebay')) {
    return 'eBay';
  } else if (urlLower.includes('walmart')) {
    return 'Walmart';
  } else if (urlLower.includes('shopify')) {
    return 'Shopify Store';
  } else if (urlLower.includes('target')) {
    return 'Target';
  } else if (urlLower.includes('wayfair')) {
    return 'Wayfair';
  } else if (urlLower.includes('homedepot')) {
    return 'Home Depot';
  } else if (urlLower.includes('bestbuy')) {
    return 'Best Buy';
  } else if (urlLower.includes('ikea')) {
    return 'IKEA';
  } else {
    // Check for CDNs
    if (urlLower.includes('cloudfront.net') || 
        urlLower.includes('cdn.shopify') || 
        urlLower.includes('cloudinary') || 
        urlLower.includes('imgix') ||
        urlLower.includes('fastly') ||
        urlLower.includes('akamaized') ||
        urlLower.includes('cdn.')) {
      return 'CDN Hosted';
    }
    return '';
  }
};

const processResponse = (data: any): MatchResult => {
  const webDetection = data.responses[0]?.webDetection || {};
  console.log("Web Detection Data:", JSON.stringify(webDetection, null, 2)); // Log parsed web detection

  // Process all types of matches from the API
  
  // Visually similar images - include all with a reasonable score
  const visuallySimilarImages = (webDetection.visuallySimilarImages || [])
    .map((image: any) => {
      const platform = identifyPlatform(image.url);
      return {
        url: image.url || '',
        score: image.score || 0.7, // Default reasonable score if not provided
        imageUrl: image.url || '',
        platform
      };
    });

  // Full matches - these are highest confidence
  const fullMatchingImages = (webDetection.fullMatchingImages || [])
    .map((image: any) => {
      const platform = identifyPlatform(image.url);
      return {
        url: image.url || '',
        score: 0.95, // High confidence for full matches
        imageUrl: image.url || '',
        platform
      };
    });

  // Partial matching images
  const partialMatchingImages = (webDetection.partialMatchingImages || [])
    .map((image: any) => {
      const platform = identifyPlatform(image.url);
      return {
        url: image.url || '',
        score: 0.8, // Good confidence for partial matches
        imageUrl: image.url || '',
        platform
      };
    });

  // Combine all image matches
  const allSimilarImages = [
    ...fullMatchingImages,
    ...partialMatchingImages,
    ...visuallySimilarImages
  ];

  // Process pages with matching images - don't filter these, show all
  const pagesWithMatchingImages = (webDetection.pagesWithMatchingImages || [])
    .map((page: any) => {
      const platform = identifyPlatform(page.url);
      return {
        url: page.url || '',
        score: page.score || 0.7, // Default reasonable score
        pageTitle: page.pageTitle || '',
        platform
      };
    });
  
  return {
    webEntities: webDetection.webEntities?.map((entity: any) => ({
      entityId: entity.entityId || '',
      score: entity.score || 0,
      description: entity.description || 'Unknown Entity'
    })) || [],
    
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

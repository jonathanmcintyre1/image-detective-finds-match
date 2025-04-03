
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

export const analyzeImage = async (apiKey: string, imageData: string | File): Promise<MatchResult> => {
  try {
    let base64Image = '';
    
    if (typeof imageData === 'string' && imageData.startsWith('http')) {
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
      base64Image = await fileToBase64(imageData);
      
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image.split(',')[1]
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
    if (urlLower.includes('cloudfront.net') || 
        urlLower.includes('cdn.shopify') || 
        urlLower.includes('cloudinary') || 
        urlLower.includes('imgix') ||
        urlLower.includes('fastly') ||
        urlLower.includes('akamaized') ||
        urlLower.includes('cdn.') ||
        urlLower.includes('ibb.co') ||
        urlLower.includes('imgur.com') ||
        urlLower.includes('postimg.cc')) {
      return 'CDN Hosted';
    }
    return '';
  }
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

const processResponse = (data: any): MatchResult => {
  const webDetection = data.responses[0]?.webDetection || {};
  console.log("Web Detection Data:", JSON.stringify(webDetection, null, 2));

  // Process exact matching images - full matches
  const fullMatchingImages = (webDetection.fullMatchingImages || [])
    .map((image: any) => {
      const platform = identifyPlatform(image.url);
      return {
        url: image.url || '',
        score: 1.0, // 100% match for full matches
        imageUrl: image.url || '',
        platform
      };
    });

  // Process partial matching images - partial matches
  const partialMatchingImages = (webDetection.partialMatchingImages || [])
    .map((image: any) => {
      const platform = identifyPlatform(image.url);
      return {
        url: image.url || '',
        score: 0.85, // 85% match for partial matches
        imageUrl: image.url || '',
        platform
      };
    });

  // Process visually similar images - lower confidence
  const visuallySimilarImages = (webDetection.visuallySimilarImages || [])
    .map((image: any) => {
      const platform = identifyPlatform(image.url);
      return {
        url: image.url || '',
        score: image.score || 0.6, // Typical score range for similar images
        imageUrl: image.url || '',
        platform
      };
    })
    .filter((img: WebImage) => img.score >= 0.6);

  // Combine all similar images
  const allSimilarImages = [
    ...fullMatchingImages,
    ...partialMatchingImages,
    ...visuallySimilarImages
  ];

  // Process pages with matching images
  const pagesWithMatchingImages = (webDetection.pagesWithMatchingImages || [])
    .map((page: any) => {
      const platform = identifyPlatform(page.url);
      const pageTitle = page.pageTitle || '';
      const pageType = determinePageType(page.url, pageTitle);
      
      const pageMatchingImages = (page.fullMatchingImages || [])
        .map((img: any) => ({
          url: img.url,
          score: 1.0,
          imageUrl: img.url,
          platform: identifyPlatform(img.url)
        }));
      
      return {
        url: page.url || '',
        score: page.score || 0.7,
        pageTitle: pageTitle,
        platform,
        pageType,
        matchingImages: pageMatchingImages.length > 0 ? pageMatchingImages : undefined
      };
    })
    .filter((page: WebPage) => {
      const isCDN = 
        page.url.includes('cloudfront.net') || 
        page.url.includes('cdn.shopify') || 
        page.url.includes('cloudinary') || 
        page.url.includes('imgix') ||
        page.url.includes('fastly') ||
        page.url.includes('akamaized') ||
        page.url.includes('cdn.') ||
        page.url.includes('ibb.co') ||
        page.url.includes('imgur.com') ||
        page.url.includes('postimg.cc');
      
      return !isCDN && page.score >= 0.6;
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

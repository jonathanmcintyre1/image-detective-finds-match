
interface WebEntity {
  entityId: string;
  score: number;
  description: string;
}

interface WebImage {
  url: string;
  score: number;
  imageUrl?: string;
}

interface WebPage {
  url: string;
  score: number;
  pageTitle: string;
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
                maxResults: 50
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
                maxResults: 50
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
      return processResponse(data);
    }
    
    throw new Error('Invalid image data provided');
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

const processResponse = (data: any): MatchResult => {
  const webDetection = data.responses[0]?.webDetection || {};
  
  return {
    webEntities: webDetection.webEntities?.map((entity: any) => ({
      entityId: entity.entityId || '',
      score: entity.score || 0,
      description: entity.description || 'Unknown Entity'
    })) || [],
    
    visuallySimilarImages: webDetection.visuallySimilarImages?.map((image: any) => ({
      url: image.url || '',
      score: image.score || 0,
      imageUrl: image.url || ''
    })) || [],
    
    pagesWithMatchingImages: webDetection.pagesWithMatchingImages?.map((page: any) => ({
      url: page.url || '',
      score: page.score || 0,
      pageTitle: page.pageTitle || ''
    })) || []
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

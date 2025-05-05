
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers to allow requests from your app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    
    if (!apiKey) {
      throw new Error("Google Cloud API key not configured on the server");
    }

    const { imageData } = await req.json();
    
    if (!imageData) {
      throw new Error("No image data provided");
    }

    let requestBody;
    console.log("Processing image data type:", typeof imageData);
    
    // Handle URL vs base64 image
    if (typeof imageData === 'string' && imageData.startsWith('http')) {
      console.log("Processing image URL:", imageData.substring(0, 30) + "...");
      requestBody = {
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
    } else {
      // Handle base64 encoded image
      const base64Content = typeof imageData === 'string' ? 
        (imageData.includes('base64,') ? imageData.split('base64,')[1] : imageData) : 
        null;
        
      if (!base64Content) {
        throw new Error("Invalid image data format");
      }
      
      requestBody = {
        requests: [
          {
            image: {
              content: base64Content
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
    }
    
    // Call Google Cloud Vision API
    console.log('Calling Google Vision API...');
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Vision API error (${response.status}):`, errorText);
      throw new Error(`Google Vision API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    // Check for error in the API response
    if (data.error || (data.responses && data.responses[0] && data.responses[0].error)) {
      const errorMessage = data.error?.message || data.responses?.[0]?.error?.message || 'Unknown API error';
      console.error('Google Vision API error:', errorMessage);
      throw new Error(`Google Vision API error: ${errorMessage}`);
    }
    
    return new Response(JSON.stringify(data), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during image analysis' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

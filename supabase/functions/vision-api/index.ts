
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define the structure of our request body
interface RequestBody {
  imageData: string | { url: string };
}

// Load environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const googleCredentials = Deno.env.get('GOOGLE_CREDENTIALS_JSON') ?? '';

// Parse Google credentials
let credentials;
try {
  credentials = JSON.parse(googleCredentials);
} catch (e) {
  console.error("Failed to parse Google credentials:", e);
}

// Create supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      status: 204,
    });
  }

  try {
    // Parse request body
    const { imageData } = await req.json() as RequestBody;
    
    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'No image data provided' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!credentials || !credentials.private_key) {
      return new Response(
        JSON.stringify({ error: 'Google credentials not properly configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate a JWT for Google API authentication
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600; // 1 hour expiration

    const header = { alg: 'RS256', typ: 'JWT' };
    
    const payload = {
      iss: credentials.client_email,
      sub: credentials.client_email,
      aud: 'https://vision.googleapis.com/',
      iat,
      exp,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
    };

    // Create JWT components
    const encoder = new TextEncoder();
    const headerBase64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const payloadBase64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    // Sign the JWT
    const key = credentials.private_key;
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      new Uint8Array(atob(key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '')
        .split('')
        .map(c => c.charCodeAt(0))),
      { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      cryptoKey,
      encoder.encode(`${headerBase64}.${payloadBase64}`)
    );
    
    // Convert signature to base64url
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Combine to create JWT
    const token = `${headerBase64}.${payloadBase64}.${signatureBase64}`;
    
    // Now use the token to authenticate with Google Vision API
    let requestBody;
    
    if (typeof imageData === 'string' && imageData.startsWith('http')) {
      requestBody = {
        requests: [{
          image: { source: { imageUri: imageData } },
          features: [{ type: 'WEB_DETECTION', maxResults: 100 }]
        }]
      };
    } else {
      // Handle base64 image data
      const base64Data = typeof imageData === 'string' ? 
        imageData.split(',')[1] : 
        null;
      
      if (!base64Data) {
        return new Response(
          JSON.stringify({ error: 'Invalid image data format' }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      requestBody = {
        requests: [{
          image: { content: base64Data },
          features: [{ type: 'WEB_DETECTION', maxResults: 100 }]
        }]
      };
    }
    
    // Call Google Vision API with our JWT
    const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Vision API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    // Track this search in our database
    try {
      const webDetection = data.responses[0]?.webDetection || {};
      const resultCount = (webDetection.visuallySimilarImages?.length || 0) + 
                          (webDetection.pagesWithMatchingImages?.length || 0);
      
      await supabase
        .from('searches')
        .insert({
          image_hash: btoa(JSON.stringify(imageData)).slice(0, 50),
          result_count: resultCount,
          search_type: typeof imageData === 'string' ? 'url' : 'file'
        });
    } catch (err) {
      console.error('Failed to track search:', err);
      // Don't fail the request if tracking fails
    }
    
    // Return the Vision API response
    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

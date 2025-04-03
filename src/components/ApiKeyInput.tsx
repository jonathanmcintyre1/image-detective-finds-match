
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Loader2 } from 'lucide-react';

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
  isProcessing?: boolean;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySubmit, isProcessing = false }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  
  // Check local storage for previously saved key
  React.useEffect(() => {
    const savedKey = localStorage.getItem('google_vision_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setSubmitted(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('google_vision_api_key', apiKey);
      setSubmitted(true);
      onApiKeySubmit(apiKey);
    }
  };

  const handleReset = () => {
    setApiKey('');
    setSubmitted(false);
    localStorage.removeItem('google_vision_api_key');
  };

  return (
    <Card className="border-0 shadow-sm w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Key className="h-5 w-5 mr-2 text-brand-blue" />
          Google Vision API Key
        </CardTitle>
        <CardDescription>
          {!submitted 
            ? "Enter your API key to analyze images" 
            : "Your API key has been set"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!submitted ? (
              <>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder="Enter your Google Vision API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-20"
                    disabled={isProcessing}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7"
                    onClick={() => setShowKey(!showKey)}
                    disabled={isProcessing}
                  >
                    {showKey ? "Hide" : "Show"}
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={!apiKey.trim() || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Setting...
                      </>
                    ) : (
                      "Set API Key"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription className="text-sm">
                    API key is set and stored in your browser
                  </AlertDescription>
                </Alert>
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleReset}
                    disabled={isProcessing}
                  >
                    Reset API Key
                  </Button>
                </div>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ApiKeyInput;

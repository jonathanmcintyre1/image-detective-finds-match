
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KeyRound, Info } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, setApiKey }) => {
  const [open, setOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey || '');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Update tempApiKey if apiKey prop changes
  useEffect(() => {
    setTempApiKey(apiKey || '');
  }, [apiKey]);
  
  // Show API key dialog automatically if not set
  useEffect(() => {
    if (!apiKey) {
      setOpen(true);
      console.log("API key not set, showing dialog");
    } else {
      console.log("API key is set:", apiKey.substring(0, 5) + "...");
    }
  }, [apiKey]);

  const handleSave = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      localStorage.setItem('gcv_api_key', tempApiKey.trim());
      console.log("API Key saved:", tempApiKey.substring(0, 5) + "...");
      toast.success("API key saved successfully", {
        description: "Your Google Cloud Vision API key has been saved"
      });
      setOpen(false);
    } else {
      toast.error("Please enter a valid API key");
    }
  };
  
  const handleClearApiKey = () => {
    setTempApiKey('');
    setApiKey('');
    localStorage.removeItem('gcv_api_key');
    toast.success("API key removed", {
      description: "Your Google Cloud Vision API key has been removed"
    });
    setShowConfirmDialog(false);
    // Reopen the set API key dialog
    setTimeout(() => setOpen(true), 500);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1"
      >
        <KeyRound className="h-4 w-4 mr-1" />
        {apiKey ? 'Change API Key' : 'Set API Key'}
      </Button>

      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Google Cloud Vision API Key</DialogTitle>
              <DialogDescription>
                Enter your Google Cloud Vision API key to use the image detection features.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-start space-x-2 rounded-md bg-muted/50 p-3">
                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>To get an API key:</p>
                  <ol className="list-decimal ml-4 space-y-1 mt-1">
                    <li>Go to the Google Cloud Console</li>
                    <li>Create or select a project</li>
                    <li>Enable the Vision API</li>
                    <li>Create an API key with Vision API access</li>
                  </ol>
                  <a 
                    href="https://cloud.google.com/vision/docs/setup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Learn more about setting up Google Cloud Vision
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="api-key" className="text-sm font-medium">
                  API Key
                </label>
                <Input
                  id="api-key"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="Enter your Google Cloud Vision API key"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Your API key is stored locally in your browser and is not sent to our servers.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              {apiKey && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmDialog(true)}
                  className="mr-auto"
                >
                  Remove API Key
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={!tempApiKey.trim()}
              >
                Save API Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Confirmation dialog for removing API key */}
      {showConfirmDialog && (
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove API Key?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove your Google Cloud Vision API key. You'll need to enter it again to use the image detection features.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearApiKey}>Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default ApiKeyInput;


import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KeyRound, Info, LockIcon } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
}

const STORAGE_KEY = 'gcv_api_key';
const STORAGE_PREFERENCE_KEY = 'gcv_api_key_storage_preference';

// Types of storage available
enum StorageType {
  SESSION = 'session',
  LOCAL = 'local',
  NONE = 'none'
}

const ApiKeyInput = ({ apiKey, setApiKey }: ApiKeyInputProps) => {
  const [open, setOpen] = useState(!apiKey); // Open dialog if no API key is set
  const [tempApiKey, setTempApiKey] = useState(apiKey || '');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [storageType, setStorageType] = useState<StorageType>(() => {
    // Try to get the saved preference, default to SESSION for better security
    const savedPreference = localStorage.getItem(STORAGE_PREFERENCE_KEY);
    return (savedPreference as StorageType) || StorageType.SESSION;
  });
  const [showKey, setShowKey] = useState(false);

  // Helper to get the appropriate storage based on user preference
  const getStorage = (type: StorageType) => {
    switch (type) {
      case StorageType.SESSION:
        return sessionStorage;
      case StorageType.LOCAL:
        return localStorage;
      case StorageType.NONE:
      default:
        return null;
    }
  };
  
  // Show API key dialog automatically if not set
  useEffect(() => {
    // Try to load API key from the selected storage
    if (!apiKey) {
      const storage = getStorage(storageType);
      if (storage) {
        const savedKey = storage.getItem(STORAGE_KEY);
        if (savedKey) {
          setApiKey(savedKey);
          setTempApiKey(savedKey);
          console.log("API key loaded from storage:", savedKey.substring(0, 5) + "...");
          return;
        }
      }
      
      setOpen(true);
      console.log("API key not set, showing dialog");
    } else {
      console.log("API key is set:", apiKey.substring(0, 5) + "...");
    }
  }, [apiKey, setApiKey, storageType]);

  const handleSave = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      
      // Save the storage preference
      localStorage.setItem(STORAGE_PREFERENCE_KEY, storageType);
      
      // Save the API key according to user preference
      const storage = getStorage(storageType);
      if (storage) {
        storage.setItem(STORAGE_KEY, tempApiKey.trim());
        console.log(`API Key saved in ${storageType} storage:`, tempApiKey.substring(0, 5) + "...");
      } else {
        console.log("API Key not saved to any storage (in-memory only)");
      }
      
      toast.success("API key saved successfully", {
        description: `Your Google Cloud Vision API key has been saved${storageType !== StorageType.NONE ? ` in ${storageType} storage` : ''}`
      });
      setOpen(false);
    } else {
      toast.error("Please enter a valid API key");
    }
  };
  
  const handleClearApiKey = () => {
    setTempApiKey('');
    setApiKey('');
    
    // Remove from all storage types to be safe
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    
    toast.success("API key removed", {
      description: "Your Google Cloud Vision API key has been removed"
    });
    setShowConfirmDialog(false);
    // Reopen the set API key dialog
    setTimeout(() => setOpen(true), 500);
  };

  const handleStorageChange = (type: StorageType) => {
    setStorageType(type);
    localStorage.setItem(STORAGE_PREFERENCE_KEY, type);
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
              <div className="flex justify-between items-center">
                <label htmlFor="api-key" className="text-sm font-medium">
                  API Key
                </label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowKey(!showKey)}
                  className="h-7 px-2"
                >
                  {showKey ? 'Hide' : 'Show'}
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="api-key"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="Enter your Google Cloud Vision API key"
                  type={showKey ? 'text' : 'password'}
                  className="w-full pr-9"
                />
                <LockIcon className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="text-sm font-medium">Storage Preference</div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="session-storage">Session Storage</Label>
                    <p className="text-xs text-muted-foreground">
                      Saved until browser is closed (recommended)
                    </p>
                  </div>
                  <Switch 
                    id="session-storage"
                    checked={storageType === StorageType.SESSION}
                    onCheckedChange={() => handleStorageChange(StorageType.SESSION)}
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="local-storage">Local Storage</Label>
                    <p className="text-xs text-muted-foreground">
                      Saved permanently (less secure)
                    </p>
                  </div>
                  <Switch 
                    id="local-storage"
                    checked={storageType === StorageType.LOCAL}
                    onCheckedChange={() => handleStorageChange(StorageType.LOCAL)}
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="no-storage">In-Memory Only</Label>
                    <p className="text-xs text-muted-foreground">
                      Not saved between page refreshes (most secure)
                    </p>
                  </div>
                  <Switch 
                    id="no-storage"
                    checked={storageType === StorageType.NONE}
                    onCheckedChange={() => handleStorageChange(StorageType.NONE)}
                  />
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                Your API key is {storageType !== StorageType.NONE ? 'stored locally in your browser' : 'not stored persistently'} and is not sent to our servers.
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
      
      {/* Confirmation dialog for removing API key */}
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
    </>
  );
};

export default ApiKeyInput;

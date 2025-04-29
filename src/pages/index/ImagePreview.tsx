
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ImagePreviewProps {
  previewUrl: string | null;
  imageError: boolean;
  handleImageError: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ previewUrl, imageError, handleImageError }) => {
  if (!previewUrl) return null;
  
  return (
    <div className="mt-4 md:mt-6">
      <p className="text-xs md:text-sm font-medium mb-2 text-brand-dark">Image Preview:</p>
      <div className="border rounded-lg overflow-hidden shadow-sm bg-gray-100">
        {imageError ? (
          <div className="aspect-video flex items-center justify-center bg-gray-100 p-3 md:p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs md:text-sm">
                Unable to load image preview
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="p-3 md:p-4 flex justify-center items-center bg-gray-50 max-h-40 md:max-h-60">
            <img 
              src={previewUrl}
              alt="Preview"
              className="max-h-36 md:max-h-52 max-w-full object-contain"
              onError={handleImageError}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreview;

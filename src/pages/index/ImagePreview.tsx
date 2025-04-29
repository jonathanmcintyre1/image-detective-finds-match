
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Globe, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getHostname, getWebsiteName } from '@/utils/domainUtils';
import { format } from 'date-fns';

interface ImagePreviewProps {
  previewUrl: string | null;
  imageError: boolean;
  handleImageError: () => void;
  metadata?: {
    domain?: string;
    pageUrl?: string;
    pageTitle?: string;
    dateFound?: Date;
  };
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  previewUrl, 
  imageError, 
  handleImageError, 
  metadata 
}) => {
  if (!previewUrl) return null;
  
  const showMetadata = metadata && (metadata.domain || metadata.pageUrl || metadata.pageTitle);
  const domain = metadata?.domain || (metadata?.pageUrl ? getHostname(metadata.pageUrl) : null);
  const siteName = domain ? getWebsiteName(domain) : null;
  
  return (
    <div className="mt-4 md:mt-6">
      <p className="text-xs md:text-sm font-medium mb-2 text-brand-dark">Image Preview:</p>
      <div className="border rounded-lg overflow-hidden shadow-sm">
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
          <>
            <div className="p-3 md:p-4 flex justify-center items-center bg-gray-50 max-h-40 md:max-h-60">
              <img 
                src={previewUrl}
                alt="Preview"
                className="max-h-36 md:max-h-52 max-w-full object-contain"
                onError={handleImageError}
              />
            </div>
            
            {showMetadata && (
              <div className="border-t p-2 md:p-3 bg-gray-50">
                {siteName && (
                  <div className="flex items-center mb-1">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                    <span className="text-xs font-medium">{siteName}</span>
                    {domain && <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0">{domain}</Badge>}
                  </div>
                )}
                
                {metadata.pageTitle && (
                  <div className="text-xs text-muted-foreground mb-1 truncate" title={metadata.pageTitle}>
                    {metadata.pageTitle}
                  </div>
                )}
                
                {metadata.pageUrl && (
                  <div className="text-xs text-brand-blue truncate hover:underline">
                    <a href={metadata.pageUrl} target="_blank" rel="noopener noreferrer">
                      {metadata.pageUrl}
                    </a>
                  </div>
                )}
                
                {metadata.dateFound && (
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{format(metadata.dateFound, 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ImagePreview;

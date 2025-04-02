
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  sourceUrl?: string;
  siteName?: string;
  confidence?: number;
}

const ImageModal: React.FC<ImageModalProps> = ({
  open,
  onOpenChange,
  imageUrl,
  sourceUrl,
  siteName,
  confidence
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Image Details</span>
            {confidence && (
              <Badge className={`${confidence >= 0.9 ? 'bg-brand-red' : 'bg-amber-500'} text-white`}>
                {Math.round(confidence * 100)}% Match
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-auto">
          <div className="relative rounded-md overflow-hidden bg-gray-100 flex justify-center">
            <img
              src={imageUrl}
              alt="Matched image"
              className="max-h-[60vh] object-contain"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
                e.currentTarget.classList.add('p-8');
              }}
            />
          </div>
        </div>
        <DialogFooter className="flex sm:justify-between items-center">
          <div>
            {siteName && <p className="text-sm font-medium">Source: {siteName}</p>}
          </div>
          <div className="flex space-x-2">
            {sourceUrl && (
              <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Visit Source
                </a>
              </Button>
            )}
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;

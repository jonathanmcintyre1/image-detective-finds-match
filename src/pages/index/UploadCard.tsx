
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ImageIcon } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import ImagePreview from './ImagePreview';

interface UploadCardProps {
  onImageSelected: (image: File | string) => void;
  isProcessing: boolean;
  previewUrl: string | null;
  imageError: boolean;
  handleImageError: () => void;
}

const UploadCard: React.FC<UploadCardProps> = ({ 
  onImageSelected, 
  isProcessing, 
  previewUrl, 
  imageError, 
  handleImageError 
}) => {
  return (
    <Card className="border-0 shadow-md overflow-hidden w-full h-full" data-upload-section>
      <CardHeader className="card-gradient-dark text-white p-4">
        <div className="flex items-center">
          <ImageIcon className="mr-2 h-5 w-5" />
          <CardTitle className="text-xl md:text-2xl font-semibold leading-none tracking-tight">Upload Image</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <ImageUploader onImageSelected={onImageSelected} isProcessing={isProcessing} maxMb={15} />
        
        <ImagePreview 
          previewUrl={previewUrl}
          imageError={imageError}
          handleImageError={handleImageError}
        />
      </CardContent>
    </Card>
  );
};

export default UploadCard;


import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ImageUploaderProps {
  onImageSelected: (image: File | string) => void;
  isProcessing: boolean;
}

const ImageUploader = ({ onImageSelected, isProcessing }: ImageUploaderProps) => {
  const [imageUrl, setImageUrl] = useState('');
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type.startsWith('image/')) {
        onImageSelected(file);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Please upload a valid image file');
      }
    }
  }, [onImageSelected]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    disabled: isProcessing
  });
  
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      onImageSelected(imageUrl);
      toast.success('Image URL submitted');
    } else {
      toast.error('Please enter a valid URL');
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'dropzone-active' : 'border-muted-foreground/30 hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        <div className="text-center space-y-4">
          <div className="mx-auto bg-primary/10 p-4 rounded-full">
            <Upload className="h-8 w-8 text-primary mx-auto" />
          </div>
          <div>
            <p className="font-medium text-lg">Drag & drop image here</p>
            <p className="text-sm text-muted-foreground">or click to browse files</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Supports JPG, PNG, WEBP (max 5MB)
          </p>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground mx-auto inline-block px-8 relative before:absolute before:left-0 before:top-1/2 before:h-[1px] before:w-6 before:bg-muted-foreground/30 after:absolute after:right-0 after:top-1/2 after:h-[1px] after:w-6 after:bg-muted-foreground/30">
          OR
        </p>
      </div>
      
      <form onSubmit={handleUrlSubmit} className="flex space-x-2">
        <Input
          type="url"
          placeholder="Enter image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="flex-1"
          disabled={isProcessing}
        />
        <Button 
          type="submit"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default ImageUploader;

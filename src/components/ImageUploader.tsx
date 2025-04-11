
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageUploaderProps {
  onImageSelected: (image: File | string) => void;
  isProcessing: boolean;
}

const ImageUploader = ({ onImageSelected, isProcessing }: ImageUploaderProps) => {
  const [imageUrl, setImageUrl] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [rejectedFile, setRejectedFile] = useState<boolean>(false);
  
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setFileError(null);
    setRejectedFile(false);
    
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles[0].errors;
      if (errors.find((e: any) => e.code === 'file-too-large')) {
        setFileError('File is too large. Maximum size is 5MB.');
        setRejectedFile(true);
        toast.error('File is too large', { description: 'Maximum size is 5MB' });
      } else if (errors.find((e: any) => e.code === 'file-invalid-type')) {
        setFileError('Please upload a valid image file (JPG, PNG, WEBP).');
        setRejectedFile(true);
        toast.error('Invalid file type', { description: 'Please upload a valid image file (JPG, PNG, WEBP)' });
      }
      return;
    }
    
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > MAX_FILE_SIZE) {
        setFileError('File is too large. Maximum size is 5MB.');
        setRejectedFile(true);
        toast.error('File is too large', { description: 'Maximum size is 5MB' });
        return;
      }
      
      if (file.type.startsWith('image/')) {
        setFileError(null);
        onImageSelected(file);
        toast.success('Image uploaded successfully');
      } else {
        setFileError('Please upload a valid image file.');
        setRejectedFile(true);
        toast.error('Invalid file type', { description: 'Please upload a valid image file' });
      }
    }
  }, [onImageSelected]);
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxSize: MAX_FILE_SIZE,
    disabled: isProcessing
  });
  
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);
    
    if (imageUrl.trim()) {
      // Basic URL validation
      try {
        new URL(imageUrl);
        onImageSelected(imageUrl);
        toast.success('Image URL submitted');
      } catch (e) {
        setFileError('Please enter a valid URL.');
        toast.error('Invalid URL', { description: 'Please enter a valid URL' });
      }
    } else {
      setFileError('Please enter a valid URL.');
      toast.error('Invalid URL', { description: 'Please enter a URL' });
    }
  };
  
  const getDropzoneClass = () => {
    let className = "dropzone border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer ";
    
    if (isDragActive && !isDragReject) {
      className += "border-[#CC121E] bg-[#CC121E]/5 ";
    } else if (isDragReject || rejectedFile) {
      className += "border-red-500 bg-red-50 ";
    } else if (isProcessing) {
      className += "border-gray-300 bg-gray-50 cursor-not-allowed ";
    } else {
      className += "border-gray-300 hover:border-[#CC121E]/50 ";
    }
    
    return className;
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div 
        {...getRootProps()} 
        className={getDropzoneClass()}
      >
        <input {...getInputProps()} />
        <div className="text-center space-y-4">
          {isProcessing ? (
            <div className="mx-auto bg-gray-100 p-4 rounded-full">
              <Loader2 className="h-8 w-8 text-gray-600 mx-auto animate-spin" />
            </div>
          ) : rejectedFile || isDragReject ? (
            <div className="mx-auto bg-red-100 p-4 rounded-full">
              <XCircle className="h-8 w-8 text-red-500 mx-auto" />
            </div>
          ) : (
            <div className="mx-auto bg-gray-100 p-4 rounded-full">
              <Upload className="h-8 w-8 text-gray-600 mx-auto" />
            </div>
          )}
          
          <div>
            {isProcessing ? (
              <p className="font-medium text-lg">Processing image...</p>
            ) : rejectedFile || isDragReject ? (
              <p className="font-medium text-lg text-red-500">File not accepted</p>
            ) : (
              <>
                <p className="font-medium text-lg">Drag & drop image here</p>
                <p className="text-sm text-muted-foreground">or click to browse files</p>
              </>
            )}
          </div>
          
          {fileError && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm">{fileError}</AlertDescription>
            </Alert>
          )}
          
          {!fileError && (
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, WEBP (max 5MB)
            </p>
          )}
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
          className="bg-[#CC121E] hover:bg-[#CC121E]/90"
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

import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  propertyId: string;
  onUploadComplete: () => void;
}

export function ImageUpload({ propertyId, onUploadComplete }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${propertyId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        if (!data.publicUrl) throw new Error('Failed to get public URL');

        // Insert into property_media with the complete public URL
        const { error: mediaError } = await supabase
          .from('property_media')
          .insert([
            {
              property_id: propertyId,
              url: data.publicUrl, // Store the complete public URL
              type: 'image'
            }
          ]);

        if (mediaError) throw mediaError;
      }
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  }, [propertyId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: true
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center space-y-2">
        {uploading ? (
          <div className="animate-pulse">
            <Upload className="w-12 h-12 text-gray-400" />
            <p className="text-sm text-gray-500">Uploading...</p>
          </div>
        ) : (
          <>
            <ImageIcon className="w-12 h-12 text-gray-400" />
            <p className="text-sm text-gray-500">
              {isDragActive
                ? 'Drop the images here...'
                : 'Drag & drop images here, or click to select'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
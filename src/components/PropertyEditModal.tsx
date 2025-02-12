import React, { useState } from 'react';
import { X, Trash2, Upload, Video } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { ImageGallery } from './ImageGallery';
import { supabase } from '../lib/supabase';
import type { Property, PropertyMedia } from '../types';

interface PropertyEditModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function PropertyEditModal({ property, isOpen, onClose, onUpdate }: PropertyEditModalProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<PropertyMedia[]>(property.property_media || []);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleDeleteMedia = async (mediaId: string, url: string) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;

    try {
      // Delete from storage first
      const filePath = url.split('/').pop(); // Get filename from URL
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('property-images')
          .remove([`${property.id}/${filePath}`]);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('property_media')
        .delete()
        .eq('id', mediaId);

      if (dbError) throw dbError;

      setSelectedMedia(selectedMedia.filter(m => m.id !== mediaId));
      onUpdate();
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${property.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      if (!data.publicUrl) throw new Error('Failed to get public URL');

      const { error: mediaError } = await supabase
        .from('property_media')
        .insert([
          {
            property_id: property.id,
            url: data.publicUrl,
            type: 'video'
          }
        ]);

      if (mediaError) throw mediaError;
      onUpdate();
    } catch (error) {
      console.error('Error uploading video:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">Edit Property Media</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage images and videos for {property.title}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {selectedMedia.map((media) => (
              <div key={media.id} className="relative group">
                {media.type === 'image' ? (
                  <img
                    src={media.url}
                    alt="Property"
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => setShowGallery(true)}
                  />
                ) : (
                  <video
                    src={media.url}
                    className="w-full h-48 object-cover rounded-lg"
                    controls
                  />
                )}
                <button
                  onClick={() => handleDeleteMedia(media.id, media.url)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Add Images</h4>
              <ImageUpload
                propertyId={property.id}
                onUploadComplete={() => {
                  onUpdate();
                }}
              />
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Add Video</h4>
              <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoUpload}
                  disabled={uploading}
                />
                <Video className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  {uploading ? 'Uploading...' : 'Click to upload video'}
                </span>
              </label>
            </div>
          </div>

          {showGallery && (
            <ImageGallery
              images={selectedMedia.filter(m => m.type === 'image')}
              isOpen={showGallery}
              onClose={() => setShowGallery(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
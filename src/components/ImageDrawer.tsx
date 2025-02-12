import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PropertyMedia } from '../types';

interface ImageDrawerProps {
  media: PropertyMedia[];
  isOpen: boolean;
  onClose: () => void;
}

export function ImageDrawer({ media, isOpen, onClose }: ImageDrawerProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const images = media.filter(m => m.type === 'image');

  if (!isOpen) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center px-16">
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 text-white hover:text-gray-300 transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 text-white hover:text-gray-300 transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        <div className="w-full h-full flex items-center justify-center">
          {images[currentIndex]?.url ? (
            <img
              src={images[currentIndex].url}
              alt={`Image ${currentIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          ) : (
            <div className="flex items-center justify-center text-white">
              No image available
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white w-4' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, Search as SearchIcon, Star, Eye } from 'lucide-react';
import { PropertyEditModal } from '../components/PropertyEditModal';
import { ImageDrawer } from '../components/ImageDrawer';
import { UserMenu } from '../components/UserMenu';
import { useNavigate } from 'react-router-dom';
import type { Property } from '../types';

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'views-desc' | 'rating-desc';

export function ClientProfile() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageDrawer, setShowImageDrawer] = useState(false);

  useEffect(() => {
    loadProperties();
  }, [sortBy]);

  const loadProperties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('properties')
        .select(`
          *,
          property_media (
            id,
            url,
            type
          ),
          property_ratings (
            rating
          )
        `)
        .eq('client_id', user.id)
        .eq('is_deleted', false);

      switch (sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'views-desc':
          query = query.order('views', { ascending: false });
          break;
        case 'rating-desc':
          query = query.order('average_rating', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      setProperties(data || []);
    } catch (err) {
      setError('Failed to load properties');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_deleted: true })
        .eq('id', propertyId);

      if (error) throw error;
      loadProperties();
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Failed to delete property');
    }
  };

  const handleImageUpload = async (propertyId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${propertyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      if (!data.publicUrl) throw new Error('Failed to get public URL');

      const { error: mediaError } = await supabase
        .from('property_media')
        .insert([
          {
            property_id: propertyId,
            url: data.publicUrl,
            type: 'image'
          }
        ]);

      if (mediaError) throw mediaError;
      
      await loadProperties();
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    }
  };

  const filteredProperties = properties.filter(property =>
    property.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by title..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="relevance">Sort by: Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="views-desc">Most Viewed</option>
            <option value="rating-desc">Highest Rated</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div 
            onClick={() => navigate('/client/property/add')}
            className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 group"
          >
            <div className="h-64 bg-gray-50 flex items-center justify-center">
              <Plus className="w-12 h-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Add New Property</h3>
              <p className="text-gray-600 mb-4">Click to list a new property</p>
              <div className="h-[120px]" /> {/* Spacer to match other cards */}
            </div>
          </div>

          {filteredProperties.map((property) => (
            <div key={property.id} className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
              <div className="relative group">
                {property.property_media && property.property_media.length > 0 ? (
                  <div 
                    className="w-full h-64 cursor-pointer"
                    onClick={() => {
                      setSelectedProperty(property);
                      setShowImageDrawer(true);
                    }}
                  >
                    <img
                      src={property.property_media[0].url}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-full h-64 bg-gray-200 flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      setSelectedProperty(property);
                      setShowEditModal(true);
                    }}
                  >
                    <p className="text-gray-500">Click to add images</p>
                  </div>
                )}
                {property.property_media && property.property_media.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm">
                    +{property.property_media.length - 1} more
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{property.title}</h3>
                <p className="text-gray-600 mb-4">{property.location}</p>
                <p className="text-3xl font-bold text-blue-600 mb-4">
                  ${property.price.toLocaleString()}
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-500 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="font-semibold">{property.bedrooms}</p>
                    <p>Beds</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="font-semibold">{property.bathrooms}</p>
                    <p>Baths</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="font-semibold">{property.area}</p>
                    <p>Sq Ft</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Eye className="h-4 w-4 mr-1" />
                    <span>{property.views || 0} views</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Star className="h-4 w-4 mr-1 text-yellow-400" />
                    <span>{property.average_rating?.toFixed(1) || 'No ratings'}</span>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button 
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    onClick={() => {
                      setSelectedProperty(property);
                      setShowEditModal(true);
                    }}
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button 
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    onClick={() => handleDelete(property.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedProperty && showEditModal && (
          <PropertyEditModal
            property={selectedProperty}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedProperty(null);
            }}
            onUpdate={() => {
              loadProperties();
            }}
          />
        )}

        {selectedProperty && showImageDrawer && selectedProperty.property_media && (
          <ImageDrawer
            media={selectedProperty.property_media}
            isOpen={showImageDrawer}
            onClose={() => {
              setShowImageDrawer(false);
              setSelectedProperty(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
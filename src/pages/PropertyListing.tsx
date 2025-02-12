import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, MapPin, Bed, Bath, Square, Phone, Mail, Star, Eye, X } from 'lucide-react';
import type { Property } from '../types';

interface PropertyOwner {
  full_name: string;
  email: string;
  phone: string;
  company_name?: string;
}

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'views-desc' | 'rating-desc';

export function PropertyListing() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyOwner, setPropertyOwner] = useState<PropertyOwner | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  useEffect(() => {
    loadProperties();
  }, [sortBy]);

  const loadProperties = async () => {
    try {
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
        .eq('is_deleted', false); // Only show non-deleted properties

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

  const handlePropertyClick = async (property: Property) => {
    try {
      // Increment views
      const { error: viewError } = await supabase
        .from('properties')
        .update({ views: (property.views || 0) + 1 })
        .eq('id', property.id);

      if (viewError) throw viewError;

      // Load owner details
      const { data: ownerData, error: ownerError } = await supabase
        .from('clients')
        .select('full_name, email, phone, company_name')
        .eq('id', property.client_id)
        .single();

      if (ownerError) throw ownerError;

      // Load user's rating if exists
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: ratingData } = await supabase
          .from('property_ratings')
          .select('rating')
          .eq('property_id', property.id)
          .eq('customer_id', user.id)
          .single();

        setUserRating(ratingData?.rating || null);
      }

      setPropertyOwner(ownerData);
      setSelectedProperty(property);
      setShowContactModal(true);
      
      // Refresh properties to update view count
      loadProperties();
    } catch (err) {
      console.error('Error loading property details:', err);
    }
  };

  const handleRating = async (rating: number) => {
    if (!selectedProperty) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('property_ratings')
        .upsert({
          property_id: selectedProperty.id,
          customer_id: user.id,
          rating
        });

      if (error) throw error;

      setUserRating(rating);
      loadProperties();
    } catch (err) {
      console.error('Error rating property:', err);
    }
  };

  const filteredProperties = properties.filter(property =>
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Your Dream Property</h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search properties by location, title, or description..."
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
        </div>

        {error && (
          <div className="mb-4 bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <div 
              key={property.id} 
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer transform hover:scale-105 transition-transform"
              onClick={() => handlePropertyClick(property)}
            >
              <div className="relative h-48">
                {property.property_media?.[0] ? (
                  <img
                    src={property.property_media[0].url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">No image available</p>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-white text-xl font-semibold">${property.price.toLocaleString()}</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>
                <div className="flex items-center text-gray-500 mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{property.location}</span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{property.description}</p>
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
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    <span>{property.bedrooms} beds</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    <span>{property.bathrooms} baths</span>
                  </div>
                  <div className="flex items-center">
                    <Square className="h-4 w-4 mr-1" />
                    <span>{property.area} sq ft</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showContactModal && propertyOwner && selectedProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Contact Property Owner</h3>
                <button 
                  onClick={() => {
                    setShowContactModal(false);
                    setSelectedProperty(null);
                    setUserRating(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{propertyOwner.full_name}</h4>
                  {propertyOwner.company_name && (
                    <p className="text-sm text-gray-500">{propertyOwner.company_name}</p>
                  )}
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Mail className="w-5 h-5 mr-2" />
                  <a href={`mailto:${propertyOwner.email}`} className="text-blue-600 hover:underline">
                    {propertyOwner.email}
                  </a>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Phone className="w-5 h-5 mr-2" />
                  <a href={`tel:${propertyOwner.phone}`} className="text-blue-600 hover:underline">
                    {propertyOwner.phone}
                  </a>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Rate this property:</p>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onMouseEnter={() => setHoveredRating(rating)}
                        onMouseLeave={() => setHoveredRating(null)}
                        onClick={() => handleRating(rating)}
                        className="p-1"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            rating <= (hoveredRating || userRating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
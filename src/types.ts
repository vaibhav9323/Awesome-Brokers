export interface Property {
  id: string;
  client_id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  views: number;
  average_rating: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  property_media?: {
    id: string;
    url: string;
    type: 'image' | 'video';
  }[];
}

export type UserRole = 'client' | 'customer';

export interface PropertyMedia {
  id: string;
  property_id: string;
  url: string;
  type: 'image' | 'video';
  created_at: string;
}
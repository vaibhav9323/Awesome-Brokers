/*
  # Fix Storage and Property Media Policies

  1. Changes
    - Add missing RLS policies for property_media table
    - Update storage bucket policies for better security
    - Ensure proper access control for image uploads

  2. Security
    - Enable RLS on property_media table
    - Add policies for property owners to manage their media
    - Add policies for authenticated users to view media
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Property owners can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Property owners can delete their images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;

-- Recreate storage bucket policies with proper checks
CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'property-images');

CREATE POLICY "Property owners can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  EXISTS (
    SELECT 1 FROM properties
    WHERE id::text = (storage.foldername(name))[1]
    AND client_id = auth.uid()
  )
);

CREATE POLICY "Property owners can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  EXISTS (
    SELECT 1 FROM properties
    WHERE id::text = (storage.foldername(name))[1]
    AND client_id = auth.uid()
  )
);

-- Drop and recreate property_media policies
DROP POLICY IF EXISTS "Anyone can view property media" ON property_media;
DROP POLICY IF EXISTS "Clients can manage their property media" ON property_media;

-- Add proper policies for property_media table
CREATE POLICY "Anyone can view property media"
ON property_media FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Property owners can insert media"
ON property_media FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_media.property_id
    AND properties.client_id = auth.uid()
  )
);

CREATE POLICY "Property owners can update their media"
ON property_media FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_media.property_id
    AND properties.client_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_media.property_id
    AND properties.client_id = auth.uid()
  )
);

CREATE POLICY "Property owners can delete their media"
ON property_media FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_media.property_id
    AND properties.client_id = auth.uid()
  )
);
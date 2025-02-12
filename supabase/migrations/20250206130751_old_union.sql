/*
  # Add Storage Policies for Property Images

  1. Changes
    - Create storage bucket for property images if it doesn't exist
    - Add RLS policies for property images bucket:
      - Allow authenticated users to read all images
      - Allow property owners to upload images
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view all property images
CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'property-images');

-- Policy to allow property owners to upload images
CREATE POLICY "Property owners can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM properties
    WHERE client_id = auth.uid()
  )
);

-- Policy to allow property owners to delete their images
CREATE POLICY "Property owners can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM properties
    WHERE client_id = auth.uid()
  )
);
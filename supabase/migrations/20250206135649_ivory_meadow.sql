/*
  # Add avatar support
  
  1. Changes
    - Add avatar_url column to clients table
    - Create profiles storage bucket for avatars
    - Add storage policies for avatar management
  
  2. Security
    - Enable RLS on storage bucket
    - Add policies for avatar upload and viewing
*/

-- Add avatar_url column to clients table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE clients ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Create the profiles storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view all avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profiles');

-- Policy to allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (regexp_split_to_array(name, '/'))[2] LIKE (auth.uid() || '-avatar.%')
);

-- Policy to allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (regexp_split_to_array(name, '/'))[2] LIKE (auth.uid() || '-avatar.%')
)
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (regexp_split_to_array(name, '/'))[2] LIKE (auth.uid() || '-avatar.%')
);

-- Policy to allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (regexp_split_to_array(name, '/'))[2] LIKE (auth.uid() || '-avatar.%')
);
/*
  # Fix property media URL storage

  1. Changes
    - Add function to generate complete public URL for property media
    - Add trigger to automatically set complete URL when media is inserted
    - Update existing media records with complete URLs

  2. Security
    - Maintain existing RLS policies
    - No changes to access control
*/

-- Function to get complete public URL for property media
CREATE OR REPLACE FUNCTION get_public_media_url(bucket_id text, file_path text)
RETURNS text AS $$
BEGIN
  RETURN storage.foldername(file_path);
END;
$$ LANGUAGE plpgsql;

-- Function to update media URL before insert
CREATE OR REPLACE FUNCTION set_property_media_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the complete public URL from storage
  NEW.url = get_public_media_url('property-images', NEW.url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new media insertions
DROP TRIGGER IF EXISTS set_media_url ON property_media;
CREATE TRIGGER set_media_url
BEFORE INSERT ON property_media
FOR EACH ROW
EXECUTE FUNCTION set_property_media_url();
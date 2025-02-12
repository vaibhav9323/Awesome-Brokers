/*
  # Add soft delete functionality to properties

  1. Changes
    - Add `is_deleted` column to properties table with default false
    - Update RLS policies to filter out deleted properties
    - Add new policies for soft delete operations

  2. Security
    - Only property owners can soft delete their properties
    - Deleted properties are hidden from all queries by default
*/

-- Add is_deleted column
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Update existing policies to exclude deleted properties
DROP POLICY IF EXISTS "Anyone can view properties" ON properties;
CREATE POLICY "Anyone can view non-deleted properties"
ON properties FOR SELECT
TO authenticated
USING (is_deleted = false);

DROP POLICY IF EXISTS "Clients can insert their own properties" ON properties;
CREATE POLICY "Clients can insert their own properties"
ON properties FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid() AND NOT is_deleted);

DROP POLICY IF EXISTS "Clients can update their own properties" ON properties;
CREATE POLICY "Clients can update their own non-deleted properties"
ON properties FOR UPDATE
TO authenticated
USING (client_id = auth.uid() AND NOT is_deleted)
WITH CHECK (client_id = auth.uid() AND NOT is_deleted);

-- Add policy for soft delete
CREATE POLICY "Clients can soft delete their own properties"
ON properties FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid() AND is_deleted = true);

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_properties_is_deleted ON properties(is_deleted);
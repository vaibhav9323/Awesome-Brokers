/*
  # Fix soft delete functionality for properties

  1. Changes
    - Add `is_deleted` column to properties table
    - Update RLS policies to handle soft deletion properly
    - Add index for better performance

  2. Security
    - Property owners can soft delete their properties
    - Deleted properties are hidden from general queries
    - Only property owners can see their deleted properties
*/

-- Add is_deleted column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE properties ADD COLUMN is_deleted boolean DEFAULT false;
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view properties" ON properties;
DROP POLICY IF EXISTS "Anyone can view non-deleted properties" ON properties;
DROP POLICY IF EXISTS "Clients can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Clients can update their own properties" ON properties;
DROP POLICY IF EXISTS "Clients can update their own non-deleted properties" ON properties;
DROP POLICY IF EXISTS "Clients can soft delete their own properties" ON properties;

-- Create new policies with proper soft delete handling
CREATE POLICY "View non-deleted properties"
ON properties FOR SELECT
TO authenticated
USING (
  is_deleted = false OR
  (is_deleted = true AND client_id = auth.uid())
);

CREATE POLICY "Insert new properties"
ON properties FOR INSERT
TO authenticated
WITH CHECK (
  client_id = auth.uid() AND 
  NOT is_deleted
);

CREATE POLICY "Update own properties"
ON properties FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- Create index for faster filtering if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'properties' AND indexname = 'idx_properties_is_deleted'
  ) THEN
    CREATE INDEX idx_properties_is_deleted ON properties(is_deleted);
  END IF;
END $$;
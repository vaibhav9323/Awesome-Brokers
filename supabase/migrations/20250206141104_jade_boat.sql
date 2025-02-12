/*
  # Add views count and ratings functionality

  1. New Columns
    - Add `views` column to `properties` table
    - Add `average_rating` column to `properties` table

  2. New Tables
    - `property_ratings`
      - `id` (uuid, primary key)
      - `property_id` (uuid, references properties)
      - `customer_id` (uuid, references customers)
      - `rating` (integer, 1-5)
      - `created_at` (timestamp)

  3. Security
    - Enable RLS on `property_ratings` table
    - Add policies for viewing and managing ratings
*/

-- Add views and average_rating columns to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0;

-- Create property_ratings table
CREATE TABLE IF NOT EXISTS property_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, customer_id)
);

-- Enable RLS
ALTER TABLE property_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for property_ratings
CREATE POLICY "Anyone can view property ratings"
ON property_ratings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Customers can rate properties"
ON property_ratings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own ratings"
ON property_ratings FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can delete their own ratings"
ON property_ratings FOR DELETE
TO authenticated
USING (customer_id = auth.uid());

-- Function to update average rating
CREATE OR REPLACE FUNCTION update_property_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE properties
    SET average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM property_ratings
      WHERE property_id = OLD.property_id
    )
    WHERE id = OLD.property_id;
    RETURN OLD;
  ELSE
    UPDATE properties
    SET average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM property_ratings
      WHERE property_id = NEW.property_id
    )
    WHERE id = NEW.property_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update average rating
DROP TRIGGER IF EXISTS update_property_rating ON property_ratings;
CREATE TRIGGER update_property_rating
AFTER INSERT OR UPDATE OR DELETE ON property_ratings
FOR EACH ROW
EXECUTE FUNCTION update_property_average_rating();
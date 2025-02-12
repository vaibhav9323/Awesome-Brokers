/*
  # Create properties table and media

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `title` (text)
      - `description` (text)
      - `price` (numeric)
      - `location` (text)
      - `bedrooms` (integer)
      - `bathrooms` (integer)
      - `area` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `property_media`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `url` (text)
      - `type` (text) - 'image' or 'video'
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for property owners and viewers
*/

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) NOT NULL,
  title text NOT NULL,
  description text,
  price numeric NOT NULL,
  location text NOT NULL,
  bedrooms integer,
  bathrooms integer,
  area numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS property_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  type text CHECK (type IN ('image', 'video')) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;

-- Policies for properties
CREATE POLICY "Anyone can view properties" ON properties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clients can insert their own properties" ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update their own properties" ON properties
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Policies for property media
CREATE POLICY "Anyone can view property media" ON property_media
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clients can manage their property media" ON property_media
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_media.property_id
      AND properties.client_id = auth.uid()
    )
  );
/*
  # Client Authentication Schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key) - References auth.users.id
      - `full_name` (text) - Client's full name
      - `company_name` (text, optional) - Company name if applicable
      - `phone` (text) - Contact phone number
      - `created_at` (timestamp) - Account creation timestamp
      - `updated_at` (timestamp) - Last update timestamp

  2. Security
    - Enable RLS on `clients` table
    - Add policies for authenticated users to:
      - Read their own data
      - Update their own data
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  company_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own data
CREATE POLICY "Users can read own client data" ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy to allow users to update their own data
CREATE POLICY "Users can update own client data" ON clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy to allow users to insert their own data
CREATE POLICY "Users can insert own client data" ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
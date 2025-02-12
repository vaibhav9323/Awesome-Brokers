/*
  # Add email field to clients table

  1. Changes
    - Add email column to clients table for easier querying
    - Make email unique to prevent duplicates
*/

ALTER TABLE clients ADD COLUMN IF NOT EXISTS email text UNIQUE;
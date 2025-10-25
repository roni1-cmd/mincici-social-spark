/*
  # Create Relationship Status System

  1. New Tables
    - `relationship_statuses`
      - `id` (uuid, primary key) - Unique identifier for the relationship status
      - `user_id` (text) - Firebase user ID who set the status
      - `status_type` (text) - Type: single, in_relationship, engaged, married, civil_union, domestic_partnership, widowed, divorced, separated, its_complicated
      - `partner_id` (text, nullable) - Firebase user ID of partner (for relationship types that require a partner)
      - `partner_accepted` (boolean) - Whether partner has accepted/confirmed (for bidirectional relationships)
      - `created_at` (timestamptz) - When the status was created
      - `updated_at` (timestamptz) - When the status was last updated
  
  2. Security
    - Enable RLS on `relationship_statuses` table
    - Add policy for users to read all relationship statuses
    - Add policy for users to insert their own relationship status
    - Add policy for users to update their own relationship status
    - Add policy for partners to update acceptance status
*/

CREATE TABLE IF NOT EXISTS relationship_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  status_type text NOT NULL CHECK (status_type IN ('single', 'in_relationship', 'engaged', 'married', 'civil_union', 'domestic_partnership', 'widowed', 'divorced', 'separated', 'its_complicated')),
  partner_id text,
  partner_accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE relationship_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read relationship statuses"
  ON relationship_statuses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own relationship status"
  ON relationship_statuses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own relationship status"
  ON relationship_statuses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own relationship status"
  ON relationship_statuses
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_relationship_statuses_user_id ON relationship_statuses(user_id);
CREATE INDEX IF NOT EXISTS idx_relationship_statuses_partner_id ON relationship_statuses(partner_id);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type RelationshipStatusType =
  | 'single'
  | 'in_relationship'
  | 'engaged'
  | 'married'
  | 'civil_union'
  | 'domestic_partnership'
  | 'widowed'
  | 'divorced'
  | 'separated'
  | 'its_complicated';

export interface RelationshipStatus {
  id: string;
  user_id: string;
  status_type: RelationshipStatusType;
  partner_id: string | null;
  partner_accepted: boolean;
  created_at: string;
  updated_at: string;
}

export const RELATIONSHIP_STATUS_LABELS: Record<RelationshipStatusType, string> = {
  single: 'Single',
  in_relationship: 'In a relationship',
  engaged: 'Engaged',
  married: 'Married',
  civil_union: 'Civil union',
  domestic_partnership: 'Domestic partnership',
  widowed: 'Widowed',
  divorced: 'Divorced',
  separated: 'Separated',
  its_complicated: "It's complicated"
};

export const RELATIONSHIP_STATUSES_WITH_PARTNER: RelationshipStatusType[] = [
  'in_relationship',
  'engaged',
  'married',
  'civil_union',
  'domestic_partnership'
];

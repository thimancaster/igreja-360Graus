export interface FamilyLink {
  id: string;
  church_id: string;
  profile_id_1: string;
  profile_id_2: string;
  relation_type: string;
  created_at: string;
  updated_at: string;
}

export type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface VolunteerConflictCheckResult {
  has_conflict: boolean;
  has_vacation: boolean;
  family_conflict: boolean;
  family_relations: { profile_id: string; relation: string }[];
}

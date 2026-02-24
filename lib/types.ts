export interface Professor {
  id: string;
  name: string;
  department: string;
  is_approved: boolean;
  created_at: string;
}

export interface Rating {
  id: string;
  professor_id: string;
  user_fingerprint: string;
  teaching_score: number;
  proctoring_score: number;
  tags?: string[];
}

export interface ProfessorWithRating extends Professor {
  avg_teaching_score: number | null;
  avg_proctoring_score: number | null;
  top_tags?: string[];
}

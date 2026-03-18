export type CandidateStatus = "new" | "contacted" | "interviewing" | "placed" | "rejected";
export type JobStatus = "open" | "closed";
export type PlacementStatus = "pending" | "hired" | "paid";

export interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  location: string | null;
  contact_email: string | null;
  created_at: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  skills: string[];
  notes: string | null;
  status: CandidateStatus;
  created_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  location: string | null;
  salary_range: string | null;
  status: JobStatus;
  created_at: string;
}

export interface Placement {
  id: string;
  candidate_id: string;
  job_id: string;
  company_id: string;
  placement_fee: number;
  status: PlacementStatus;
  created_at: string;
}

// Supabase Database type for typed client
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          website: string | null;
          industry: string | null;
          location: string | null;
          contact_email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website?: string | null;
          industry?: string | null;
          location?: string | null;
          contact_email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website?: string | null;
          industry?: string | null;
          location?: string | null;
          contact_email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      candidates: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          location: string | null;
          skills: string[];
          notes: string | null;
          status: CandidateStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          location?: string | null;
          skills?: string[];
          notes?: string | null;
          status?: CandidateStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          location?: string | null;
          skills?: string[];
          notes?: string | null;
          status?: CandidateStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          description: string | null;
          location: string | null;
          salary_range: string | null;
          status: JobStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          description?: string | null;
          location?: string | null;
          salary_range?: string | null;
          status?: JobStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          salary_range?: string | null;
          status?: JobStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      placements: {
        Row: {
          id: string;
          candidate_id: string;
          job_id: string;
          company_id: string;
          placement_fee: number;
          status: PlacementStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          job_id: string;
          company_id: string;
          placement_fee?: number;
          status?: PlacementStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          job_id?: string;
          company_id?: string;
          placement_fee?: number;
          status?: PlacementStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "placements_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "placements_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "placements_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      candidate_status: CandidateStatus;
      job_status: JobStatus;
      placement_status: PlacementStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

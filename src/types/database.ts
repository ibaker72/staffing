export type CandidateStatus = "new" | "contacted" | "interviewing" | "placed" | "rejected";
export type JobStatus = "open" | "closed";
export type PlacementStatus = "pending" | "hired" | "paid";
export type CompanyStatus = "lead" | "active" | "inactive";
export type JobPriority = "low" | "medium" | "high";
export type EmploymentType = "full_time" | "part_time" | "contract" | "temp_to_hire";
export type PayType = "hourly" | "salary" | "per_diem";
export type OutreachStatus = "none" | "initial_contact" | "follow_up" | "in_conversation" | "nurturing" | "closed";

export interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  location: string | null;
  contact_email: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  notes: string | null;
  status: CompanyStatus;
  outreach_status: OutreachStatus;
  follow_up_date: string | null;
  last_contacted_at: string | null;
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
  source: string | null;
  years_experience: number | null;
  desired_salary: number | null;
  resume_url: string | null;
  last_contacted_at: string | null;
  outreach_status: OutreachStatus;
  follow_up_date: string | null;
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
  priority: JobPriority;
  urgency_notes: string | null;
  employment_type: EmploymentType;
  pay_type: PayType;
  created_at: string;
}

export interface Placement {
  id: string;
  candidate_id: string;
  job_id: string;
  company_id: string;
  placement_fee: number;
  status: PlacementStatus;
  hired_at: string | null;
  paid_at: string | null;
  start_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
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
          contact_name: string | null;
          contact_phone: string | null;
          notes: string | null;
          status: CompanyStatus;
          outreach_status: OutreachStatus;
          follow_up_date: string | null;
          last_contacted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website?: string | null;
          industry?: string | null;
          location?: string | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          notes?: string | null;
          status?: CompanyStatus;
          outreach_status?: OutreachStatus;
          follow_up_date?: string | null;
          last_contacted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website?: string | null;
          industry?: string | null;
          location?: string | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          notes?: string | null;
          status?: CompanyStatus;
          outreach_status?: OutreachStatus;
          follow_up_date?: string | null;
          last_contacted_at?: string | null;
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
          source: string | null;
          years_experience: number | null;
          desired_salary: number | null;
          resume_url: string | null;
          last_contacted_at: string | null;
          outreach_status: OutreachStatus;
          follow_up_date: string | null;
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
          source?: string | null;
          years_experience?: number | null;
          desired_salary?: number | null;
          resume_url?: string | null;
          last_contacted_at?: string | null;
          outreach_status?: OutreachStatus;
          follow_up_date?: string | null;
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
          source?: string | null;
          years_experience?: number | null;
          desired_salary?: number | null;
          resume_url?: string | null;
          last_contacted_at?: string | null;
          outreach_status?: OutreachStatus;
          follow_up_date?: string | null;
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
          priority: JobPriority;
          urgency_notes: string | null;
          employment_type: EmploymentType;
          pay_type: PayType;
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
          priority?: JobPriority;
          urgency_notes?: string | null;
          employment_type?: EmploymentType;
          pay_type?: PayType;
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
          priority?: JobPriority;
          urgency_notes?: string | null;
          employment_type?: EmploymentType;
          pay_type?: PayType;
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
          hired_at: string | null;
          paid_at: string | null;
          start_date: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          job_id: string;
          company_id: string;
          placement_fee?: number;
          status?: PlacementStatus;
          hired_at?: string | null;
          paid_at?: string | null;
          start_date?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          job_id?: string;
          company_id?: string;
          placement_fee?: number;
          status?: PlacementStatus;
          hired_at?: string | null;
          paid_at?: string | null;
          start_date?: string | null;
          notes?: string | null;
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
      activity_events: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          event_type: string;
          description: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          event_type: string;
          description: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          event_type?: string;
          description?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      candidate_status: CandidateStatus;
      job_status: JobStatus;
      placement_status: PlacementStatus;
      company_status: CompanyStatus;
      job_priority: JobPriority;
      employment_type: EmploymentType;
      pay_type: PayType;
      outreach_status: OutreachStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

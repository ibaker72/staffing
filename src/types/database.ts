export type CandidateStatus = "new" | "contacted" | "interviewing" | "placed" | "rejected";
export type JobStatus = "open" | "closed";
export type PlacementStatus = "pending" | "hired" | "paid";
export type CompanyStatus = "lead" | "active" | "inactive";
export type JobPriority = "low" | "medium" | "high";
export type EmploymentType = "full_time" | "part_time" | "contract" | "temp_to_hire";
export type PayType = "hourly" | "salary" | "per_diem";
export type OutreachStatus = "none" | "initial_contact" | "follow_up" | "in_conversation" | "nurturing" | "closed";
export type SubmissionStatus = "internal_review" | "submitted" | "client_review" | "interview" | "offer" | "hired" | "rejected";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type UserRole = "admin" | "recruiter" | "client";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientUser {
  id: string;
  user_id: string;
  company_id: string;
  invited_by: string | null;
  invited_at: string;
}

export interface ClientInvitation {
  id: string;
  company_id: string;
  email: string;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

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
  assigned_to: string | null;
  next_action: string | null;
  due_date: string | null;
  owner_id: string | null;
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
  assigned_to: string | null;
  next_action: string | null;
  due_date: string | null;
  owner_id: string | null;
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
  assigned_to: string | null;
  next_action: string | null;
  due_date: string | null;
  owner_id: string | null;
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
  user_id: string | null;
  created_at: string;
}

export interface CandidateSubmission {
  id: string;
  candidate_id: string;
  job_id: string;
  status: SubmissionStatus;
  submitted_at: string | null;
  client_reviewed_at: string | null;
  interview_at: string | null;
  offered_at: string | null;
  decided_at: string | null;
  internal_notes: string | null;
  client_feedback: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  entity_type: string | null;
  entity_id: string | null;
  owner_id: string | null;
  created_at: string;
}

export interface ClientPortalToken {
  id: string;
  company_id: string;
  token: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

// Supabase Database type for typed client
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      client_users: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          invited_by: string | null;
          invited_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          invited_by?: string | null;
          invited_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          invited_by?: string | null;
          invited_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_users_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      client_invitations: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          invited_by: string;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          email: string;
          invited_by: string;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          email?: string;
          invited_by?: string;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_invitations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
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
          assigned_to: string | null;
          next_action: string | null;
          due_date: string | null;
          owner_id: string | null;
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
          assigned_to?: string | null;
          next_action?: string | null;
          due_date?: string | null;
          owner_id?: string | null;
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
          assigned_to?: string | null;
          next_action?: string | null;
          due_date?: string | null;
          owner_id?: string | null;
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
          assigned_to: string | null;
          next_action: string | null;
          due_date: string | null;
          owner_id: string | null;
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
          assigned_to?: string | null;
          next_action?: string | null;
          due_date?: string | null;
          owner_id?: string | null;
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
          assigned_to?: string | null;
          next_action?: string | null;
          due_date?: string | null;
          owner_id?: string | null;
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
          assigned_to: string | null;
          next_action: string | null;
          due_date: string | null;
          owner_id: string | null;
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
          assigned_to?: string | null;
          next_action?: string | null;
          due_date?: string | null;
          owner_id?: string | null;
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
          assigned_to?: string | null;
          next_action?: string | null;
          due_date?: string | null;
          owner_id?: string | null;
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
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          event_type: string;
          description: string;
          metadata?: Record<string, unknown>;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          event_type?: string;
          description?: string;
          metadata?: Record<string, unknown>;
          user_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      candidate_submissions: {
        Row: {
          id: string;
          candidate_id: string;
          job_id: string;
          status: SubmissionStatus;
          submitted_at: string | null;
          client_reviewed_at: string | null;
          interview_at: string | null;
          offered_at: string | null;
          decided_at: string | null;
          internal_notes: string | null;
          client_feedback: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          job_id: string;
          status?: SubmissionStatus;
          submitted_at?: string | null;
          client_reviewed_at?: string | null;
          interview_at?: string | null;
          offered_at?: string | null;
          decided_at?: string | null;
          internal_notes?: string | null;
          client_feedback?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          job_id?: string;
          status?: SubmissionStatus;
          submitted_at?: string | null;
          client_reviewed_at?: string | null;
          interview_at?: string | null;
          offered_at?: string | null;
          decided_at?: string | null;
          internal_notes?: string | null;
          client_feedback?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_submissions_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "candidate_submissions_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          priority: TaskPriority;
          due_date: string | null;
          completed_at: string | null;
          entity_type: string | null;
          entity_id: string | null;
          owner_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          priority?: TaskPriority;
          due_date?: string | null;
          completed_at?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          owner_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          priority?: TaskPriority;
          due_date?: string | null;
          completed_at?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          owner_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      client_portal_tokens: {
        Row: {
          id: string;
          company_id: string;
          token: string;
          expires_at: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          token?: string;
          expires_at?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          token?: string;
          expires_at?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_portal_tokens_company_id_fkey";
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
      company_status: CompanyStatus;
      job_priority: JobPriority;
      employment_type: EmploymentType;
      pay_type: PayType;
      outreach_status: OutreachStatus;
      submission_status: SubmissionStatus;
      task_priority: TaskPriority;
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
}

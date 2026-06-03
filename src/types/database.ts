export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserType = 'freelancer' | 'client' | 'admin'
export type KycStatus = 'pending' | 'submitted' | 'approved' | 'rejected'
export type Availability = 'available' | 'busy' | 'unavailable'
export type JobStatus = 'active' | 'filled' | 'paused'
export type ProfileStatus = 'active' | 'paused'
export type SwipeDirection = 'left' | 'right' | 'super'
export type SwipeType = 'job' | 'freelancer'
export type MatchStatus = 'matched' | 'funded' | 'in_progress' | 'pending_approval' | 'completed' | 'disputed' | 'cancelled' | 'refunded'
export type MessageType = 'message' | 'system' | 'payment_funded' | 'work_submitted' | 'payment_released' | 'revision_requested' | 'dispute_opened' | 'dispute_resolved'
export type TransactionType = 'credit' | 'debit' | 'escrow_in' | 'escrow_out'

// Dispute-related types
export type DisputeReason = 'work_not_delivered' | 'work_incomplete' | 'quality_not_as_agreed' | 'deadline_missed'
export type DisputeStatus = 'pending_response' | 'pending_review' | 'resolved'
export type DisputeResolution = 'release_full' | 'refund_client' | 'split_payment' | 'final_revision'

export interface WorkSubmissionFile {
  url: string
  name: string
  type: string
  size: number
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          user_type: UserType
          avatar_url: string | null
          location: string | null
          bio: string | null
          company_name: string | null
          industry: string | null
          profession: string | null
          availability: Availability | null
          kyc_status: KycStatus
          id_type: string | null
          id_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          user_type: UserType
          avatar_url?: string | null
          location?: string | null
          bio?: string | null
          company_name?: string | null
          industry?: string | null
          profession?: string | null
          availability?: Availability | null
          kyc_status?: KycStatus
          id_type?: string | null
          id_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          user_type?: UserType
          avatar_url?: string | null
          location?: string | null
          bio?: string | null
          company_name?: string | null
          industry?: string | null
          profession?: string | null
          availability?: Availability | null
          kyc_status?: KycStatus
          id_type?: string | null
          id_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      skill_profiles: {
        Row: {
          id: string
          freelancer_id: string
          headline: string
          category: string
          skills: string[]
          bio: string | null
          availability: string | null
          status: ProfileStatus
          portfolio_images: string[] | null
          experience: Json
          views: number
          interests: number
          matches: number
          created_at: string
        }
        Insert: {
          id?: string
          freelancer_id: string
          headline: string
          category: string
          skills: string[]
          bio?: string | null
          availability?: string | null
          status?: ProfileStatus
          portfolio_images?: string[] | null
          experience?: Json
          views?: number
          interests?: number
          matches?: number
          created_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string
          headline?: string
          category?: string
          skills?: string[]
          bio?: string | null
          availability?: string | null
          status?: ProfileStatus
          portfolio_images?: string[] | null
          experience?: Json
          views?: number
          interests?: number
          matches?: number
          created_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          id: string
          client_id: string
          title: string
          category: string
          description: string | null
          budget: number | null
          deadline: string | null
          required_skills: string[] | null
          status: JobStatus
          views: number
          proposals: number
          matches: number
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          category: string
          description?: string | null
          budget?: number | null
          deadline?: string | null
          required_skills?: string[] | null
          status?: JobStatus
          views?: number
          proposals?: number
          matches?: number
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          category?: string
          description?: string | null
          budget?: number | null
          deadline?: string | null
          required_skills?: string[] | null
          status?: JobStatus
          views?: number
          proposals?: number
          matches?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'jobs_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      swipes: {
        Row: {
          id: string
          swiper_id: string
          swiped_id: string | null
          swipe_type: SwipeType
          target_id: string
          context_id: string | null
          direction: SwipeDirection
          created_at: string
        }
        Insert: {
          id?: string
          swiper_id: string
          swiped_id?: string | null
          swipe_type: SwipeType
          target_id: string
          context_id?: string | null
          direction: SwipeDirection
          created_at?: string
        }
        Update: {
          id?: string
          swiper_id?: string
          swiped_id?: string | null
          swipe_type?: SwipeType
          target_id?: string
          context_id?: string | null
          direction?: SwipeDirection
          created_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          client_id: string
          freelancer_id: string
          job_id: string | null
          skill_profile_id: string | null
          status: MatchStatus
          contract_amount: number | null
          matched_at: string
          revision_count: number
          submitted_at: string | null
          review_deadline: string | null
        }
        Insert: {
          id?: string
          client_id: string
          freelancer_id: string
          job_id?: string | null
          skill_profile_id?: string | null
          status?: MatchStatus
          contract_amount?: number | null
          matched_at?: string
          revision_count?: number
          submitted_at?: string | null
          review_deadline?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          freelancer_id?: string
          job_id?: string | null
          skill_profile_id?: string | null
          status?: MatchStatus
          contract_amount?: number | null
          matched_at?: string
          revision_count?: number
          submitted_at?: string | null
          review_deadline?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          content: string | null
          message_type: MessageType
          attachment_url: string | null
          attachment_type: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          sender_id: string
          content?: string | null
          message_type?: MessageType
          attachment_url?: string | null
          attachment_type?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          sender_id?: string
          content?: string | null
          message_type?: MessageType
          attachment_url?: string | null
          attachment_type?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      kyc_submissions: {
        Row: {
          id: string
          user_id: string
          id_type: string
          id_number: string
          id_front_url: string
          id_back_url: string
          selfie_url: string
          status: KycStatus
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          submitted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          id_type: string
          id_number: string
          id_front_url: string
          id_back_url: string
          selfie_url: string
          status?: KycStatus
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          submitted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          id_type?: string
          id_number?: string
          id_front_url?: string
          id_back_url?: string
          selfie_url?: string
          status?: KycStatus
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          submitted_at?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          pending: number
          bank_name: string | null
          account_number: string | null
          account_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          pending?: number
          bank_name?: string | null
          account_number?: string | null
          account_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          pending?: number
          bank_name?: string | null
          account_number?: string | null
          account_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          wallet_id: string
          match_id: string | null
          amount: number
          type: TransactionType
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          match_id?: string | null
          amount: number
          type: TransactionType
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          match_id?: string | null
          amount?: number
          type?: TransactionType
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          id: string
          user_id: string
          item_type: 'job' | 'freelancer'
          item_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_type: 'job' | 'freelancer'
          item_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: 'job' | 'freelancer'
          item_id?: string
          created_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          id: string
          match_id: string
          rater_id: string
          rated_id: string
          rating: number
          review: string | null
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          rater_id: string
          rated_id: string
          rating: number
          review?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          rater_id?: string
          rated_id?: string
          rating?: number
          review?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          read: boolean
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          read?: boolean
          data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          read?: boolean
          data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      work_submissions: {
        Row: {
          id: string
          match_id: string
          freelancer_id: string
          submission_number: number
          notes: string | null
          links: string[]
          files: WorkSubmissionFile[]
          submitted_at: string
        }
        Insert: {
          id?: string
          match_id: string
          freelancer_id: string
          submission_number?: number
          notes?: string | null
          links?: string[]
          files?: WorkSubmissionFile[]
          submitted_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          freelancer_id?: string
          submission_number?: number
          notes?: string | null
          links?: string[]
          files?: WorkSubmissionFile[]
          submitted_at?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          id: string
          match_id: string
          client_id: string
          freelancer_id: string
          reason: DisputeReason
          client_explanation: string
          client_evidence: WorkSubmissionFile[]
          freelancer_response: string | null
          freelancer_evidence: WorkSubmissionFile[]
          freelancer_response_deadline: string | null
          freelancer_responded_at: string | null
          status: DisputeStatus
          resolution: DisputeResolution | null
          split_freelancer_amount: number | null
          split_client_amount: number | null
          admin_id: string | null
          admin_notes: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          client_id: string
          freelancer_id: string
          reason: DisputeReason
          client_explanation: string
          client_evidence?: WorkSubmissionFile[]
          freelancer_response?: string | null
          freelancer_evidence?: WorkSubmissionFile[]
          freelancer_response_deadline?: string | null
          freelancer_responded_at?: string | null
          status?: DisputeStatus
          resolution?: DisputeResolution | null
          split_freelancer_amount?: number | null
          split_client_amount?: number | null
          admin_id?: string | null
          admin_notes?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          client_id?: string
          freelancer_id?: string
          reason?: DisputeReason
          client_explanation?: string
          client_evidence?: WorkSubmissionFile[]
          freelancer_response?: string | null
          freelancer_evidence?: WorkSubmissionFile[]
          freelancer_response_deadline?: string | null
          freelancer_responded_at?: string | null
          status?: DisputeStatus
          resolution?: DisputeResolution | null
          split_freelancer_amount?: number | null
          split_client_amount?: number | null
          admin_id?: string | null
          admin_notes?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      dispute_reputation: {
        Row: {
          id: string
          user_id: string
          disputes_initiated: number
          disputes_against: number
          disputes_won: number
          disputes_lost: number
          disputes_split: number
          last_dispute_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          disputes_initiated?: number
          disputes_against?: number
          disputes_won?: number
          disputes_lost?: number
          disputes_split?: number
          last_dispute_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          disputes_initiated?: number
          disputes_against?: number
          disputes_won?: number
          disputes_lost?: number
          disputes_split?: number
          last_dispute_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_job_views: {
        Args: { job_id: string }
        Returns: undefined
      }
      increment_job_proposals: {
        Args: { job_id: string }
        Returns: undefined
      }
      increment_skill_profile_views: {
        Args: { profile_id: string }
        Returns: undefined
      }
      increment_skill_profile_interests: {
        Args: { profile_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types for use in components
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type SkillProfile = Database['public']['Tables']['skill_profiles']['Row']
export type SkillProfileInsert = Database['public']['Tables']['skill_profiles']['Insert']
export type SkillProfileUpdate = Database['public']['Tables']['skill_profiles']['Update']

export type Job = Database['public']['Tables']['jobs']['Row']
export type JobInsert = Database['public']['Tables']['jobs']['Insert']
export type JobUpdate = Database['public']['Tables']['jobs']['Update']

export type Swipe = Database['public']['Tables']['swipes']['Row']
export type SwipeInsert = Database['public']['Tables']['swipes']['Insert']

export type Match = Database['public']['Tables']['matches']['Row']
export type MatchInsert = Database['public']['Tables']['matches']['Insert']
export type MatchUpdate = Database['public']['Tables']['matches']['Update']

export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']

export type KycSubmission = Database['public']['Tables']['kyc_submissions']['Row']
export type KycSubmissionInsert = Database['public']['Tables']['kyc_submissions']['Insert']
export type KycSubmissionUpdate = Database['public']['Tables']['kyc_submissions']['Update']

export type Wallet = Database['public']['Tables']['wallets']['Row']
export type WalletInsert = Database['public']['Tables']['wallets']['Insert']
export type WalletUpdate = Database['public']['Tables']['wallets']['Update']

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

export type SavedItem = Database['public']['Tables']['saved_items']['Row']
export type SavedItemInsert = Database['public']['Tables']['saved_items']['Insert']

export type Rating = Database['public']['Tables']['ratings']['Row']
export type RatingInsert = Database['public']['Tables']['ratings']['Insert']
export type RatingUpdate = Database['public']['Tables']['ratings']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

export type WorkSubmission = Database['public']['Tables']['work_submissions']['Row']
export type WorkSubmissionInsert = Database['public']['Tables']['work_submissions']['Insert']
export type WorkSubmissionUpdate = Database['public']['Tables']['work_submissions']['Update']

export type Dispute = Database['public']['Tables']['disputes']['Row']
export type DisputeInsert = Database['public']['Tables']['disputes']['Insert']
export type DisputeUpdate = Database['public']['Tables']['disputes']['Update']

export type DisputeReputation = Database['public']['Tables']['dispute_reputation']['Row']
export type DisputeReputationInsert = Database['public']['Tables']['dispute_reputation']['Insert']
export type DisputeReputationUpdate = Database['public']['Tables']['dispute_reputation']['Update']

// Extended types with relations
export type MatchWithProfiles = Match & {
  client: Profile
  freelancer: Profile
  job?: Job
  skill_profile?: SkillProfile
}

export type MessageWithSender = Message & {
  sender: Pick<Profile, 'full_name' | 'avatar_url'>
}

export type JobWithClient = Job & {
  client: Profile
}

export type SkillProfileWithFreelancer = SkillProfile & {
  freelancer: Profile
}

// Dispute-related extended types
export type DisputeWithDetails = Dispute & {
  client: Profile
  freelancer: Profile
  match: MatchWithProfiles
  work_submissions?: WorkSubmission[]
}

// Dispute reason display mappings
export const DISPUTE_REASONS: Record<DisputeReason, { label: string; description: string }> = {
  work_not_delivered: {
    label: 'Work not delivered',
    description: 'The freelancer did not deliver any work'
  },
  work_incomplete: {
    label: 'Work incomplete',
    description: 'The delivered work is missing key components'
  },
  quality_not_as_agreed: {
    label: 'Quality not as agreed',
    description: 'The work quality does not meet the agreed standards'
  },
  deadline_missed: {
    label: 'Deadline missed',
    description: 'The freelancer missed the agreed deadline'
  }
}

// Resolution display mappings
export const DISPUTE_RESOLUTIONS: Record<DisputeResolution, { label: string; description: string }> = {
  release_full: {
    label: 'Release Full Payment',
    description: 'Release full escrow amount to freelancer'
  },
  refund_client: {
    label: 'Refund Client',
    description: 'Refund full escrow amount to client'
  },
  split_payment: {
    label: 'Split Payment',
    description: 'Split the escrow between both parties'
  },
  final_revision: {
    label: 'Request Final Revision',
    description: 'Give freelancer one final chance to fix the work'
  }
}

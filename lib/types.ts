export type UserRole = "healthcare_worker" | "administrator" | "institution"

export type ModuleDifficulty = "beginner" | "intermediate" | "advanced"

export type ProgressStatus = "not_started" | "in_progress" | "completed"

export type DeploymentPriority = "low" | "medium" | "high" | "critical"

export type AlertSeverity = "info" | "warning" | "critical"

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  specialization?: string
  location?: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  title: string
  description: string
  content: {
    sections: Array<{
      title: string
      content: string
    }>
  }
  difficulty: ModuleDifficulty
  category: string
  tags: string[]
  prerequisites: string[]
  duration_minutes: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Progress {
  id: string
  user_id: string
  module_id: string
  completion_percent: number
  score?: number
  status: ProgressStatus
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Deployment {
  id: string
  location: string
  state: string
  district: string
  specialization_needed: string
  priority: DeploymentPriority
  requirements: {
    qualifications: string[]
    skills: string[]
    languages: string[]
  }
  available_positions: number
  description: string
  created_at: string
  updated_at: string
}

export interface EmergencyAlert {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  category: string
  affected_regions: string[]
  action_required?: string
  is_active: boolean
  created_at: string
  expires_at?: string
}

export interface Certification {
  id: string
  user_id: string
  module_id: string
  skill: string
  level: string
  certificate_hash: string
  issued_at: string
  expires_at?: string
  created_at: string
}

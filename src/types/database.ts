export type OrgType = 'NSS' | 'YRC'
export type RegStatus = 'registered' | 'attended'
export type UserRole = 'student' | 'admin'

export interface Profile {
  id: string
  name: string
  email: string
  department: string
  year: number
  roll_number?: string
  phone?: string
  org: OrgType
  org_locked: boolean
  role: UserRole
  avatar_url?: string
  total_hours: number
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description?: string
  event_type: OrgType
  date: string
  end_date?: string
  location?: string
  seats: number
  seats_filled: number
  hours: number
  image_url?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Registration {
  id: string
  user_id: string
  event_id: string
  status: RegStatus
  registered_at: string
  attended_at?: string
  event?: Event
}

export interface Certificate {
  id: string
  user_id: string
  event_id?: string
  title: string
  issued_at: string
  storage_path: string
  event?: Event
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface LeaderboardEntry {
  id: string
  name: string
  department: string
  year: number
  org: OrgType
  avatar_url?: string
  total_hours: number
  events_attended: number
  events_registered: number
}

export interface EventPhoto {
  id: string
  event_id: string
  storage_path: string
  uploader_id: string
  created_at: string
}

export interface EventMessage {
  id: string
  event_id: string
  user_id: string
  content: string
  created_at: string
  user?: Partial<Profile>
}

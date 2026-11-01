export type UserRole = 'student' | 'admin';

export interface Skill {
  id: string;
  name: string;
  category: string;
  aliases?: string[];
  is_active?: boolean;
}

export interface UserSkill {
  id?: string;
  skill?: Skill;
  skill_id?: string;
  name?: string;
  level: number; // 1 - 5
  years_exp?: number;
}

export interface Experience {
  id?: string;
  title: string;
  description?: string;
  link?: string;
}

export interface Availability {
  hours_per_week: number;
  timezone: string;
  slots: string[];
}

export type LookingForType = 'hackathon' | 'project' | 'internship' | 'competition';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_verified: boolean;
  is_active?: boolean;
  college?: string;
  branch?: string;
  year?: number;
  avatar_url?: string;
  bio?: string;
  skills: UserSkill[];
  preferred_tech: Skill[];
  interests: string[];
  looking_for: LookingForType[];
  experience: Experience[];
  availability: Availability;
  profile_completeness?: number;
  reputation_avg?: number;
  reputation_count?: number;
  reputation?: { avg: number; count: number };
  created_at?: string;
  updated_at?: string;
  ratings_recent?: Rating[];
}

export type ProjectType = 'project' | 'hackathon' | 'internship' | 'competition';
export type ProjectStatus = 'open' | 'in_progress' | 'completed' | 'closed' | 'flagged';
export type ProjectMode = 'online' | 'offline' | 'hybrid';

export interface ProjectRoleSlot {
  role: string;
  slots: number;
  filled?: number;
  skills: (Skill | string)[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  mode: ProjectMode;
  tags: string[];
  start_date?: string;
  deadline?: string;
  team_size_min: number;
  team_size_max: number;
  roles: ProjectRoleSlot[];
  required_skills: Skill[];
  owner: Profile;
  team?: Team;
  viewer?: {
    is_owner: boolean;
    is_member: boolean;
    pending_request?: RequestItem | null;
  };
  created_at?: string;
  updated_at?: string;
}

export type TeamStatus = 'forming' | 'active' | 'completed' | 'disbanded';

export interface TeamMember {
  user: Profile;
  role: string;
  joined_at: string;
}

export interface Team {
  id: string;
  project_id: string;
  project?: Project;
  name: string;
  status: TeamStatus;
  leader_id: string;
  leader?: Profile;
  members: TeamMember[];
  conversation_id?: string;
  role_slots?: ProjectRoleSlot[];
  task_summary?: {
    total: number;
    done: number;
  };
  created_at?: string;
}

export type RequestType = 'invite' | 'application';
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export interface RequestItem {
  id: string;
  type: RequestType;
  project_id: string;
  project?: Project;
  team_id?: string;
  from_user: Profile;
  to_user: Profile;
  role?: string;
  message?: string;
  status: RequestStatus;
  created_at: string;
}

export interface MatchFeatures {
  semantic: number;
  coverage: number;
  complement: number;
  availability: number;
  reputation: number;
  interest: number;
}

export interface MatchExplanation {
  reason: string;
  suggestedRole: string;
  source: 'llm' | 'rules';
}

export interface MatchItem {
  user: Profile;
  score: number;
  features: MatchFeatures;
  matched_skills: string[];
  missing_skills: string[];
  explanation?: MatchExplanation;
}

export interface Conversation {
  id: string;
  type: 'team' | 'direct';
  team_id?: string;
  participants: Profile[];
  last_message_at?: string;
  last_message?: string;
  unread_count?: number;
}

export interface MessageAttachment {
  url: string;
  type: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: Profile;
  text: string;
  attachments?: MessageAttachment[];
  read_by?: string[];
  created_at: string;
  status?: 'pending' | 'delivered' | 'failed';
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'invite' | 'application' | 'request_accepted' | 'request_declined' | 'new_message' | 'task_assigned' | 'deadline_approaching' | 'rating_requested' | string;
  title: string;
  body: string;
  data?: {
    project_id?: string;
    team_id?: string;
    conversation_id?: string;
    task_id?: string;
  };
  is_read: boolean;
  created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskComment {
  id: string;
  user: Profile;
  text: string;
  created_at: string;
}

export interface TaskItem {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  assignee?: Profile;
  created_by: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  labels?: string[];
  comments?: TaskComment[];
  position?: number;
  created_at?: string;
}

export interface Rating {
  id: string;
  project_id: string;
  rater_id: string;
  ratee_id: string;
  ratee?: Profile;
  teamwork: number;
  communication: number;
  skill: number;
  reliability: number;
  comment?: string;
  created_at: string;
}

export interface TeammateRatingStatus {
  user: Profile;
  has_rated: boolean;
  rating?: Rating;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    columns?: Record<string, string>;
    next_before?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      body?: Array<{ path: (string | number)[]; message: string }>;
      [key: string]: unknown;
    };
  };
}

export interface NormalizedError {
  status: number;
  code: string;
  message: string;
  details?: {
    body?: Array<{ path: (string | number)[]; message: string }>;
    [key: string]: unknown;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface LoginResponseData {
  session: AuthSession;
  user: Profile;
  email_verified: boolean;
}

export interface AdminStats {
  total_users: number;
  active_teams: number;
  open_projects: number;
  acceptance_rate: number;
  signups_last_7_days: { date: string; count: number }[];
  requests_trend: { date: string; accepted: number; total: number }[];
}

export interface AdminReport {
  id: string;
  reporter: Profile;
  target_type: 'user' | 'project' | 'message';
  target_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin: Profile;
  action: string;
  target_type: string;
  target_id: string;
  details?: Record<string, unknown>;
  created_at: string;
}

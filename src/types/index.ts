
export interface SupabaseAuthUser {
  id: string;
  aud?: string;
  role?: string;
  email?: string;
  phone?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  created_at?: string;
  updated_at?: string;
  is_anonymous?: boolean;

  app_metadata?: {
    provider?: string;
    providers?: string[];
    [key: string]: unknown;
  };

  user_metadata?: {
    name?: string;
    email?: string;
    college?: string;
    branch?: string;
    year?: number;
    email_verified?: boolean;
    [key: string]: unknown;
  };

  identities?: Array<Record<string, unknown>>;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  user: SupabaseAuthUser;
  weak_password?: unknown;
}

export interface LoginResponseData {
  session: AuthSession;
  user: Profile;
  email_verified: boolean;
}

export interface SignupResponseData {
  session: AuthSession | null;
  user: Profile;
  email_verified: boolean;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code?: string;
    message?: string;
    details?: NormalizedError['details'];
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    next_before?: string;
  };
}

export interface NormalizedError {
  status: number;
  code: string;
  message: string;
  details?: {
    body?: Array<{
      path: Array<string | number>;
      message: string;
    }>;
    [key: string]: unknown;
  };
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  aliases?: string[];
  is_active?: boolean;
}

export interface ProfileSkill {
  id?: string;
  name?: string;
  level: number;
  years_exp?: number;
  skill?: Skill;
}

export interface Profile {
  id: string;
  email?: string;
  name: string;
  role?: string;
  is_verified?: boolean;
  is_active?: boolean;
  college?: string;
  branch?: string;
  year?: number;
  bio?: string;
  avatar_url?: string | null;
  skills: ProfileSkill[];
  preferred_tech: string[];
  interests: string[];
  looking_for: string[];
  experience: Array<{ title: string; description?: string }>;
  availability?: {
    hours_per_week: number;
    timezone: string;
    slots: string[];
  };
  profile_completeness?: number;
  reputation_avg?: number;
  reputation_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectRoleSlot {
  role: string;
  slots: number;
  filled?: number;
  skills?: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  mode: string;
  tags: string[];
  start_date?: string;
  deadline?: string;
  team_size_min: number;
  team_size_max: number;
  roles: ProjectRoleSlot[];
  required_skills: Array<Skill | string>;
  owner?: Profile;
  team?: { id: string };
  viewer?: {
    is_owner?: boolean;
    is_member?: boolean;
    pending_request?: boolean;
  };
  created_at?: string;
}

export interface TeamMember {
  user: Profile;
  role?: string;
  joined_at?: string;
}

export interface Team {
  id: string;
  name: string;
  project_id: string;
  project?: Project;
  leader_id: string;
  leader?: Profile;
  members: TeamMember[];
  status: string;
  conversation_id?: string;
  task_summary?: { total: number; done: number };
}

export interface TaskComment {
  id: string;
  task_id?: string;
  user_id?: string;
  user?: Profile;
  text: string;
  created_at?: string;
}

export interface TaskItem {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  status: string;
  position: number;
  priority?: string;
  assignee_id?: string;
  assignee?: Profile;
  due_date?: string;
  labels?: string[];
  comments?: TaskComment[];
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  type: string;
  participants: Profile[];
  last_message_at?: string;
  last_message?: string;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: Profile;
  text: string;
  attachments?: Array<{ url: string; type: string }>;
  read_by?: string[];
  created_at: string;
  status?: string;
}

export interface RequestItem {
  id: string;
  type: 'invite' | 'application' | string;
  project_id: string;
  project?: Project;
  team_id?: string;
  from_user?: Profile;
  to_user?: Profile;
  role?: string;
  message?: string;
  status: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string | number | boolean | null | undefined>;
  is_read: boolean;
  created_at: string;
}

export interface Rating {
  id: string;
  project_id: string;
  rater_id?: string;
  ratee_id?: string;
  teamwork: number;
  communication: number;
  skill: number;
  reliability: number;
  comment?: string;
  created_at?: string;
}

export interface TeammateRatingStatus {
  user: Profile;
  has_rated: boolean;
}

export interface MatchItem {
  user: Profile;
  score: number;
  features?: Record<string, number>;
  matched_skills?: string[];
  missing_skills?: string[];
  explanation?: {
    reason: string;
    source?: string;
    suggestedRole?: string;
  };
}

export interface AdminStats {
  total_users: number;
  active_teams: number;
  open_projects: number;
  acceptance_rate: number;
}

export interface AdminReport {
  id: string;
  target_type: string;
  reason: string;
  reporter?: Profile;
  status?: string;
  resolution_notes?: string;
  created_at?: string;
}

export interface AdminAuditLog {
  id: string;
  admin?: Profile;
  action: string;
  target_type: string;
  target_id: string;
  created_at: string;
}

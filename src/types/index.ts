
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

// User type definitions for the application

export interface AuthenticatedUser {
  userId: string;
  koreanNickname: string;
  displayName?: string | null;
  profileImageUrl?: string | null;
  isAdmin: boolean;
}

export interface DatabaseUser {
  user_id: string;
  korean_nickname: string;
  display_name?: string | null;
  profile_image_url?: string | null;
  bio?: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export type UserProfile = DatabaseUser;

export interface UserProfileResponse {
  user: UserProfile | null;
  hasNickname: boolean;
}

// Props interface for components that need user data
export interface WithUserProps {
  user: AuthenticatedUser;
}

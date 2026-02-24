export type UserRole = "owner" | "admin" | "editor" | "developer" | "viewer";

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

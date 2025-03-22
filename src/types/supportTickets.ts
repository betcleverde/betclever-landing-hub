
export interface Message {
  id: string;
  user_id: string;
  content: string;
  is_admin: boolean;
  user_email?: string;
  created_at: string;
}

// Helper function to safely convert Supabase data to our defined types
export const fromSupabase = <T>(data: any): T => {
  return data as T;
}

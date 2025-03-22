
export interface Message {
  id: string;
  user_id: string;
  content: string;
  is_admin: boolean;
  user_email?: string;
  created_at: string;
}

// Helper function to access the support_tickets table
// This is a workaround since we can't modify the generated types.ts
export const fromSupabase = <T>(data: any): T => {
  return data as T;
}

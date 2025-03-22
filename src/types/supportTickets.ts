
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

// Helper type for user data
export interface UserData {
  id: string;
  email?: string;
  phone?: string;
  last_sign_in_at?: string | null;
  banned?: boolean;
  is_admin?: boolean;
}

// Helper type for application data
export interface ApplicationData {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  status: string;
  created_at: string;
  updated_at: string;
  admin_feedback?: string | null;
  unlocked_fields?: string[] | null;
  id_front_url?: string | null;
  id_back_url?: string | null;
  id_selfie_url?: string | null;
  giro_front_url?: string | null;
  giro_back_url?: string | null;
  credit_front_url?: string | null;
  credit_back_url?: string | null;
  bank_documents_urls?: string[] | null;
}

// New interface for ticket notifications
export interface TicketNotification {
  userId: string;
  unreadCount: number;
}

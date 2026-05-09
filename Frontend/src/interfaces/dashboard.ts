export interface DashboardData {
  user_id: number;
  full_name: string;
  birth_date: string | null;
  country_city: string;
  phone: string;
  photo_url: string | null;
  registered_at: string | null;
  completed_events: number;
  pending_events: number;
  unread_messages: number;
  conferences: unknown[];
}

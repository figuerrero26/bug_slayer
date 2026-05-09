export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  type: "info" | "alerta" | "sistema";
  created_at: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  birthdate?: string;
  birthdateRaw?: string;
  registeredAt?: string;
}

export interface UserSession {
  token: string;
  user_id: number;
  email: string;
}

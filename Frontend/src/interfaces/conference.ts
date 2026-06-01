export interface Conference {
  id: number;
  title: string;
  speaker_name: string | null;
  speaker_image_url: string | null;
  category: string | null;
  schedule: string | null;
  campus_name: string | null;
  room_name: string | null;
  registration_id: number;
  registration_status: string;
}

export interface ConferenceTicket {
  id: number;
  title: string;
  speaker_name: string | null;
  schedule: string | null;
  campus_name: string | null;
  room_name: string | null;
  registration_id: number;
  conference_id?: number;
  qr_payload?: string;
}

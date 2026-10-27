export type EventCatalog = {
  id: string;
  title: string;
  summary: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  venue: string | null;
  published: boolean;
  lunch_paise: number;
  dinner_paise: number;
  lunch_nonveg_paise?: number | null;
  dinner_nonveg_paise?: number | null;
  parking_2w_paise: number;
  parking_4w_paise: number;
  base_ticket_paise: number;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
};

export const EVENT_SELECT =
  'id,title,summary,description,starts_at,ends_at,venue,published,lunch_paise,dinner_paise,parking_2w_paise,parking_4w_paise,base_ticket_paise,is_primary,created_at,updated_at';

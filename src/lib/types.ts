export interface Wedding {
  id: string;
  user_id: string;
  partner1_name: string;
  partner2_name: string;
  wedding_date: string | null;
}

export interface Gift {
  id: string;
  wedding_id: string;
  guest_name: string;
  description: string;
  address: string;
  thank_you_sent: boolean;
  created_at: string;
}

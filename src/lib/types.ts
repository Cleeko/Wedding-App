export interface Wedding {
  id: string;
  user_id: string;
  partner1_name: string;
  partner2_name: string;
  wedding_date: string | null;
}

export interface Guest {
  id: string;
  wedding_id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  group_label: string;
  created_at: string;
}

export interface Gift {
  id: string;
  wedding_id: string;
  guest_id: string | null;
  guest_name: string;
  description: string;
  address: string;
  thank_you_sent: boolean;
  created_at: string;
}

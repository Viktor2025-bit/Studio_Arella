export interface User {
  id: string;
  name: string;
  email: string;
  role: 'advertiser' | 'screen_owner' | 'admin';
  credits: number;
  avatar?: string;
  language?: string;
  created_at?: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'ended';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  start_date?: string;
  end_date?: string;
  booking_count?: number;
  ad_count?: number;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_number: string;
  user_id: string;
  ad_id?: string;
  campaign_id?: string;
  screen_id?: string;
  screen_count: number;
  impressions: number;
  views: number;
  interval_seconds: number;
  cost_per_sec: number;
  total_cost: number;
  start_time?: string;
  end_time?: string;
  status: 'active' | 'paused' | 'ended' | 'cancelled';
  screen_name?: string;
  ad_title?: string;
  campaign_name?: string;
  created_at: string;
}

export interface Ad {
  id: string;
  campaign_id?: string;
  user_id: string;
  title: string;
  media_url?: string;
  media_type: 'image' | 'video';
  duration_seconds: number;
  status: 'pending' | 'approved' | 'rejected' | 'active';
  campaign_name?: string;
  created_at: string;
}

export interface Screen {
  id: string;
  owner_id: string;
  name: string;
  location: string;
  type: 'billboard' | 'digital' | 'indoor' | 'outdoor';
  size?: string;
  price_per_sec: number;
  status: 'active' | 'inactive' | 'maintenance';
  impressions_per_day: number;
  owner_name?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'credit' | 'debit' | 'refund';
  source: string;
  amount: number;
  description?: string;
  reference?: string;
  created_at: string;
}

export interface DashboardStats {
  total_revenue: number;
  active_campaigns: number;
  active_screens: number;
  hourly_analytics: Array<{ hour: number; impressions: number }>;
}

export interface HourlyData {
  hour: number;
  impressions: number;
  views: number;
}

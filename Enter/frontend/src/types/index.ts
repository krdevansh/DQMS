export interface Salon {
  _id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  shopNumber?: string;
  description?: string;
  salonType?: 'male' | 'female' | 'unisex';
  isOpen?: boolean;
  services?: string[];
  members?: SalonMember[];
  images?: string[];
  instagram?: string;
}

export interface SalonMember {
  name: string;
  specialization?: string;
  experience?: string;
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  profilePic?: string;
  faceShape?: FaceShape;
  skinTone?: string;
  gender?: 'male' | 'female' | 'non-binary';
  age?: number;
}

export type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'diamond' | 'oblong';

export interface HaircutHistoryItem {
  id: string;
  salonName: string;
  serviceName: string;
  date: string;
  stylistName?: string;
  price: number;
}

export interface HairstyleSuggestion {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  faceShapes: FaceShape[];
  gender: ('male' | 'female' | 'non-binary')[];
  tags: string[];
  link?: string;
  minAge?: number;
  maxAge?: number;
}

export interface QueueItem {
  _id: string;
  salonId: string | Salon;
  name: string;
  phone: string;
  queueNumber: number;
  queuePosition?: number;
  status: 'waiting' | 'completed' | 'skipped';
  createdAt: string;
}

export interface Stats {
  totalCustomers: number;
  waiting: number;
  completed: number;
  avgWaitTime: string;
}

export type ThemeType = 'light' | 'dark';
export type AppThemeType = 'dqms' | 'salon' | 'light' | 'dark';
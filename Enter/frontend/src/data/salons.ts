export interface MockSalon {
  id: string;
  shopNumber: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  description: string;
  salonType: 'male' | 'female' | 'unisex';
  isOpen: boolean;
  rating: number;
  reviews: number;
  distance?: string;
  travelTime?: string;
  lat: number;
  lng: number;
  services: { id: string; name: string; price: number; duration: string }[];
  members: { name: string; specialization: string; experience: string }[];
  queue: { name: string; ticket: string; position: number; status: string }[];
  image: string;
}

export const allSalons: MockSalon[] = [];

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getDistanceText(distKm: number): string {
  return `${distKm.toFixed(1)} km away`;
}

export function getTravelTimeText(distKm: number): string {
  const mins = Math.round(distKm * 2);
  if (mins < 1) return 'Less than 1 min';
  if (mins > 60) return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
  return `~${mins} min`;
}

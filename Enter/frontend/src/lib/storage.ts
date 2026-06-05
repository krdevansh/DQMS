import { Customer, HaircutHistoryItem } from '@/types';

const CUSTOMER_KEY = 'dqms_customer_profile';
const HISTORY_KEY = 'dqms_haircut_history';

export function getCustomerProfile(): Customer | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CUSTOMER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as Customer;
  } catch {
    return null;
  }
}

export function saveCustomerProfile(customer: Customer): void {
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
}

export function getHaircutHistory(): HaircutHistoryItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(HISTORY_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as HaircutHistoryItem[];
  } catch {
    return [];
  }
}

export function addHaircutHistoryItem(item: HaircutHistoryItem): void {
  const history = getHaircutHistory();
  history.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHaircutHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

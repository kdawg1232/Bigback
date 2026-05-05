export interface Entry {
  id: string;
  brandId: string;
  brandName: string;
  amount: number;
  timestamp: number;
}

export interface Brand {
  id: string;
  name: string;
  color: string;
  textColor: string;
  emoji: string;
  cuisine: string;
}

export interface UserStats {
  totalSpent: number;
  lastIncidentDate: number | null;
  history: Entry[];
  memberSince: number;
  name: string;
  hasSeenLanding: boolean;
  hasCompletedOnboarding: boolean;
  remindersEnabled: boolean;
  customBrands: Brand[];
  monthlyBudget: number | null;
  locationTrackingEnabled: boolean;
}

export type TabType = 'counter' | 'receipt' | 'settings' | 'scan' | 'cuisine';
export type AppView = 'landing' | 'onboarding' | 'main';
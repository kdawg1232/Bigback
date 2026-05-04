import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats, Entry, Brand } from '../types';
import { STORAGE_KEY } from '../constants';

const INITIAL_STATS: UserStats = {
  totalSpent: 0,
  lastIncidentDate: null,
  history: [],
  memberSince: Date.now(),
  name: 'BIG BACK MEMBER',
  hasSeenLanding: false,
  hasCompletedOnboarding: false,
  remindersEnabled: true,
  customBrands: [],
  monthlyBudget: null,
};

interface StatsContextType {
  stats: UserStats;
  isHydrated: boolean;
  addEntry: (brandId: string, brandName: string, amount: number) => void;
  deleteEntry: (id: string) => void;
  updateProfile: (name: string) => void;
  toggleReminders: () => void;
  setRemindersEnabled: (enabled: boolean) => void;
  clearAllData: () => void;
  logout: () => void;
  startOnboarding: () => void;
  finishOnboarding: () => void;
  addCustomBrand: (brand: Brand) => void;
  deleteCustomBrand: (id: string) => void;
  setMonthlyBudget: (budget: number | null) => void;
}

const StatsContext = createContext<StatsContextType | null>(null);

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setStats({
            ...INITIAL_STATS,
            ...parsed,
            customBrands: parsed.customBrands ?? [],
            monthlyBudget: parsed.monthlyBudget ?? null,
          });
        }
      } catch (e) {
        console.error("Storage corruption detected", e);
      } finally {
        setIsHydrated(true);
      }
    };
    load();
  }, []);

  // Save data whenever stats change (after hydration)
  useEffect(() => {
    if (isHydrated) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }
  }, [stats, isHydrated]);

  const addEntry = useCallback((brandId: string, brandName: string, amount: number) => {
    setStats(prev => {
      const newEntry: Entry = {
        id: Math.random().toString(36).substr(2, 9),
        brandId,
        brandName,
        amount,
        timestamp: Date.now(),
      };
      
      const newHistory = [newEntry, ...prev.history];
      return {
        ...prev,
        totalSpent: prev.totalSpent + amount,
        lastIncidentDate: Date.now(),
        history: newHistory,
      };
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setStats(prev => {
      const entryToDelete = prev.history.find(e => e.id === id);
      if (!entryToDelete) return prev;

      const newHistory = prev.history.filter(e => e.id !== id);
      const newTotalSpent = prev.totalSpent - entryToDelete.amount;
      const newLastIncident = newHistory.length > 0 ? newHistory[0].timestamp : null;

      return {
        ...prev,
        totalSpent: Math.max(0, newTotalSpent),
        history: newHistory,
        lastIncidentDate: newLastIncident
      };
    });
  }, []);

  const updateProfile = useCallback((name: string) => {
    setStats(prev => ({ ...prev, name }));
  }, []);

  const toggleReminders = useCallback(() => {
    setStats(prev => ({ ...prev, remindersEnabled: !prev.remindersEnabled }));
  }, []);

  const setRemindersEnabled = useCallback((enabled: boolean) => {
    setStats(prev => ({ ...prev, remindersEnabled: enabled }));
  }, []);

  const addCustomBrand = useCallback((brand: Brand) => {
    setStats(prev => ({
      ...prev,
      customBrands: [...prev.customBrands, brand],
    }));
  }, []);

  const deleteCustomBrand = useCallback((id: string) => {
    setStats(prev => ({
      ...prev,
      customBrands: prev.customBrands.filter(b => b.id !== id),
    }));
  }, []);

  const setMonthlyBudget = useCallback((budget: number | null) => {
    setStats(prev => ({ ...prev, monthlyBudget: budget }));
  }, []);

  const clearAllData = useCallback(() => {
    const fresh: UserStats = {
      ...INITIAL_STATS,
      memberSince: Date.now(),
      hasSeenLanding: true,
      hasCompletedOnboarding: true,
    };
    setStats(fresh);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const logout = useCallback(() => {
    setStats(prev => ({ ...prev, hasSeenLanding: false }));
  }, []);

  const startOnboarding = useCallback(() => {
    setStats(prev => ({ ...prev, hasSeenLanding: true }));
  }, []);

  const finishOnboarding = useCallback(() => {
    setStats(prev => ({ ...prev, hasCompletedOnboarding: true }));
  }, []);

  return (
    <StatsContext.Provider value={{
      stats,
      isHydrated,
      addEntry,
      deleteEntry,
      updateProfile,
      toggleReminders,
      setRemindersEnabled,
      clearAllData,
      logout,
      startOnboarding,
      finishOnboarding,
      addCustomBrand,
      deleteCustomBrand,
      setMonthlyBudget,
    }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}

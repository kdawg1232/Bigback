import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats, Entry } from '../types';
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
};

export function useStats() {
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setStats(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Storage error", e);
      } finally {
        setIsHydrated(true);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (isHydrated) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }
  }, [stats, isHydrated]);

  const addEntry = useCallback((brandId: string, brandName: string, amount: number) => {
    setStats(prev => {
      const newEntry: Entry = {
        id: Math.random().toString(36).substring(2, 9),
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

  const updateProfile = (name: string) => {
    setStats(prev => ({ ...prev, name }));
  };

  const toggleReminders = () => {
    setStats(prev => ({ ...prev, remindersEnabled: !prev.remindersEnabled }));
  };

  const clearAllData = useCallback(() => {
    const fresh: UserStats = {
      ...INITIAL_STATS,
      hasSeenLanding: true,
      hasCompletedOnboarding: true,
    };
    setStats(fresh);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const logout = useCallback(() => {
    setStats(prev => ({ ...prev, hasSeenLanding: false }));
  }, []);

  const startOnboarding = () => {
    setStats(prev => ({ ...prev, hasSeenLanding: true }));
  };

  const finishOnboarding = () => {
    setStats(prev => ({ ...prev, hasCompletedOnboarding: true }));
  };

  return {
    stats,
    isHydrated,
    addEntry,
    deleteEntry,
    updateProfile,
    toggleReminders,
    clearAllData,
    logout,
    startOnboarding,
    finishOnboarding,
  };
}

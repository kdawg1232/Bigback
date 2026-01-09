import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from '../constants';
import '../global.css';

export default function RootLayout() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Just checking if we can access storage
        await AsyncStorage.getItem(STORAGE_KEY);
      } catch (e) {
        console.warn(e);
      } finally {
        setIsHydrated(true);
      }
    }

    prepare();
  }, []);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5DC' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="landing" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}

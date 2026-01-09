import { Stack } from 'expo-router';
import { StatsProvider, useStats } from '../contexts/StatsContext';
import { View, ActivityIndicator } from 'react-native';
import '../global.css';

function RootLayoutNav() {
  const { isHydrated } = useStats();

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

export default function RootLayout() {
  return (
    <StatsProvider>
      <RootLayoutNav />
    </StatsProvider>
  );
}

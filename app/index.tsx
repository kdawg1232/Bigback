import { Redirect } from 'expo-router';
import { useStats } from '../hooks/useStats';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { stats, isHydrated } = useStats();

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5DC' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!stats.hasSeenLanding) {
    return <Redirect href="/landing" />;
  }

  if (!stats.hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/counter" />;
}

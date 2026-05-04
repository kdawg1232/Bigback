import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFC72C',
          borderTopWidth: 5,
          borderTopColor: '#000',
          height: 90,
          paddingBottom: 30,
        },
        tabBarActiveTintColor: '#FFC72C',
        tabBarInactiveTintColor: '#000',
        tabBarActiveBackgroundColor: '#000',
        tabBarLabelStyle: {
          fontWeight: '900',
          fontSize: 9,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="counter"
        options={{
          title: 'COUNTER',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🎰</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'SCAN',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>📸</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="cuisine"
        options={{
          title: 'CUISINE',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🍽️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="receipt"
        options={{
          title: 'RECEIPT',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🧾</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'CONFIG',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>⚙️</Text>
          ),
        }}
      />
    </Tabs>
  );
}

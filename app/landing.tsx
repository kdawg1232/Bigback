import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useStats } from '../hooks/useStats';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LandingScreen() {
  const { startOnboarding } = useStats();
  const router = useRouter();

  const handleStart = () => {
    startOnboarding();
    router.replace('/onboarding');
  };

  return (
    <SafeAreaView className="flex-1 bg-brutalist-yellow" edges={['top', 'bottom']}>
      <View className="flex-1">
        {/* Main Content Area */}
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
          <View className="flex-1 justify-center items-center">
            <Text 
              className="text-[90px] font-black leading-[0.7] mb-10 text-black uppercase tracking-tighter text-center"
              style={{ 
                transform: [{ rotate: '-2deg' }],
                textShadowColor: 'white',
                textShadowOffset: { width: 6, height: 6 },
                textShadowRadius: 1,
              }}
            >
              BIG{"\n"}BACK
            </Text>
            
            <View className="mb-10 items-center" style={{ transform: [{ rotate: '1deg' }] }}>
              <Text className="text-3xl font-black uppercase tracking-tighter text-black leading-none text-center">
                OWN YOUR CALORIES.{"\n"}TRACK THE SPENDING.
              </Text>
              <Text className="text-base font-bold text-black leading-snug px-4 text-center mt-3">
                No judgment. No fitness goals. Just a private display for your fast-food habits.
              </Text>
            </View>

            <TouchableOpacity 
              onPress={handleStart}
              className="bg-brutalist-red border-[5px] border-black p-6 w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              <Text className="text-white text-xl font-black text-center uppercase leading-none">
                GET MUNCHIN — IT'S FREE
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="bg-black p-6 items-center justify-center border-t-[5px] border-black mt-auto">
          <Text className="text-lg font-black tracking-widest uppercase leading-none text-white">
            BIG BACK © 2026
          </Text>
          <Text className="text-[10px] mt-1 font-bold opacity-80 text-white">
            Made for the hungry.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

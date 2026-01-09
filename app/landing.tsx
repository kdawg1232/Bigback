import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useStats } from '../contexts/StatsContext';
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
        <View className="flex-1 items-center justify-center p-6">
          <Text 
            className="text-[110px] font-black leading-[0.85] mb-10 pt-4 text-black uppercase tracking-tighter text-center"
            style={{ 
              transform: [{ rotate: '-2deg' }],
              textShadowColor: 'white',
              textShadowOffset: { width: 8, height: 8 },
              textShadowRadius: 1,
            }}
          >
            BIG{"\n"}BACK
          </Text>
          
          <View className="mb-10" style={{ transform: [{ rotate: '1deg' }] }}>
            <Text className="text-3xl font-black uppercase tracking-tighter text-black leading-none text-center mb-3">
              OWN YOUR CALORIES.{"\n"}TRACK THE SPENDING.
            </Text>
            <Text className="text-base font-bold text-black leading-snug px-4 text-center">
              No judgment. No fitness goals. Just a private display for your fast-food habits.
            </Text>
          </View>

          <TouchableOpacity 
            onPress={handleStart}
            className="bg-brutalist-red border-[5px] border-black p-6 w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none mb-2"
          >
            <Text className="text-white text-xl font-black text-center uppercase leading-none">
              GET MUNCHIN — IT'S FREE
            </Text>
          </TouchableOpacity>
        </View>

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

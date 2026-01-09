import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch, Linking } from 'react-native';
import { useStats } from '../contexts/StatsContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { stats, updateProfile, toggleReminders, clearAllData, logout } = useStats();
  const [name, setName] = useState(stats.name);
  const router = useRouter();

  // Sync local name state with context when stats.name changes (e.g., after clear data)
  useEffect(() => {
    setName(stats.name);
  }, [stats.name]);

  const handleUpdateName = (text: string) => {
    const upper = text.toUpperCase();
    setName(upper);
    updateProfile(upper);
  };

  const handleClear = () => {
    Alert.alert(
      "WIPE ALL FOOD DATA?",
      "THIS WILL WIPE ALL YOUR FOOD PURCHASES (DATA) FOREVER. YOUR STATS WILL BE GONE. ARE YOU SURE?",
      [
        { text: "CANCEL", style: "cancel" },
        { text: "WIPE IT ALL", style: "destructive", onPress: clearAllData }
      ]
    );
  };

  const handleLogout = () => {
    logout();
    router.replace('/landing');
  };

  const showTerms = () => {
    Linking.openURL('https://thebigbackapp.netlify.app/terms');
  };

  const showPrivacy = () => {
    Linking.openURL('https://thebigbackapp.netlify.app/privacy');
  };

  const showSupport = () => {
    Linking.openURL('https://thebigbackapp.netlify.app/support');
  };

  const joinDate = new Date(stats.memberSince);
  const formattedDate = `${joinDate.getDate()}/${joinDate.getMonth() + 1}/${joinDate.getFullYear()}`;

  return (
    <SafeAreaView className="flex-1 bg-brutalist-beige" edges={['top']}>
      <ScrollView className="flex-1 p-6">
        <Text className="text-6xl font-black mb-10 border-b-[8px] border-black pb-4 leading-none text-black uppercase" style={{ transform: [{ skewX: '-6deg' }] }}>
          CONFIG
        </Text>

        <View className="gap-y-8">
          {/* IDENTITY SECTION */}
          <View className="bg-white border-[4px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <View className="absolute top-0 right-0 bg-black px-4 py-1 border-l-[4px] border-b-[4px] border-black">
              <Text className="text-white text-[10px] font-black tracking-widest uppercase">IDENTITY</Text>
            </View>
            
            <View className="flex-row items-center gap-5 mt-4">
              <View className="bg-brutalist-yellow border-[4px] border-black w-20 h-20 items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Text className="text-5xl">👤</Text>
              </View>
              <View className="flex-1">
                <TextInput 
                  value={name}
                  onChangeText={handleUpdateName}
                  placeholder="YOUR NAME"
                  className="text-2xl font-black text-black w-full border-b-4 border-black/20 p-1 uppercase"
                />
                <Text className="text-[12px] font-black text-black mt-2 tracking-widest uppercase">
                  JOINED {formattedDate}
                </Text>
              </View>
            </View>
          </View>

          {/* SUNDAY REFLECTION */}
          <View className="bg-white border-[4px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex-row justify-between items-center">
            <View className="flex-row items-center gap-4 flex-1">
              <Text className="text-4xl">🔔</Text>
              <View>
                <Text className="font-black text-xl uppercase leading-tight text-black">Sunday Reflection</Text>
                <Text className="text-[11px] font-black text-black opacity-80 uppercase">WEEKLY REMINDER @ 7:00 PM</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={toggleReminders}
              className="w-14 h-14 border-[4px] border-black bg-brutalist-yellow items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {stats.remindersEnabled && (
                <View className="w-6 h-6 bg-black" />
              )}
            </TouchableOpacity>
          </View>

          {/* PRIVACY MANIFESTO */}
          <View 
            className="bg-brutalist-red p-6 border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            style={{ transform: [{ rotate: '1deg' }] }}
          >
            <View className="flex-row items-center gap-4 mb-3">
              <Text className="text-3xl">🛡️</Text>
              <Text className="font-black text-2xl uppercase italic text-white">No Snitching Policy</Text>
            </View>
            <Text className="text-xs font-black leading-relaxed opacity-90 uppercase text-white">
              YOUR DATA IS STORED ON THIS DEVICE AND ONLY THIS DEVICE. WE DON'T WANT TO KNOW WHAT YOU BOUGHT AT THE DRIVE-THRU AT 3 AM.
            </Text>
          </View>

          {/* POLICY BUTTONS */}
          <View className="flex-row gap-2 w-full">
            <TouchableOpacity 
              onPress={showTerms}
              style={{ flex: 1 }}
              className="bg-white border-[3px] border-black py-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none items-center justify-center"
            >
              <Text className="text-[10px] font-black uppercase text-black text-center" numberOfLines={1}>Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={showPrivacy}
              style={{ flex: 1 }}
              className="bg-white border-[3px] border-black py-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none items-center justify-center"
            >
              <Text className="text-[10px] font-black uppercase text-black text-center" numberOfLines={1}>Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={showSupport}
              style={{ flex: 1 }}
              className="bg-white border-[3px] border-black py-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none items-center justify-center"
            >
              <Text className="text-[10px] font-black uppercase text-black text-center" numberOfLines={1}>Support</Text>
            </TouchableOpacity>
          </View>

          {/* ACTIONS */}
          <View className="pt-8 mt-4 border-t-[4px] border-black border-dashed gap-y-4">
            <TouchableOpacity 
              onPress={handleLogout}
              className="w-full bg-white border-[4px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex-row items-center justify-center gap-5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Text className="text-3xl">🚪</Text>
              <Text className="text-2xl font-black uppercase tracking-tighter text-black">Log Out</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleClear}
              className="w-full bg-black border-[4px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(226,18,55,1)] flex-row items-center justify-center gap-5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Text className="text-3xl">🗑️</Text>
              <Text className="text-2xl font-black uppercase tracking-tighter text-white">Clear My Food</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-16 items-center">
            <Text className="text-[10px] font-black text-black tracking-[0.2em] uppercase">Big Back App v1.0.0-MOBILE</Text>
            <Text className="mt-1 opacity-60 text-[10px] font-black text-black uppercase">Honesty is the only policy.</Text>
          </View>
        </View>
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}

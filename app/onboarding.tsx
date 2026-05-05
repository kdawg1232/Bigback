import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useStats } from '../contexts/StatsContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../hooks/useNotifications';
import * as Location from 'expo-location';

const TOTAL_STEPS = 7;

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationSkipped, setLocationSkipped] = useState(false);
  const { finishOnboarding, setRemindersEnabled, setLocationTrackingEnabled } = useStats();
  const { enableNotifications } = useNotifications();
  const router = useRouter();

  const requestNotifications = async () => {
    const success = await enableNotifications();
    if (success) {
      setNotificationsEnabled(true);
      setRemindersEnabled(true);
    }
  };

  const requestLocation = async () => {
    if (Platform.OS !== 'ios') {
      setLocationSkipped(true);
      return;
    }

    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      setLocationSkipped(true);
      return;
    }

    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus === 'granted') {
      setLocationGranted(true);
      setLocationTrackingEnabled(true);
    } else {
      // Foreground granted but background denied — still let them proceed
      setLocationSkipped(true);
    }
  };

  const handleFinish = () => {
    finishOnboarding();
    router.replace('/(tabs)/counter');
  };

  return (
    <SafeAreaView className="flex-1 bg-brutalist-beige" edges={['top', 'bottom']}>
      <View className="px-6 pt-4">
        {/* PROGRESS BAR */}
        <View className="flex-row gap-2 mb-4">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
            <View 
              key={s} 
              className={`h-4 flex-1 border-[3px] border-black ${step >= s ? 'bg-black' : 'bg-white'}`}
            />
          ))}
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View className="py-6">
          {/* STEP 1: Why Big Back? */}
          {step === 1 && (
            <View className="w-full">
              <Text className="text-3xl md:text-4xl font-black uppercase mb-6 leading-tight text-black tracking-tighter text-center">Why Big Back?</Text>
              
              <View className="gap-y-4 mb-8">
                <View 
                  className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left"
                  style={{ transform: [{ rotate: '1deg' }] }}
                >
                  <Text className="text-2xl mb-1">🍔</Text>
                  <Text className="font-black text-lg md:text-xl mb-0.5 uppercase text-black leading-tight">3-Second Entry</Text>
                  <Text className="text-[10px] md:text-[11px] font-black text-black leading-tight">Tap a logo, drop the price, and go.</Text>
                </View>

                <View 
                  className="bg-brutalist-purple border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left"
                  style={{ transform: [{ rotate: '-1deg' }] }}
                >
                  <Text className="text-2xl mb-1">🧾</Text>
                  <Text className="font-black text-lg md:text-xl mb-0.5 uppercase text-white leading-tight">The Receipt</Text>
                  <Text className="text-[10px] md:text-[11px] font-black text-white leading-tight">Your monthly damage as a digital receipt.</Text>
                </View>

                <View 
                  className="bg-brutalist-yellow border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left"
                  style={{ transform: [{ rotate: '1deg' }] }}
                >
                  <Text className="text-2xl mb-1">🛡️</Text>
                  <Text className="font-black text-lg md:text-xl mb-0.5 uppercase text-black leading-tight">Total Privacy</Text>
                  <Text className="text-[10px] md:text-[11px] font-black text-black leading-tight">Your data never leaves this phone.</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => setStep(2)}
                className="w-full bg-black border-[5px] border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <Text className="text-white text-xl font-black text-center uppercase">UNDERSTOOD.</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: The Mission */}
          {step === 2 && (
            <View className="w-full items-center">
              <Text className="text-[80px] md:text-[100px] mb-6 leading-none" style={{ transform: [{ rotate: '-12deg' }] }}>🍗</Text>
              <Text className="text-3xl md:text-4xl font-black uppercase mb-4 leading-tight text-black text-center">The Mission</Text>
              <Text className="text-base md:text-lg font-bold text-black opacity-90 mb-8 leading-snug text-center">
                This isn't a diet app. We're here to track the truth, the whole truth, and nothing but the 10-piece nugget.
              </Text>
              <TouchableOpacity 
                onPress={() => setStep(3)}
                className="w-full bg-brutalist-yellow border-[5px] border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <Text className="text-black text-xl font-black text-center uppercase">I'M READY</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: How It Works */}
          {step === 3 && (
            <View className="w-full items-center">
              <View className="relative mb-10 w-40 h-40 md:w-48 md:h-48 bg-white border-[5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] items-center justify-center">
                <Text className="text-5xl md:text-6xl">🌮</Text>
                <View 
                  className="absolute -top-5 -right-5 bg-brutalist-red border-[3px] border-black px-3 py-1.5"
                  style={{ transform: [{ rotate: '12deg' }] }}
                >
                  <Text className="text-white font-black text-sm">Cha-ching!</Text>
                </View>
              </View>
              <Text className="text-2xl md:text-3xl font-black uppercase mb-4 leading-tight text-black text-center">How It Works</Text>
              <Text className="text-base md:text-lg font-bold text-black opacity-90 mb-8 leading-snug text-center">
                Tap a logo at the drive-thru. Tell us what you spent. We'll handle the 'Big Back' status rankings.
              </Text>
              <TouchableOpacity 
                onPress={() => setStep(4)}
                className="w-full bg-brutalist-purple border-[5px] border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <Text className="text-white text-xl font-black text-center uppercase">GOT IT</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: Scan Your Receipts (NEW) */}
          {step === 4 && (
            <View className="w-full items-center">
              <View 
                className="bg-white border-[4px] border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8 w-full"
                style={{ transform: [{ rotate: '-2deg' }] }}
              >
                <View className="flex-row items-center gap-3 mb-3">
                  <Text className="text-3xl">📸</Text>
                  <View className="flex-1">
                    <Text className="text-[9px] font-black text-gray-400 uppercase">Auto-detected</Text>
                    <Text className="text-lg font-black uppercase text-black leading-tight">Taco Bell</Text>
                  </View>
                  <View className="bg-brutalist-yellow border-[3px] border-black px-3 py-1">
                    <Text className="font-black text-lg text-black">$12.47</Text>
                  </View>
                </View>
                <View className="h-[3px] bg-black/10 mb-2" />
                <Text className="text-[9px] font-black text-gray-400 uppercase">Receipt scanned successfully</Text>
              </View>

              <Text className="text-2xl md:text-3xl font-black uppercase mb-4 leading-tight text-black text-center">Scan Your Receipts</Text>
              <Text className="text-base md:text-lg font-bold text-black opacity-90 mb-8 leading-snug text-center">
                Hate typing? Just snap a photo of your receipt and we'll pull the total automatically.
              </Text>
              <TouchableOpacity 
                onPress={() => setStep(5)}
                className="w-full bg-black border-[5px] border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <Text className="text-white text-xl font-black text-center uppercase">COOL</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5: Restaurant Detection (NEW — location permission) */}
          {step === 5 && (
            <View className="w-full items-center">
              <View 
                className="bg-white border-[4px] border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 w-full"
                style={{ transform: [{ rotate: '2deg' }] }}
              >
                <Text className="text-[9px] font-black text-gray-400 mb-1 uppercase">Notification • Now</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">🍗</Text>
                  <Text className="text-lg md:text-xl font-black uppercase text-black leading-tight flex-1">Eating at Chick-fil-A? Tap to log.</Text>
                </View>
              </View>

              <Text className="text-2xl md:text-3xl font-black uppercase mb-4 leading-tight text-black text-center">Restaurant Detection</Text>
              <Text className="text-base md:text-lg font-bold text-black opacity-90 mb-4 leading-snug text-center">
                We can detect when you're at a restaurant and remind you to log — so you never forget.
              </Text>

              <View 
                className="bg-brutalist-red/10 border-[3px] border-brutalist-red/30 p-3 mb-6 w-full"
                style={{ transform: [{ rotate: '-1deg' }] }}
              >
                <Text className="text-[10px] font-black text-black opacity-80 leading-relaxed text-center uppercase">
                  🛡️ Your location data never leaves this device. We use it only to detect nearby restaurants — no tracking, no servers, no snitching.
                </Text>
              </View>

              <View className="gap-y-4 w-full">
                {!locationGranted && !locationSkipped && (
                  <>
                    <TouchableOpacity 
                      onPress={requestLocation}
                      className="w-full bg-green-500 border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                      <Text className="text-white text-base md:text-lg font-black text-center uppercase">ENABLE LOCATION</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => { setLocationSkipped(true); setStep(6); }}
                      className="w-full bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                      <Text className="text-black text-base md:text-lg font-black text-center uppercase">SKIP FOR NOW</Text>
                    </TouchableOpacity>
                  </>
                )}
                {(locationGranted || locationSkipped) && (
                  <TouchableOpacity 
                    onPress={() => setStep(6)}
                    className={`w-full border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${locationGranted ? 'bg-green-500' : 'bg-white'}`}
                  >
                    <Text className={`text-base md:text-lg font-black text-center uppercase ${locationGranted ? 'text-white' : 'text-black'}`}>
                      {locationGranted ? '✓ LOCATION ENABLED — NEXT' : 'CONTINUE'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* STEP 6: Earn Points (NEW) */}
          {step === 6 && (
            <View className="w-full items-center">
              <View className="flex-row gap-3 mb-8 justify-center flex-wrap">
                <View 
                  className="bg-brutalist-yellow border-[3px] border-black px-4 py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  style={{ transform: [{ rotate: '-3deg' }] }}
                >
                  <Text className="text-2xl text-center mb-1">🔥</Text>
                  <Text className="text-[10px] font-black uppercase text-black text-center">Sauce Goblin</Text>
                </View>
                <View 
                  className="bg-green-400 border-[3px] border-black px-4 py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  style={{ transform: [{ rotate: '2deg' }] }}
                >
                  <Text className="text-2xl text-center mb-1">💰</Text>
                  <Text className="text-[10px] font-black uppercase text-black text-center">Budget Survivor</Text>
                </View>
                <View 
                  className="bg-brutalist-purple border-[3px] border-black px-4 py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  style={{ transform: [{ rotate: '-1deg' }] }}
                >
                  <Text className="text-2xl text-center mb-1">🏆</Text>
                  <Text className="text-[10px] font-black uppercase text-white text-center">Streak Master</Text>
                </View>
              </View>

              <Text className="text-2xl md:text-3xl font-black uppercase mb-4 leading-tight text-black text-center">Earn Points</Text>
              <Text className="text-base md:text-lg font-bold text-black opacity-90 mb-8 leading-snug text-center">
                Track your habits, unlock badges, and see how your spending stacks up. The more you log, the more you earn.
              </Text>
              <TouchableOpacity 
                onPress={() => setStep(7)}
                className="w-full bg-brutalist-yellow border-[5px] border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <Text className="text-black text-xl font-black text-center uppercase">LET'S GO</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 7: Weekly Check-Ins (was step 4) */}
          {step === 7 && (
            <View className="w-full">
              <View 
                className="bg-white border-[4px] border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8"
                style={{ transform: [{ rotate: '2deg' }] }}
              >
                <Text className="text-[9px] font-black text-gray-400 mb-1 uppercase">Notification • Now</Text>
                <Text className="text-lg md:text-xl font-black uppercase text-black leading-tight">Sunday Reflection! How many times did you eat fast food since Wednesday?</Text>
              </View>
              <Text className="text-2xl md:text-3xl font-black uppercase mb-4 leading-tight text-black text-center">The Weekly Check-Ins</Text>
              <Text className="text-sm md:text-base font-bold text-black opacity-90 mb-8 leading-snug text-center">
                Life happens. If you forget to log, we'll nudge you twice a week—Wednesday and Sunday at 8 PM. Notifications are required to continue.
              </Text>
              <View className="gap-y-4 w-full">
                <TouchableOpacity 
                  onPress={requestNotifications}
                  disabled={notificationsEnabled}
                  className={`w-full border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${notificationsEnabled ? 'bg-green-500' : 'bg-white'}`}
                >
                  <Text className={`text-base md:text-lg font-black text-center uppercase ${notificationsEnabled ? 'text-white' : 'text-black'}`}>
                    {notificationsEnabled ? '✓ NOTIFICATIONS ENABLED' : 'ENABLE NOTIFICATIONS'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleFinish}
                  disabled={!notificationsEnabled}
                  className={`w-full border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${notificationsEnabled ? 'bg-brutalist-red active:translate-x-[2px] active:translate-y-[2px] active:shadow-none' : 'bg-gray-400 opacity-50'}`}
                >
                  <Text className="text-white text-base md:text-lg font-black text-center uppercase">
                    {notificationsEnabled ? "LET'S EAT" : "ENABLE NOTIFICATIONS TO CONTINUE"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <Text className="pb-4 text-[10px] font-black tracking-widest uppercase opacity-40 text-center text-black">
        Step {step} of {TOTAL_STEPS}
      </Text>
    </SafeAreaView>
  );
}

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStats } from '../../../contexts/StatsContext';
import { BRANDS, CUISINE_TYPES } from '../../../constants';
import { Brand } from '../../../types';
import { SafeAreaView } from 'react-native-safe-area-context';

const CUISINE_COLORS: Record<string, string> = {
  American: '#E21237',
  Mexican: '#663399',
  Coffee: '#00704A',
  Chicken: '#FF7900',
  Pizza: '#006491',
  Sandwiches: '#008C15',
  Bakery: '#485935',
  Dessert: '#0069B4',
  Chinese: '#D62300',
  Japanese: '#1A1A2E',
  Indian: '#E6A817',
  Italian: '#2D6A4F',
  Thai: '#9B2335',
  Korean: '#3D405B',
  Mediterranean: '#457B9D',
  Other: '#333333',
};

const CUISINE_EMOJIS: Record<string, string> = {
  American: '🍔',
  Mexican: '🌮',
  Coffee: '☕',
  Chicken: '🍗',
  Pizza: '🍕',
  Sandwiches: '🥖',
  Bakery: '🥯',
  Dessert: '🍦',
  Chinese: '🥡',
  Japanese: '🍣',
  Indian: '🍛',
  Italian: '🍝',
  Thai: '🍜',
  Korean: '🥘',
  Mediterranean: '🥙',
  Other: '🍽️',
};

export default function CuisineDetailScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const { stats } = useStats();

  const cuisineType = type || 'Other';
  const color = CUISINE_COLORS[cuisineType] || '#333';
  const emoji = CUISINE_EMOJIS[cuisineType] || '🍽️';

  const allBrands = useMemo(() => {
    return [...BRANDS, ...(stats.customBrands || [])];
  }, [stats.customBrands]);

  const detailData = useMemo(() => {
    let visits = 0;
    let spent = 0;
    let lastVisit: number | null = null;

    stats.history.forEach(entry => {
      const brand = allBrands.find(b => b.id === entry.brandId);
      const cuisine = brand?.cuisine || 'Other';
      if (cuisine === cuisineType) {
        visits += 1;
        spent += entry.amount;
        if (!lastVisit || entry.timestamp > lastVisit) {
          lastVisit = entry.timestamp;
        }
      }
    });

    const avg = visits > 0 ? spent / visits : 0;

    const cuisineBrands = allBrands.filter(b => b.cuisine === cuisineType);
    const brandVisits: Array<{ brand: Brand; visits: number; spent: number }> = [];
    for (const brand of cuisineBrands) {
      const entries = stats.history.filter(e => e.brandId === brand.id);
      if (entries.length > 0) {
        brandVisits.push({
          brand,
          visits: entries.length,
          spent: entries.reduce((s, e) => s + e.amount, 0),
        });
      }
    }
    brandVisits.sort((a, b) => b.spent - a.spent);

    return { visits, spent, lastVisit, avg, brandVisits };
  }, [cuisineType, allBrands, stats.history]);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  const formatTimeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'TODAY';
    if (days === 1) return 'YESTERDAY';
    if (days < 7) return `${days} DAYS AGO`;
    if (days < 30) return `${Math.floor(days / 7)} WEEKS AGO`;
    return `${Math.floor(days / 30)} MONTHS AGO`;
  };

  return (
    <SafeAreaView className="flex-1 bg-brutalist-beige" edges={['top']}>
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>

        {/* CUISINE HEADER */}
        <View
          className="border-[5px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 items-center mb-6"
          style={{ backgroundColor: color }}
        >
          <Text className="text-5xl mb-2">{emoji}</Text>
          <Text className="text-3xl font-black uppercase text-white text-center leading-tight">{cuisineType}</Text>
        </View>

        {/* STATS GRID */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <View className="flex-1 min-w-[45%] bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Text className="text-[9px] font-black uppercase text-black opacity-50 mb-1">TOTAL VISITS</Text>
            <Text className="text-3xl font-black text-black">{detailData.visits}</Text>
          </View>
          <View className="flex-1 min-w-[45%] bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Text className="text-[9px] font-black uppercase text-black opacity-50 mb-1">TOTAL SPENT</Text>
            <Text className="text-3xl font-black text-black">${detailData.spent.toFixed(2)}</Text>
          </View>
          <View className="flex-1 min-w-[45%] bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Text className="text-[9px] font-black uppercase text-black opacity-50 mb-1">AVG PER MEAL</Text>
            <Text className="text-3xl font-black text-black">${detailData.avg.toFixed(2)}</Text>
          </View>
          <View className="flex-1 min-w-[45%] bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Text className="text-[9px] font-black uppercase text-black opacity-50 mb-1">LAST VISIT</Text>
            <Text className="text-lg font-black text-black" numberOfLines={1} adjustsFontSizeToFit>
              {detailData.lastVisit ? formatTimeAgo(detailData.lastVisit) : 'NEVER'}
            </Text>
            {detailData.lastVisit && (
              <Text className="text-[9px] font-black text-black opacity-40 mt-0.5">
                {formatDate(detailData.lastVisit)}
              </Text>
            )}
          </View>
        </View>

        {/* RESTAURANTS IN THIS CUISINE */}
        {detailData.brandVisits.length > 0 && (
          <View className="mb-8">
            <Text className="text-sm font-black uppercase text-black tracking-widest mb-3">YOUR SPOTS</Text>
            <View className="gap-y-3">
              {detailData.brandVisits.map(({ brand, visits, spent }) => (
                <View
                  key={brand.id}
                  className="bg-white border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 flex-row items-center gap-3"
                >
                  <View
                    className="w-10 h-10 border-[2px] border-black items-center justify-center"
                    style={{ backgroundColor: brand.color }}
                  >
                    <Text className="text-lg">{brand.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-black uppercase text-black">{brand.name}</Text>
                    <Text className="text-[9px] font-black uppercase text-black opacity-50">
                      {visits} {visits === 1 ? 'VISIT' : 'VISITS'}
                    </Text>
                  </View>
                  <Text className="text-base font-black text-black">${spent.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {detailData.visits === 0 && (
          <View className="py-8 border-[4px] border-black border-dashed bg-white/50 items-center mb-6">
            <Text className="text-2xl mb-2">{emoji}</Text>
            <Text className="font-black uppercase text-sm text-black">NO {cuisineType.toUpperCase()} YET</Text>
            <Text className="text-[10px] font-black uppercase text-black opacity-60 mt-1">
              LOG A MEAL TO START TRACKING
            </Text>
          </View>
        )}

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}

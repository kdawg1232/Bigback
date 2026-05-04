import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useStats } from '../../contexts/StatsContext';
import { BRANDS } from '../../constants';
import { Brand } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CuisineData {
  cuisine: string;
  visits: number;
  spent: number;
}

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

export default function CuisineScreen() {
  const { stats } = useStats();
  const [tryNewModal, setTryNewModal] = useState(false);
  const [suggestedBrand, setSuggestedBrand] = useState<Brand | null>(null);

  const allBrands = useMemo(() => {
    return [...BRANDS, ...(stats.customBrands || [])];
  }, [stats.customBrands]);

  const cuisineData = useMemo(() => {
    const map: Record<string, CuisineData> = {};

    stats.history.forEach(entry => {
      const brand = allBrands.find(b => b.id === entry.brandId);
      const cuisine = brand?.cuisine || 'Other';
      if (!map[cuisine]) {
        map[cuisine] = { cuisine, visits: 0, spent: 0 };
      }
      map[cuisine].visits += 1;
      map[cuisine].spent += entry.amount;
    });

    return Object.values(map).sort((a, b) => b.spent - a.spent);
  }, [stats.history, allBrands]);

  const totalVisits = useMemo(() => {
    return cuisineData.reduce((sum, c) => sum + c.visits, 0);
  }, [cuisineData]);

  const maxSpent = useMemo(() => {
    return Math.max(...cuisineData.map(c => c.spent), 1);
  }, [cuisineData]);

  const handleTryNew = () => {
    const visitedIds = new Set(stats.history.map(e => e.brandId));
    const unvisited = allBrands.filter(b => !visitedIds.has(b.id) && b.id !== 'local');

    if (unvisited.length > 0) {
      const pick = unvisited[Math.floor(Math.random() * unvisited.length)];
      setSuggestedBrand(pick);
    } else {
      const visitCounts: Record<string, number> = {};
      stats.history.forEach(e => {
        visitCounts[e.brandId] = (visitCounts[e.brandId] || 0) + 1;
      });
      const sorted = allBrands
        .filter(b => b.id !== 'local')
        .sort((a, b) => (visitCounts[a.id] || 0) - (visitCounts[b.id] || 0));
      setSuggestedBrand(sorted[0] || null);
    }
    setTryNewModal(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-brutalist-beige" edges={['top']}>
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <Text
          className="text-4xl font-black mb-6 border-b-[8px] border-black pb-4 leading-none text-black uppercase"
          style={{ transform: [{ skewX: '-6deg' }] }}
        >
          CUISINE
        </Text>

        {/* TRY SOMETHING NEW */}
        <TouchableOpacity
          onPress={handleTryNew}
          className="bg-brutalist-yellow border-[4px] border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 items-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          style={{ transform: [{ rotate: '1deg' }] }}
        >
          <Text className="text-2xl mb-1">🎲</Text>
          <Text className="text-xl font-black uppercase text-black">TRY SOMETHING NEW</Text>
          <Text className="text-[10px] font-black uppercase text-black opacity-60 mt-1">
            WE'LL PICK A SPOT FOR YOU
          </Text>
        </TouchableOpacity>

        {/* CUISINE BREAKDOWN */}
        {cuisineData.length > 0 ? (
          <View className="gap-y-4 mb-10">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-black uppercase text-black tracking-widest">BREAKDOWN</Text>
              <Text className="text-[10px] font-black uppercase text-black opacity-60">
                {totalVisits} TOTAL VISITS
              </Text>
            </View>

            {cuisineData.map((item, idx) => {
              const barWidth = (item.spent / maxSpent) * 100;
              const color = CUISINE_COLORS[item.cuisine] || '#333';

              return (
                <View key={item.cuisine} className="bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <View
                    style={{ width: `${barWidth}%`, backgroundColor: color }}
                    className="absolute top-0 left-0 bottom-0 opacity-15"
                  />

                  <View className="p-4">
                    <View className="flex-row justify-between items-center mb-1">
                      <View className="flex-row items-center gap-2">
                        <View className="w-4 h-4 border-[2px] border-black" style={{ backgroundColor: color }} />
                        <Text className="text-base font-black uppercase text-black">{item.cuisine}</Text>
                      </View>
                      <Text className="text-base font-black text-black">${item.spent.toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-[10px] font-black uppercase text-black opacity-60">
                        {item.visits} {item.visits === 1 ? 'VISIT' : 'VISITS'}
                      </Text>
                      <Text className="text-[10px] font-black uppercase text-black opacity-60">
                        AVG ${(item.spent / item.visits).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="py-12 border-[4px] border-black border-dashed bg-white/50 items-center mb-10">
            <Text className="text-2xl mb-2">🍽️</Text>
            <Text className="font-black uppercase text-sm text-black">NO CUISINE DATA YET</Text>
            <Text className="text-[10px] font-black uppercase text-black opacity-60 mt-1">
              START LOGGING TO SEE YOUR BREAKDOWN
            </Text>
          </View>
        )}

        <View className="h-10" />
      </ScrollView>

      {/* TRY NEW MODAL */}
      <Modal visible={tryNewModal} transparent animationType="fade">
        <View className="flex-1 justify-center items-center p-4 bg-black/70">
          <View
            className="bg-white border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm p-6 items-center"
            style={{ transform: [{ rotate: '-2deg' }] }}
          >
            {suggestedBrand ? (
              <>
                <View
                  className="w-20 h-20 border-[4px] border-black items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  style={{ backgroundColor: suggestedBrand.color }}
                >
                  <Text className="text-4xl">{suggestedBrand.emoji}</Text>
                </View>
                <Text className="text-2xl font-black uppercase text-black text-center mb-2 leading-normal">
                  GO TRY{'\n'}{suggestedBrand.name}!
                </Text>
                <Text className="text-[10px] font-black uppercase text-black opacity-60 mb-1">
                  {suggestedBrand.cuisine}
                </Text>
                <Text className="text-xs font-black uppercase text-black opacity-60 text-center mt-2">
                  REPORT BACK WHEN YOU DO 🫡
                </Text>
              </>
            ) : (
              <Text className="text-base font-black uppercase text-black text-center">
                NO SUGGESTIONS AVAILABLE
              </Text>
            )}

            <TouchableOpacity
              onPress={() => setTryNewModal(false)}
              className="mt-6 bg-black border-[4px] border-black px-8 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Text className="text-white text-sm font-black uppercase">GOT IT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

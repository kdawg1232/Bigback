import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Dimensions } from 'react-native';
import { useStats } from '../../contexts/StatsContext';
import { BRANDS } from '../../constants';
import { Brand } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 32 - 32) / 3; // 3 columns with gap

export default function CounterScreen() {
  const { stats, addEntry } = useStats();
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [amountInput, setAmountInput] = useState('15.00');

  const daysSince = stats.lastIncidentDate 
    ? Math.floor((Date.now() - stats.lastIncidentDate) / (1000 * 60 * 60 * 24))
    : 0;

  const handleSubmit = () => {
    if (selectedBrand) {
      const val = parseFloat(amountInput);
      if (!isNaN(val)) {
        addEntry(selectedBrand.id, selectedBrand.name, val);
        setSelectedBrand(null);
        setAmountInput('15.00');
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brutalist-beige" edges={['top']}>
      <ScrollView className="flex-1 p-4">
        {/* HEADER TICKER */}
        <View 
          className="bg-brutalist-red border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 p-6 items-center"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          <Text className="text-white text-sm font-black tracking-tighter mb-2 uppercase opacity-80">Days Since Last Incident</Text>
          <Text className="text-7xl text-white font-black">
            {daysSince}
          </Text>
        </View>

        <View className="mb-6 flex-row items-center gap-2">
          <View className="h-[4px] flex-1 bg-black" />
          <View className="bg-black px-2 py-3" style={{ transform: [{ skewX: '-12deg' }] }}>
            <Text className="text-2xl font-black text-white uppercase whitespace-nowrap leading-normal">the food court</Text>
          </View>
          <View className="h-[4px] flex-1 bg-black" />
        </View>

        {/* BRAND GRID */}
        <View className="flex-row flex-wrap gap-4 pb-12 justify-center">
          {BRANDS.map((brand) => (
            <TouchableOpacity
              key={brand.id}
              onPress={() => setSelectedBrand(brand)}
              style={{ 
                backgroundColor: brand.color, 
                width: ITEM_WIDTH, 
                aspectRatio: 1 
              }}
              className="border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 justify-between items-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Text 
                className="w-full text-center text-[9px] font-black uppercase truncate leading-tight mb-1"
                style={{ color: brand.textColor }}
              >
                {brand.name}
              </Text>
              
              <Text className="text-3xl">
                {brand.emoji}
              </Text>

              <View className="mt-auto w-full bg-black items-center justify-center p-0.5 border-t-[3px] border-black">
                <Text className="text-white text-[12px] font-black">+</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={!!selectedBrand}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center p-4 bg-black/70">
          <View className="bg-brutalist-yellow border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm p-8 relative">
            <TouchableOpacity 
              onPress={() => setSelectedBrand(null)}
              className="absolute -top-4 -right-4 bg-white border-[4px] border-black w-10 h-10 items-center justify-center z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Text className="text-black font-black text-xl">×</Text>
            </TouchableOpacity>
            
            <Text className="text-4xl font-black leading-normal uppercase text-black mb-6 py-4">
              HOW MUCH{"\n"}DID YOU DROP{"\n"}AT <Text style={{ color: selectedBrand?.color }} className="text-black">{selectedBrand?.name}</Text>
              ?
            </Text>

            <View className="gap-y-6">
              <View className="flex-row items-center bg-white border-[5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Text className="text-4xl font-black text-black pl-4">$</Text>
                <TextInput 
                  keyboardType="numeric"
                  autoFocus
                  value={amountInput}
                  onChangeText={setAmountInput}
                  className="flex-1 py-4 px-2 text-4xl font-bold text-black"
                  style={{ includeFontPadding: false }}
                />
              </View>

              <TouchableOpacity 
                onPress={handleSubmit}
                className="w-full bg-black border-[5px] border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-row items-center justify-center gap-3 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <Text className="text-white text-2xl font-black uppercase">LOG</Text>
                <Text className="text-2xl">📉</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

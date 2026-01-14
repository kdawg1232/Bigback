import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useStats } from '../../contexts/StatsContext';
import { BRANDS } from '../../constants';
import { BrutalistReceipt } from '../../components/BrutalistReceipt';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReceiptScreen() {
  const { stats, deleteEntry } = useStats();
  const [view, setView] = useState<'monthly' | 'yearly'>('monthly');

  const filteredData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filtered = stats.history.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      if (view === 'monthly') {
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      } else {
        return entryDate.getFullYear() === currentYear;
      }
    });

    const total = filtered.reduce((sum, e) => sum + e.amount, 0);
    
    const counts: Record<string, { count: number; spent: number }> = {};
    filtered.forEach(entry => {
      if (!counts[entry.brandName]) {
        counts[entry.brandName] = { count: 0, spent: 0 };
      }
      counts[entry.brandName].count += 1;
      counts[entry.brandName].spent += entry.amount;
    });

    const top = Object.entries(counts)
      .sort((a, b) => b[1].spent - a[1].spent)
      .slice(0, 5);

    return { total, top, count: filtered.length };
  }, [stats.history, view]);

  const recentHistory = useMemo(() => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return stats.history.filter(entry => entry.timestamp >= sevenDaysAgo);
  }, [stats.history]);

  const getStatus = () => {
    const visits = filteredData.count;
    if (visits === 0) return "SOBER";
    if (visits < 10) return "AMATEUR MUNCHER";
    if (visits < 15) return "GLIZZY GLADIATOR";
    if (visits < 20) return "CERTIFIED BIG BACK";
    return "THE FINAL BOSS";
  };

  return (
    <SafeAreaView className="flex-1 bg-brutalist-purple" edges={['top']}>
      <ScrollView className="flex-1 p-6">
        {/* HEADER SECTION */}
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-white text-3xl md:text-4xl font-black uppercase tracking-tighter">
            YOUR RECEIPT
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity 
              onPress={() => setView(view === 'monthly' ? 'yearly' : 'monthly')}
              className="bg-white border-[4px] border-black w-10 h-10 md:w-12 md:h-12 items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Text className="font-black text-xl md:text-2xl text-black">
                {view === 'monthly' ? 'M' : 'Y'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* THE PHYSICAL RECEIPT */}
        <BrutalistReceipt className="p-6 md:p-8 pb-16 md:pb-24">
          <View className="items-center border-b-4 border-dashed border-black pb-6 mb-8">
            <Text className="text-xl md:text-2xl font-black tracking-widest uppercase text-black py-2">BIG BACK TRACKER</Text>
            <Text className="text-xs md:text-sm mt-1 uppercase font-bold text-black py-1">[{view} damage]</Text>
            <Text className="text-xs md:text-sm mt-1 uppercase text-black py-1">EST. {new Date(stats.memberSince).toLocaleDateString()}</Text>
            <Text className="text-xs mt-4 text-black">********************************</Text>
            <Text className="text-[10px] md:text-xs uppercase font-black text-black py-1">LOGGED BY: {stats.name}</Text>
            <Text className="text-xs text-black">********************************</Text>
          </View>

          <View className="mb-10 items-center">
            <Text className="text-xs md:text-sm font-black uppercase text-black py-1">TOTAL DAMAGE</Text>
            <Text className="text-4xl md:text-6xl font-black mt-2 leading-normal text-black text-center py-4">
              ${filteredData.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View className="mb-10">
            <View className="flex-row justify-between items-center border-b-2 border-black mb-4 pb-1">
              <Text className="text-sm font-black uppercase text-black">REPEATED FOOD PURCHASES</Text>
              <Text className="text-[10px] font-black text-black">$$$</Text>
            </View>
            
            <View className="gap-y-4">
              {filteredData.top.length > 0 ? filteredData.top.map(([name, data], idx) => (
                <View key={name} className="flex-col">
                  <View className="flex-row justify-between">
                    <Text className="uppercase text-sm font-black text-black">{idx + 1}. {name}</Text>
                    <Text className="text-sm font-black text-black">${data.spent.toFixed(2)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="uppercase text-[11px] font-black text-black">{data.count} VISITS</Text>
                    <Text className="text-[11px] font-black text-black">AVG: ${(data.spent / data.count).toFixed(2)}</Text>
                  </View>
                </View>
              )) : (
                <Text className="text-center text-xs font-black py-4 uppercase text-black">NO INCIDENTS REPORTED... YET.</Text>
              )}
            </View>
          </View>

          <View 
            className="bg-black p-6 items-center border-[3px] border-white/20 mb-8"
            style={{ transform: [{ rotate: '1deg' }] }}
          >
            <Text className="text-[10px] font-black tracking-widest mb-1 opacity-70 uppercase text-white">CURRENT STATUS</Text>
            <Text className="text-2xl font-black italic tracking-tighter uppercase text-white">{getStatus()}</Text>
          </View>

          <View className="items-center border-t-4 border-dashed border-black pt-6">
            <Text className="font-black uppercase text-black text-[10px]">THANKS FOR THE HONESTY</Text>
            <Text className="mt-1 uppercase font-black text-black text-[10px]">INCIDENTS: {filteredData.count}</Text>
          </View>
        </BrutalistReceipt>

        {/* 7-DAY AUDIT LOG */}
        <View className="bg-brutalist-yellow border-[4px] border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10">
          <Text className="text-3xl font-black uppercase tracking-tighter leading-normal border-b-4 border-black pb-2 text-black mb-1 py-2">
            RECENT AUDIT LOG
          </Text>
          <Text className="text-[10px] font-black uppercase text-black mb-4">
            Showing incidents from the last 7 days only
          </Text>
          
          <View className="gap-y-3">
            {recentHistory.length > 0 ? recentHistory.map((entry) => {
              const brand = BRANDS.find(b => b.id === entry.brandId);
              return (
                <View 
                  key={entry.id} 
                  className="bg-white border-[3px] border-black p-4 flex-row items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <View className="flex-row items-center gap-4">
                    <View 
                      className="w-12 h-12 border-[3px] border-black items-center justify-center"
                      style={{ backgroundColor: brand?.color || '#eee' }}
                    >
                      <Text className="text-2xl">{brand?.emoji || '🥡'}</Text>
                    </View>
                    <View>
                      <Text className="text-base font-black uppercase leading-tight text-black truncate max-w-[130px]">
                        {entry.brandName}
                      </Text>
                      <Text className="text-[11px] font-black text-black uppercase">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center gap-4">
                    <Text className="font-black text-xl text-black">${entry.amount.toFixed(2)}</Text>
                    <TouchableOpacity 
                      onPress={() => deleteEntry(entry.id)}
                      className="bg-brutalist-red w-10 h-10 items-center justify-center border-[3px] border-black active:bg-black"
                    >
                      <Text className="text-white font-black text-xl">×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }) : (
              <View className="py-8 border-[3px] border-black border-dashed bg-black/10">
                <Text className="font-black uppercase text-sm text-black italic text-center">No recent incidents in the last 7 days</Text>
              </View>
            )}
          </View>
        </View>
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}

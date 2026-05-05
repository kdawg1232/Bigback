import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Dimensions, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useStats } from '../../contexts/StatsContext';
import { BRANDS, CUISINE_TYPES } from '../../constants';
import { Brand } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BurnRateGauge } from '../../components/BurnRateGauge';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 32 - 32) / 3;

export default function CounterScreen() {
  const { stats, addEntry, addCustomBrand, addPinnedBrand, removePinnedBrand } = useStats();
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [amountInput, setAmountInput] = useState('15.00');
  const [showAddTile, setShowAddTile] = useState(false);
  const [addTileSearch, setAddTileSearch] = useState('');
  const [showAddLocal, setShowAddLocal] = useState(false);
  const [localName, setLocalName] = useState('');
  const [localEmoji, setLocalEmoji] = useState('🍴');
  const [localCuisine, setLocalCuisine] = useState('Other');
  const [geofenceBrands, setGeofenceBrands] = useState<Array<{ brandId: string; brandName: string }>>([]);
  const [showGeofencePicker, setShowGeofencePicker] = useState(false);
  const notifResponseListener = useRef<Notifications.EventSubscription | null>(null);

  const daysSince = stats.lastIncidentDate 
    ? Math.floor((Date.now() - stats.lastIncidentDate) / (1000 * 60 * 60 * 24))
    : 0;

  const allBrands = useMemo(() => {
    return [...BRANDS, ...stats.customBrands];
  }, [stats.customBrands]);

  const pinnedBrands = useMemo(() => {
    return stats.pinnedBrandIds
      .map(id => allBrands.find(b => b.id === id))
      .filter((b): b is Brand => b != null);
  }, [stats.pinnedBrandIds, allBrands]);

  const brandTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    stats.history.forEach(entry => {
      totals[entry.brandId] = (totals[entry.brandId] || 0) + entry.amount;
    });
    return totals;
  }, [stats.history]);

  const recentBrands = useMemo(() => {
    const seen = new Set<string>();
    const recents: { brand: Brand; lastAmount: number }[] = [];
    for (const entry of stats.history) {
      if (seen.has(entry.brandId)) continue;
      seen.add(entry.brandId);
      const brand = allBrands.find(b => b.id === entry.brandId);
      if (brand) {
        recents.push({ brand, lastAmount: entry.amount });
      }
      if (recents.length >= 5) break;
    }
    return recents;
  }, [stats.history, allBrands]);

  // Brands available to add (not already pinned)
  const availableBrands = useMemo(() => {
    const pinnedSet = new Set(stats.pinnedBrandIds);
    const list = allBrands.filter(b => !pinnedSet.has(b.id));
    if (!addTileSearch.trim()) return list;
    const q = addTileSearch.toLowerCase();
    return list.filter(b => b.name.toLowerCase().includes(q));
  }, [allBrands, stats.pinnedBrandIds, addTileSearch]);

  const handleSelectBrand = useCallback((brand: Brand, prefillAmount?: number) => {
    setSelectedBrand(brand);
    setAmountInput(prefillAmount != null ? prefillAmount.toFixed(2) : '15.00');
  }, []);

  useEffect(() => {
    notifResponseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        if (data?.type !== 'geofence' || !data?.nearbyBrands) return;

        const nearby: Array<{ brandId: string; brandName: string }> = data.nearbyBrands;
        if (nearby.length === 1) {
          const brand = allBrands.find((b) => b.id === nearby[0].brandId);
          if (brand) handleSelectBrand(brand);
        } else if (nearby.length > 1) {
          setGeofenceBrands(nearby);
          setShowGeofencePicker(true);
        }
      },
    );

    return () => {
      notifResponseListener.current?.remove();
    };
  }, [allBrands, handleSelectBrand]);

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

  const handleLongPressBrand = (brand: Brand) => {
    Alert.alert(
      `REMOVE ${brand.name}?`,
      'This only removes it from your grid. Your history is safe.',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'REMOVE',
          style: 'destructive',
          onPress: () => removePinnedBrand(brand.id),
        },
      ],
    );
  };

  const handleAddBrandToGrid = (brand: Brand) => {
    addPinnedBrand(brand.id);
    setShowAddTile(false);
    setAddTileSearch('');
  };

  const handleAddLocal = () => {
    if (!localName.trim()) return;
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newBrand: Brand = {
      id,
      name: localName.trim().toUpperCase(),
      color: '#555555',
      textColor: '#FFFFFF',
      emoji: localEmoji || '🍴',
      cuisine: localCuisine,
    };
    addCustomBrand(newBrand);
    addPinnedBrand(id);
    setShowAddLocal(false);
    setLocalName('');
    setLocalEmoji('🍴');
    setLocalCuisine('Other');
    setShowAddTile(false);
    setAddTileSearch('');
  };

  const currentMonthSpent = useMemo(() => {
    const now = new Date();
    return stats.history
      .filter(e => {
        const d = new Date(e.timestamp);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [stats.history]);

  return (
    <SafeAreaView className="flex-1 bg-brutalist-beige" edges={['top']}>
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* HEADER TICKER */}
        <View 
          className="bg-brutalist-red border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6 p-6 items-center"
          style={{ transform: [{ rotate: '-1deg' }] }}
        >
          <Text className="text-white text-sm font-black tracking-tighter mb-2 uppercase opacity-80">Days Since Last Incident</Text>
          <Text className="text-5xl md:text-7xl text-white font-black">
            {daysSince}
          </Text>
        </View>

        {/* BURN RATE GAUGE */}
        <BurnRateGauge spent={currentMonthSpent} budget={stats.monthlyBudget} />

        {/* RECENTS QUICK-ADD */}
        {recentBrands.length > 0 && (
          <View className="mb-5">
            <Text className="text-[10px] font-black uppercase tracking-widest text-black mb-2">QUICK RE-ORDER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-x-3">
              <View className="flex-row gap-3">
                {recentBrands.map(({ brand, lastAmount }) => (
                  <TouchableOpacity
                    key={brand.id}
                    onPress={() => handleSelectBrand(brand, lastAmount)}
                    style={{ backgroundColor: brand.color }}
                    className="border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-3 py-2 flex-row items-center gap-2 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    <Text className="text-lg">{brand.emoji}</Text>
                    <View>
                      <Text className="text-[9px] font-black uppercase" style={{ color: brand.textColor }} numberOfLines={1}>
                        {brand.name}
                      </Text>
                      <Text className="text-[11px] font-black" style={{ color: brand.textColor }}>
                        ${lastAmount.toFixed(2)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* SECTION HEADER */}
        <View className="mb-4 flex-row items-center gap-2">
          <View className="h-[4px] flex-1 bg-black" />
          <View className="bg-black px-2 py-3" style={{ transform: [{ skewX: '-12deg' }] }}>
            <Text className="text-xl md:text-2xl font-black text-white uppercase whitespace-nowrap leading-normal">the food court</Text>
          </View>
          <View className="h-[4px] flex-1 bg-black" />
        </View>

        {pinnedBrands.length === 0 && (
          <Text className="text-[10px] font-black uppercase tracking-widest text-black opacity-50 text-center mb-3">
            TAP + TO ADD YOUR FAVORITE SPOTS
          </Text>
        )}

        {/* PINNED BRAND GRID + ADD TILE */}
        <View className="flex-row flex-wrap gap-4 pb-12 justify-center">
          {pinnedBrands.map((brand) => (
            <TouchableOpacity
              key={brand.id}
              onPress={() => handleSelectBrand(brand)}
              onLongPress={() => handleLongPressBrand(brand)}
              delayLongPress={500}
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

              {brandTotals[brand.id] != null && brandTotals[brand.id] > 0 && (
                <Text
                  className="text-[10px] font-black"
                  style={{ color: brand.textColor, opacity: 0.85 }}
                >
                  ${brandTotals[brand.id].toFixed(0)}
                </Text>
              )}
              
              <Text className="text-2xl md:text-3xl">
                {brand.emoji}
              </Text>

              <View className="mt-auto w-full bg-black items-center justify-center p-0.5 border-t-[3px] border-black">
                <Text className="text-white text-[12px] font-black">+</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* ADD TILE PLACEHOLDER */}
          <TouchableOpacity
            onPress={() => setShowAddTile(true)}
            style={{ 
              width: ITEM_WIDTH, 
              aspectRatio: 1,
              borderWidth: 5,
              borderColor: '#000',
              borderStyle: 'dashed',
            }}
            className="bg-white/40 items-center justify-center active:bg-white/70"
          >
            <Text className="text-5xl font-black text-black/25 leading-none">+</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* AMOUNT ENTRY MODAL */}
      <Modal
        visible={!!selectedBrand}
        transparent={true}
        animationType="fade"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 justify-center items-center p-4 bg-black/70"
          >
            <View className="bg-brutalist-yellow border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm p-6 md:p-8 relative">
              <TouchableOpacity 
                onPress={() => setSelectedBrand(null)}
                className="absolute -top-4 -right-4 bg-white border-[4px] border-black w-10 h-10 items-center justify-center z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Text className="text-black font-black text-xl">×</Text>
              </TouchableOpacity>
              
              <Text className="text-2xl md:text-4xl font-black leading-normal uppercase text-black mb-6 py-2 md:py-4">
                HOW MUCH{"\n"}DID YOU DROP{"\n"}AT <Text style={{ color: selectedBrand?.color }} className="text-black">{selectedBrand?.name}</Text>
                ?
              </Text>

              <View className="gap-y-6">
                <View className="flex-row items-center bg-white border-[5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Text className="text-2xl md:text-4xl font-black text-black pl-4">$</Text>
                  <TextInput 
                    keyboardType="numeric"
                    autoFocus
                    value={amountInput}
                    onChangeText={setAmountInput}
                    className="flex-1 py-3 md:py-4 px-2 text-2xl md:text-4xl font-bold text-black"
                    style={{ includeFontPadding: false }}
                  />
                </View>

                <TouchableOpacity 
                  onPress={handleSubmit}
                  className="w-full bg-black border-[5px] border-black p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-row items-center justify-center gap-3 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <Text className="text-white text-xl md:text-2xl font-black uppercase">LOG</Text>
                  <Text className="text-xl md:text-2xl">📉</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ADD RESTAURANT TO GRID MODAL */}
      <Modal
        visible={showAddTile}
        transparent={true}
        animationType="fade"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 justify-end bg-black/70"
          >
            <View className="bg-brutalist-beige border-t-[6px] border-x-[6px] border-black rounded-t-2xl max-h-[80%]">
              <View className="p-5 pb-3">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-2xl font-black uppercase text-black leading-normal">ADD TO GRID</Text>
                  <TouchableOpacity
                    onPress={() => { setShowAddTile(false); setAddTileSearch(''); }}
                    className="bg-white border-[3px] border-black w-9 h-9 items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Text className="text-black font-black text-lg">×</Text>
                  </TouchableOpacity>
                </View>

                {/* SEARCH */}
                <View className="bg-white border-[4px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex-row items-center px-3 mb-3">
                  <Text className="text-lg mr-2">🔍</Text>
                  <TextInput
                    value={addTileSearch}
                    onChangeText={setAddTileSearch}
                    placeholder="SEARCH RESTAURANTS..."
                    placeholderTextColor="#999"
                    autoFocus
                    className="flex-1 py-3 text-sm font-black uppercase text-black"
                    style={{ includeFontPadding: false }}
                  />
                  {addTileSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setAddTileSearch('')}>
                      <Text className="text-black font-black text-lg">×</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* ADD LOCAL SPOT BUTTON */}
                <TouchableOpacity
                  onPress={() => setShowAddLocal(true)}
                  className="bg-black border-[3px] border-black p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex-row items-center justify-center gap-2 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none mb-3"
                >
                  <Text className="text-sm">📍</Text>
                  <Text className="text-white text-[11px] font-black uppercase">Add Custom / Local Spot</Text>
                </TouchableOpacity>
              </View>

              <ScrollView className="px-5 pb-8" showsVerticalScrollIndicator={false}>
                <View className="gap-y-2 pb-10">
                  {availableBrands.map((brand) => (
                    <TouchableOpacity
                      key={brand.id}
                      onPress={() => handleAddBrandToGrid(brand)}
                      style={{ backgroundColor: brand.color }}
                      className="border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3 flex-row items-center gap-3 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                      <Text className="text-xl">{brand.emoji}</Text>
                      <View className="flex-1">
                        <Text className="text-sm font-black uppercase" style={{ color: brand.textColor }}>
                          {brand.name}
                        </Text>
                        <Text className="text-[9px] font-black uppercase" style={{ color: brand.textColor, opacity: 0.7 }}>
                          {brand.cuisine}
                        </Text>
                      </View>
                      <Text className="text-lg" style={{ color: brand.textColor, opacity: 0.6 }}>+</Text>
                    </TouchableOpacity>
                  ))}
                  {availableBrands.length === 0 && (
                    <View className="py-6">
                      <Text className="text-center font-black text-sm uppercase text-black opacity-50">
                        {addTileSearch ? `NO MATCHES FOR "${addTileSearch}"` : 'ALL RESTAURANTS ADDED'}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ADD LOCAL RESTAURANT MODAL */}
      <Modal
        visible={showAddLocal}
        transparent={true}
        animationType="fade"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 justify-center items-center p-4 bg-black/70"
          >
            <View className="bg-white border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm p-6 relative">
              <TouchableOpacity
                onPress={() => setShowAddLocal(false)}
                className="absolute -top-4 -right-4 bg-white border-[4px] border-black w-10 h-10 items-center justify-center z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Text className="text-black font-black text-xl">×</Text>
              </TouchableOpacity>

              <Text className="text-2xl font-black uppercase text-black mb-6 leading-normal">ADD LOCAL SPOT</Text>

              <View className="gap-y-4">
                <View>
                  <Text className="text-[10px] font-black uppercase text-black mb-1">RESTAURANT NAME</Text>
                  <TextInput
                    value={localName}
                    onChangeText={setLocalName}
                    placeholder="E.G. JOE'S PIZZA"
                    placeholderTextColor="#999"
                    autoFocus
                    className="bg-brutalist-beige border-[4px] border-black p-3 text-sm font-black uppercase text-black"
                    style={{ includeFontPadding: false }}
                  />
                </View>

                <View>
                  <Text className="text-[10px] font-black uppercase text-black mb-1">EMOJI</Text>
                  <TextInput
                    value={localEmoji}
                    onChangeText={(t) => setLocalEmoji(t.slice(-2))}
                    className="bg-brutalist-beige border-[4px] border-black p-3 text-2xl text-center"
                    style={{ includeFontPadding: false }}
                  />
                </View>

                <View>
                  <Text className="text-[10px] font-black uppercase text-black mb-1">CUISINE TYPE</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {CUISINE_TYPES.map((c) => (
                        <TouchableOpacity
                          key={c}
                          onPress={() => setLocalCuisine(c)}
                          className={`border-[3px] border-black px-3 py-2 ${localCuisine === c ? 'bg-black' : 'bg-brutalist-beige'}`}
                        >
                          <Text className={`text-[10px] font-black uppercase ${localCuisine === c ? 'text-white' : 'text-black'}`}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <TouchableOpacity
                  onPress={handleAddLocal}
                  className="w-full bg-black border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] items-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none mt-2"
                >
                  <Text className="text-white text-lg font-black uppercase">ADD SPOT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* GEOFENCE PICKER MODAL */}
      <Modal
        visible={showGeofencePicker}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center p-4 bg-black/70">
          <View className="bg-white border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm p-6 relative">
            <TouchableOpacity
              onPress={() => { setShowGeofencePicker(false); setGeofenceBrands([]); }}
              className="absolute -top-4 -right-4 bg-white border-[4px] border-black w-10 h-10 items-center justify-center z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Text className="text-black font-black text-xl">×</Text>
            </TouchableOpacity>

            <Text className="text-2xl font-black uppercase text-black mb-2 leading-normal">WHERE ARE YOU?</Text>
            <Text className="text-[10px] font-black uppercase text-black opacity-60 mb-5">TAP THE RESTAURANT YOU'RE AT</Text>

            <View className="gap-y-3">
              {geofenceBrands.map((nb) => {
                const brand = allBrands.find((b) => b.id === nb.brandId);
                return (
                  <TouchableOpacity
                    key={nb.brandId}
                    onPress={() => {
                      setShowGeofencePicker(false);
                      setGeofenceBrands([]);
                      if (brand) handleSelectBrand(brand);
                    }}
                    style={{ backgroundColor: brand?.color || '#333' }}
                    className="border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-row items-center gap-3 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    <Text className="text-2xl">{brand?.emoji || '🍽️'}</Text>
                    <Text
                      className="text-lg font-black uppercase"
                      style={{ color: brand?.textColor || '#FFF' }}
                    >
                      {nb.brandName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

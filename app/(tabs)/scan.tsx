import React, { useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStats } from '../../contexts/StatsContext';
import { BRANDS } from '../../constants';
import { Brand } from '../../types';

let extractTextFromImage: ((uri: string) => Promise<any>) | null = null;
try {
  const mod = require('expo-text-extractor');
  extractTextFromImage = mod.extractTextFromImage;
} catch {}

function fuzzyMatch(input: string, brands: Brand[]): Brand | null {
  const normalized = input.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  let best: Brand | null = null;
  let bestScore = 0;

  for (const brand of brands) {
    const brandName = brand.name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const brandWords = brandName.split(/\s+/);

    if (normalized.includes(brandName)) return brand;

    for (const word of brandWords) {
      if (word.length >= 4 && normalized.includes(word)) {
        const score = word.length;
        if (score > bestScore) {
          bestScore = score;
          best = brand;
        }
      }
    }
  }
  return best;
}

function parseReceiptText(blocks: { text: string }[]): { amount: string | null; restaurantName: string | null } {
  const fullText = blocks.map(b => b.text).join('\n');
  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

  let amount: string | null = null;
  let restaurantName: string | null = null;

  const totalPatterns = [
    /(?:total|amount\s*due|balance\s*due|grand\s*total)\s*[:\s]*\$?\s*([\d]+\.[\d]{2})/i,
    /\$\s*([\d]+\.[\d]{2})\s*$/,
  ];

  for (let i = lines.length - 1; i >= 0; i--) {
    for (const pattern of totalPatterns) {
      const match = lines[i].match(pattern);
      if (match) {
        amount = match[1];
        break;
      }
    }
    if (amount) break;
  }

  if (!amount) {
    const allAmounts: { value: number; line: number }[] = [];
    lines.forEach((line, idx) => {
      const m = line.match(/\$?\s*([\d]+\.[\d]{2})/);
      if (m) allAmounts.push({ value: parseFloat(m[1]), line: idx });
    });
    if (allAmounts.length > 0) {
      const largest = allAmounts.reduce((a, b) => a.value > b.value ? a : b);
      amount = largest.value.toFixed(2);
    }
  }

  if (lines.length > 0) {
    restaurantName = lines[0];
  }

  return { amount, restaurantName };
}

export default function ScanScreen() {
  const { stats, addEntry } = useStats();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'camera' | 'processing' | 'confirm'>('camera');
  const [processing, setProcessing] = useState(false);
  const [parsedAmount, setParsedAmount] = useState('');
  const [matchedBrand, setMatchedBrand] = useState<Brand | null>(null);
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [rawText, setRawText] = useState('');
  const cameraRef = useRef<CameraView>(null);

  const allBrands = useMemo(() => {
    return [...BRANDS, ...(stats.customBrands || [])];
  }, [stats.customBrands]);

  const processImage = async (uri: string) => {
    setProcessing(true);
    setMode('processing');

    try {
      if (!extractTextFromImage) {
        setRawText('OCR not available on this device');
        setParsedAmount('');
        setMatchedBrand(null);
        setMode('confirm');
        return;
      }

      const result = await extractTextFromImage(uri);
      const blocks: { text: string }[] = Array.isArray(result)
        ? result.map((item: any) => ({ text: typeof item === 'string' ? item : item?.text ?? '' }))
        : [];
      const fullText = blocks.map(b => b.text).join('\n');
      setRawText(fullText);

      const { amount, restaurantName } = parseReceiptText(blocks);
      setParsedAmount(amount || '');

      const match = fuzzyMatch(fullText, allBrands);
      setMatchedBrand(match);

      setMode('confirm');
    } catch (e) {
      console.error('OCR error:', e);
      setRawText('Failed to read receipt');
      setParsedAmount('');
      setMatchedBrand(null);
      setMode('confirm');
    } finally {
      setProcessing(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo?.uri) processImage(photo.uri);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      processImage(result.assets[0].uri);
    }
  };

  const handleConfirm = () => {
    if (!matchedBrand || !parsedAmount) return;
    const val = parseFloat(parsedAmount);
    if (isNaN(val)) return;
    addEntry(matchedBrand.id, matchedBrand.name, val);
    resetState();
  };

  const resetState = () => {
    setMode('camera');
    setParsedAmount('');
    setMatchedBrand(null);
    setRawText('');
    setShowBrandPicker(false);
  };

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-brutalist-beige items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-brutalist-beige p-6 items-center justify-center" edges={['top']}>
        <View className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 items-center">
          <Text className="text-4xl mb-4">📸</Text>
          <Text className="text-xl font-black uppercase text-black text-center mb-4 leading-normal">
            CAMERA ACCESS NEEDED
          </Text>
          <Text className="text-[10px] font-black uppercase text-black opacity-60 text-center mb-6">
            WE NEED YOUR CAMERA TO SCAN RECEIPTS. YOUR PHOTOS STAY ON YOUR DEVICE.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            className="bg-black border-[4px] border-black px-8 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <Text className="text-white text-sm font-black uppercase">ENABLE CAMERA</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePickImage} className="mt-4">
            <Text className="text-xs font-black uppercase text-black underline">OR PICK FROM GALLERY</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'processing') {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#FFC72C" />
        <Text className="text-white font-black uppercase text-sm mt-4">READING YOUR RECEIPT...</Text>
      </SafeAreaView>
    );
  }

  if (mode === 'confirm') {
    return (
      <SafeAreaView className="flex-1 bg-brutalist-beige" edges={['top']}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
              <Text className="text-3xl font-black uppercase text-black mb-6 leading-normal">CONFIRM SCAN</Text>

              {/* MATCHED BRAND */}
              <View className="mb-4">
                <Text className="text-[10px] font-black uppercase text-black mb-1">RESTAURANT</Text>
                <TouchableOpacity
                  onPress={() => setShowBrandPicker(true)}
                  className="bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-row items-center justify-between"
                >
                  {matchedBrand ? (
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-10 h-10 border-[3px] border-black items-center justify-center"
                        style={{ backgroundColor: matchedBrand.color }}
                      >
                        <Text className="text-lg">{matchedBrand.emoji}</Text>
                      </View>
                      <Text className="text-sm font-black uppercase text-black">{matchedBrand.name}</Text>
                    </View>
                  ) : (
                    <Text className="text-sm font-black uppercase text-black opacity-40">TAP TO SELECT</Text>
                  )}
                  <Text className="text-black font-black">▼</Text>
                </TouchableOpacity>
              </View>

              {/* AMOUNT */}
              <View className="mb-6">
                <Text className="text-[10px] font-black uppercase text-black mb-1">AMOUNT</Text>
                <View className="flex-row items-center bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Text className="text-2xl font-black text-black pl-4">$</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={parsedAmount}
                    onChangeText={setParsedAmount}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    className="flex-1 py-3 px-2 text-2xl font-bold text-black"
                    style={{ includeFontPadding: false }}
                  />
                </View>
              </View>

              {/* RAW TEXT PREVIEW */}
              {rawText ? (
                <View className="mb-6 bg-white/50 border-[3px] border-black border-dashed p-3">
                  <Text className="text-[10px] font-black uppercase text-black mb-1 opacity-60">RAW OCR TEXT</Text>
                  <Text className="text-[10px] text-black" numberOfLines={8}>
                    {rawText}
                  </Text>
                </View>
              ) : null}

              {/* ACTIONS */}
              <View className="gap-y-3">
                <TouchableOpacity
                  onPress={handleConfirm}
                  disabled={!matchedBrand || !parsedAmount}
                  className={`w-full border-[4px] border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] items-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${matchedBrand && parsedAmount ? 'bg-black' : 'bg-gray-400'}`}
                >
                  <Text className="text-white text-lg font-black uppercase">LOG THIS</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={resetState}
                  className="w-full bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] items-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <Text className="text-black text-sm font-black uppercase">SCAN AGAIN</Text>
                </TouchableOpacity>
              </View>

              <View className="h-10" />
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>

        {/* BRAND PICKER MODAL */}
        <Modal visible={showBrandPicker} transparent animationType="fade">
          <View className="flex-1 justify-end bg-black/70">
            <View className="bg-white border-t-[6px] border-black max-h-[70%]">
              <View className="flex-row justify-between items-center p-4 border-b-[3px] border-black">
                <Text className="text-lg font-black uppercase text-black">PICK RESTAURANT</Text>
                <TouchableOpacity onPress={() => setShowBrandPicker(false)}>
                  <Text className="text-black font-black text-2xl">×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView className="p-4">
                <View className="gap-y-2 pb-8">
                  {allBrands.map((brand) => (
                    <TouchableOpacity
                      key={brand.id}
                      onPress={() => {
                        setMatchedBrand(brand);
                        setShowBrandPicker(false);
                      }}
                      className="flex-row items-center gap-3 p-3 border-[3px] border-black bg-brutalist-beige active:bg-black"
                    >
                      <View
                        className="w-10 h-10 border-[2px] border-black items-center justify-center"
                        style={{ backgroundColor: brand.color }}
                      >
                        <Text>{brand.emoji}</Text>
                      </View>
                      <Text className="text-sm font-black uppercase text-black">{brand.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // CAMERA MODE
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View className="p-6 pt-4">
              <Text className="text-white text-2xl font-black uppercase text-center" style={{ textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 }}>
                SCAN RECEIPT
              </Text>
              <Text className="text-white text-[10px] font-black uppercase text-center mt-1 opacity-80" style={{ textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }}>
                CENTER THE RECEIPT IN FRAME
              </Text>
            </View>

            {/* Guide frame */}
            <View style={{ flex: 1, marginHorizontal: 32, marginVertical: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 4 }} />

            {/* Controls */}
            <View className="p-6 pb-8 items-center gap-y-4">
              <TouchableOpacity
                onPress={handleCapture}
                className="w-20 h-20 rounded-full bg-white border-[6px] border-brutalist-yellow items-center justify-center active:scale-95"
              >
                <View className="w-14 h-14 rounded-full bg-white border-[3px] border-black" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickImage}
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' }}
              >
                <Text className="text-white text-xs font-black uppercase">PICK FROM GALLERY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

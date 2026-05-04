import React from 'react';
import { View, Text } from 'react-native';

interface BurnRateGaugeProps {
  spent: number;
  budget: number | null;
}

export function BurnRateGauge({ spent, budget }: BurnRateGaugeProps) {
  if (budget == null || budget <= 0) {
    return (
      <View className="bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-5 items-center">
        <Text className="text-[10px] font-black uppercase text-black tracking-widest">
          SET YOUR MONTHLY LIMIT IN CONFIG
        </Text>
      </View>
    );
  }

  const remaining = Math.max(0, budget - spent);
  const pct = Math.min(spent / budget, 1);
  const fillPct = Math.min(pct * 100, 100);
  const overBudget = spent > budget;

  let fillColor = '#22C55E';
  if (pct > 0.75) fillColor = '#EF4444';
  else if (pct > 0.5) fillColor = '#EAB308';

  if (overBudget) fillColor = '#EF4444';

  return (
    <View className="bg-white border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-5">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-[10px] font-black uppercase tracking-widest text-black">
          {overBudget ? '⚠️ OVER BUDGET' : 'MONTHLY BURN RATE'}
        </Text>
        <Text className="text-[10px] font-black uppercase text-black">
          {Math.round(pct * 100)}% USED
        </Text>
      </View>

      <View className="h-8 bg-brutalist-beige border-[3px] border-black overflow-hidden">
        <View
          style={{ width: `${fillPct}%`, backgroundColor: fillColor }}
          className="h-full"
        />
      </View>

      <View className="flex-row justify-between mt-2">
        <Text className="text-xs font-black text-black">
          ${spent.toFixed(0)} SPENT
        </Text>
        <Text className="text-xs font-black text-black">
          {overBudget
            ? `$${(spent - budget).toFixed(0)} OVER`
            : `$${remaining.toFixed(0)} LEFT`}
        </Text>
      </View>
    </View>
  );
}

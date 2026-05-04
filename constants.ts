import { Brand } from './types';

export const BRANDS: Brand[] = [
  { id: 'mcdonalds', name: "McDonald's", color: '#FFC72C', textColor: '#000000', emoji: '🍟', cuisine: 'American' },
  { id: 'starbucks', name: 'Starbucks', color: '#00704A', textColor: '#FFFFFF', emoji: '☕', cuisine: 'Coffee' },
  { id: 'chick-fil-a', name: 'Chick-fil-A', color: '#E21237', textColor: '#FFFFFF', emoji: '🍗', cuisine: 'Chicken' },
  { id: 'taco-bell', name: 'Taco Bell', color: '#663399', textColor: '#FFFFFF', emoji: '🌮', cuisine: 'Mexican' },
  { id: 'wendys', name: "Wendy's", color: '#E21237', textColor: '#FFFFFF', emoji: '🍔', cuisine: 'American' },
  { id: 'dunkin', name: 'Dunkin', color: '#FF671F', textColor: '#FFFFFF', emoji: '🍩', cuisine: 'Coffee' },
  { id: 'burger-king', name: 'Burger King', color: '#F5EB16', textColor: '#D62300', emoji: '👑', cuisine: 'American' },
  { id: 'subway', name: 'Subway', color: '#008C15', textColor: '#FFC600', emoji: '🥖', cuisine: 'Sandwiches' },
  { id: 'dominos', name: "Domino's", color: '#006491', textColor: '#FFFFFF', emoji: '🍕', cuisine: 'Pizza' },
  { id: 'chipotle', name: 'Chipotle', color: '#451400', textColor: '#FFFFFF', emoji: '🌯', cuisine: 'Mexican' },
  { id: 'sonic', name: 'Sonic', color: '#E31837', textColor: '#FFFFFF', emoji: '🥤', cuisine: 'American' },
  { id: 'pizza-hut', name: 'Pizza Hut', color: '#EE3124', textColor: '#FFFFFF', emoji: '🍕', cuisine: 'Pizza' },
  { id: 'panera', name: 'Panera', color: '#485935', textColor: '#FFFFFF', emoji: '🥯', cuisine: 'Bakery' },
  { id: 'popeyes', name: 'Popeyes', color: '#FF7900', textColor: '#FFFFFF', emoji: '🍗', cuisine: 'Chicken' },
  { id: 'kfc', name: 'KFC', color: '#A3080C', textColor: '#FFFFFF', emoji: '🍗', cuisine: 'Chicken' },
  { id: 'dairy-queen', name: 'Dairy Queen', color: '#0069B4', textColor: '#FFFFFF', emoji: '🍦', cuisine: 'Dessert' },
  { id: 'arbys', name: "Arby's", color: '#D61F28', textColor: '#FFFFFF', emoji: '🥪', cuisine: 'Sandwiches' },
  { id: 'little-caesars', name: 'Little Caesars', color: '#FF7A00', textColor: '#FFFFFF', emoji: '🍕', cuisine: 'Pizza' },
  { id: 'jack-in-the-box', name: 'Jack in the Box', color: '#000000', textColor: '#FFFFFF', emoji: '📦', cuisine: 'American' },
  { id: 'raising-canes', name: "Raising Cane's", color: '#F4E7D7', textColor: '#84202B', emoji: '🍗', cuisine: 'Chicken' },
  { id: 'local', name: 'Local/Other', color: '#333333', textColor: '#FFFFFF', emoji: '🥡', cuisine: 'Other' },
];

export const CUISINE_TYPES = [
  'American', 'Mexican', 'Coffee', 'Chicken', 'Pizza',
  'Sandwiches', 'Bakery', 'Dessert', 'Chinese', 'Japanese',
  'Indian', 'Italian', 'Thai', 'Korean', 'Mediterranean', 'Other',
] as const;

export const COMPARISONS = [
  { name: 'streaming subscriptions', unitCost: 15, emoji: '📺' },
  { name: 'new sneakers', unitCost: 80, emoji: '👟' },
  { name: 'concert tickets', unitCost: 50, emoji: '🎵' },
  { name: 'Chipotle burritos', unitCost: 12, emoji: '🌯' },
  { name: 'gallons of gas', unitCost: 4, emoji: '⛽' },
  { name: 'movie tickets', unitCost: 15, emoji: '🎬' },
  { name: 'gym memberships', unitCost: 30, emoji: '💪' },
  { name: 'books', unitCost: 15, emoji: '📚' },
  { name: 'Spotify months', unitCost: 12, emoji: '🎧' },
  { name: 'large pizzas', unitCost: 18, emoji: '🍕' },
];

export const STORAGE_KEY = 'big_back_app_data_v1';
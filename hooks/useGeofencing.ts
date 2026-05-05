import { useEffect, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { searchLocation, LocationSearchResult } from 'expo-apple-mapkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRANDS } from '../constants';
import { Brand } from '../types';

const GEOFENCING_TASK = 'bigback-geofencing';
const CLUSTER_STORAGE_KEY = 'bigback_geofence_clusters';
const COOLDOWN_STORAGE_KEY = 'bigback_geofence_cooldowns';
const GEOFENCE_RADIUS = 50;
const MAX_REGIONS = 18;
const CLUSTER_WINDOW_MS = 10_000;
const DWELL_SECONDS = 290; // 5 min minus 10s cluster window
const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
const NIGHT_START = 23;
const NIGHT_END = 7;

interface NearbyBrand {
  brandId: string;
  brandName: string;
}

interface ClusterEntry {
  regionId: string;
  brandId: string;
  brandName: string;
  timestamp: number;
}

interface ClusterState {
  entries: ClusterEntry[];
  windowStart: number;
  notificationId: string | null;
  exited: string[]; // regionIds that have been exited
}

function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= NIGHT_START || hour < NIGHT_END;
}

function fuzzyMatchBrand(
  name: string,
  allBrands: Brand[],
): Brand | null {
  const lower = name.toLowerCase();
  for (const brand of allBrands) {
    const brandLower = brand.name.toLowerCase();
    if (lower.includes(brandLower) || brandLower.includes(lower)) {
      return brand;
    }
  }
  // Partial keyword matching for common brand names
  const keywords: Record<string, string> = {
    mcdonald: 'mcdonalds',
    'chick-fil': 'chick-fil-a',
    chickfil: 'chick-fil-a',
    'taco bell': 'taco-bell',
    starbuck: 'starbucks',
    wendy: 'wendys',
    'burger king': 'burger-king',
    domino: 'dominos',
    'pizza hut': 'pizza-hut',
    chipotle: 'chipotle',
    panera: 'panera',
    popeye: 'popeyes',
    'dairy queen': 'dairy-queen',
    arby: 'arbys',
    'little caesar': 'little-caesars',
    'jack in': 'jack-in-the-box',
    'raising cane': 'raising-canes',
    dunkin: 'dunkin',
    subway: 'subway',
    sonic: 'sonic',
  };
  for (const [keyword, brandId] of Object.entries(keywords)) {
    if (lower.includes(keyword)) {
      return allBrands.find((b) => b.id === brandId) ?? null;
    }
  }
  return null;
}

async function getClusterState(): Promise<ClusterState | null> {
  try {
    const raw = await AsyncStorage.getItem(CLUSTER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setClusterState(state: ClusterState | null): Promise<void> {
  try {
    if (state) {
      await AsyncStorage.setItem(CLUSTER_STORAGE_KEY, JSON.stringify(state));
    } else {
      await AsyncStorage.removeItem(CLUSTER_STORAGE_KEY);
    }
  } catch {}
}

async function isOnCooldown(regionId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (!raw) return false;
    const cooldowns: Record<string, number> = JSON.parse(raw);
    const lastTime = cooldowns[regionId];
    if (!lastTime) return false;
    return Date.now() - lastTime < COOLDOWN_MS;
  } catch {
    return false;
  }
}

async function setCooldown(regionIds: string[]): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(COOLDOWN_STORAGE_KEY);
    const cooldowns: Record<string, number> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    for (const id of regionIds) {
      cooldowns[id] = now;
    }
    // Prune old entries
    for (const key of Object.keys(cooldowns)) {
      if (now - cooldowns[key] > COOLDOWN_MS) delete cooldowns[key];
    }
    await AsyncStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(cooldowns));
  } catch {}
}

async function scheduleClusterNotification(
  cluster: ClusterState,
): Promise<string | null> {
  if (isNightTime()) return null;

  const activeEntries = cluster.entries.filter(
    (e) => !cluster.exited.includes(e.regionId),
  );
  if (activeEntries.length === 0) return null;

  // Check for existing scheduled geofence notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const hasExisting = scheduled.some(
    (n) => (n.content.data as any)?.type === 'geofence',
  );
  if (hasExisting) return null;

  const nearbyBrands: NearbyBrand[] = activeEntries.map((e) => ({
    brandId: e.brandId,
    brandName: e.brandName,
  }));

  const isSingle = nearbyBrands.length === 1;

  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: isSingle
        ? `Eating at ${nearbyBrands[0].brandName}?`
        : '🍔 Eating out?',
      body: 'Tap here to log your spend.',
      sound: true,
      data: {
        type: 'geofence',
        nearbyBrands,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: DWELL_SECONDS,
    },
  });

  // Set cooldown for all regions in this cluster so they don't re-trigger for 2 hours
  await setCooldown(activeEntries.map((e) => e.regionId));

  return notifId;
}

// Background task definition — must be at module scope
TaskManager.defineTask(GEOFENCING_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[Geofencing] Task error:', error.message);
    return;
  }

  const { eventType, region } = data as {
    eventType: Location.LocationGeofencingEventType;
    region: Location.LocationRegion;
  };

  if (!region.identifier) return;

  // Parse brandId and brandName from identifier (format: "brandId::brandName")
  const [brandId, brandName] = region.identifier.split('::');
  if (!brandId || !brandName) return;

  if (eventType === Location.GeofencingEventType.Enter) {
    if (await isOnCooldown(region.identifier)) return;

    let cluster = await getClusterState();
    const now = Date.now();

    if (cluster && now - cluster.windowStart > CLUSTER_WINDOW_MS + DWELL_SECONDS * 1000) {
      cluster = null;
    }

    if (!cluster || now - cluster.windowStart > CLUSTER_WINDOW_MS) {
      // Start a new cluster — schedule notification immediately
      cluster = {
        entries: [{ regionId: region.identifier, brandId, brandName, timestamp: now }],
        windowStart: now,
        notificationId: null,
        exited: [],
      };

      const notifId = await scheduleClusterNotification(cluster);
      cluster.notificationId = notifId;
      await setClusterState(cluster);
    } else {
      // Within the cluster window — another geofence entered nearby.
      // Cancel existing notification and reschedule with updated list.
      if (cluster.notificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(cluster.notificationId);
        } catch {}
      }

      cluster.entries.push({
        regionId: region.identifier,
        brandId,
        brandName,
        timestamp: now,
      });

      const notifId = await scheduleClusterNotification(cluster);
      cluster.notificationId = notifId;
      await setClusterState(cluster);
    }
  } else if (eventType === Location.GeofencingEventType.Exit) {
    const cluster = await getClusterState();
    if (!cluster) return;

    cluster.exited.push(region.identifier);

    const allExited = cluster.entries.every((e) =>
      cluster.exited.includes(e.regionId),
    );

    if (allExited && cluster.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(cluster.notificationId);
      await setClusterState(null);
    } else {
      await setClusterState(cluster);
    }
  }
});

export function useGeofencing(enabled: boolean) {
  const appStateRef = useRef(AppState.currentState);

  const searchAndRegisterGeofences = useCallback(async () => {
    if (!enabled || Platform.OS !== 'ios') return;

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const searchRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.05, // ~5.5km
        longitudeDelta: 0.05,
      };

      // Search for each brand near current location
      const allBrands = BRANDS.filter((b) => b.id !== 'local');
      const foundRegions: Array<{
        identifier: string;
        latitude: number;
        longitude: number;
        distance: number;
        brand: Brand;
      }> = [];

      const searchPromises = allBrands.map(async (brand) => {
        try {
          const results: LocationSearchResult[] = await searchLocation(
            brand.name,
            { region: searchRegion, resultLimit: 3 },
          );

          for (const result of results) {
            const matched = fuzzyMatchBrand(result.name, allBrands);
            if (!matched) continue;

            const lat = result.placemark.coordinate.latitude;
            const lng = result.placemark.coordinate.longitude;
            const dist = getDistance(latitude, longitude, lat, lng);

            if (dist <= 3000) {
              foundRegions.push({
                identifier: `${matched.id}::${matched.name}`,
                latitude: lat,
                longitude: lng,
                distance: dist,
                brand: matched,
              });
            }
          }
        } catch {
          // Individual search failures are non-fatal
        }
      });

      await Promise.all(searchPromises);

      // Deduplicate by location (within 30m = same restaurant)
      const deduped = deduplicateRegions(foundRegions);

      // Sort by distance and take top MAX_REGIONS
      deduped.sort((a, b) => a.distance - b.distance);
      const topRegions = deduped.slice(0, MAX_REGIONS);

      if (topRegions.length === 0) return;

      const regions: Location.LocationRegion[] = topRegions.map((r) => ({
        identifier: r.identifier,
        latitude: r.latitude,
        longitude: r.longitude,
        radius: GEOFENCE_RADIUS,
        notifyOnEnter: true,
        notifyOnExit: true,
      }));

      await Location.startGeofencingAsync(GEOFENCING_TASK, regions);
    } catch (e) {
      console.error('[Geofencing] Error setting up geofences:', e);
    }
  }, [enabled]);

  // Set up geofences on mount and app foreground
  useEffect(() => {
    if (!enabled || Platform.OS !== 'ios') return;

    searchAndRegisterGeofences();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        searchAndRegisterGeofences();
      }
      appStateRef.current = nextState;
    });

    return () => sub.remove();
  }, [enabled, searchAndRegisterGeofences]);

  const enableGeofencing = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') return false;

    const { status: fgStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') return false;

    const { status: bgStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== 'granted') return false;

    await searchAndRegisterGeofences();
    return true;
  }, [searchAndRegisterGeofences]);

  const disableGeofencing = useCallback(async () => {
    try {
      const isRegistered =
        await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK);
      if (isRegistered) {
        await Location.stopGeofencingAsync(GEOFENCING_TASK);
      }
      // Cancel any pending geofence notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if ((notif.content.data as any)?.type === 'geofence') {
          await Notifications.cancelScheduledNotificationAsync(
            notif.identifier,
          );
        }
      }
      await setClusterState(null);
    } catch (e) {
      console.error('[Geofencing] Error disabling:', e);
    }
  }, []);

  return {
    enableGeofencing,
    disableGeofencing,
    refreshGeofences: searchAndRegisterGeofences,
  };
}

function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deduplicateRegions<
  T extends { latitude: number; longitude: number; identifier: string },
>(regions: T[]): T[] {
  const result: T[] = [];
  for (const region of regions) {
    const isDup = result.some(
      (r) =>
        r.identifier === region.identifier &&
        getDistance(r.latitude, r.longitude, region.latitude, region.longitude) <
          30,
    );
    if (!isDup) result.push(region);
  }
  return result;
}

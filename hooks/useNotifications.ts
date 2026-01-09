import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Unique identifier for our weekly notification
const WEEKLY_NOTIFICATION_ID = 'sunday-reflection';

export interface NotificationState {
  hasPermission: boolean | null;
  isLoading: boolean;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    hasPermission: null,
    isLoading: true,
  });

  // Check current permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    if (!Device.isDevice) {
      // Running on simulator - notifications won't work
      setState({ hasPermission: false, isLoading: false });
      return;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      setState({ hasPermission: status === 'granted', isLoading: false });
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      setState({ hasPermission: false, isLoading: false });
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) {
      Alert.alert(
        'Simulator Detected',
        'Push notifications only work on physical devices. Please test on a real device.',
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        setState(prev => ({ ...prev, hasPermission: true }));
        return true;
      }

      // Request permission
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      
      setState(prev => ({ ...prev, hasPermission: granted }));

      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'To receive Sunday reminders, please enable notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }, []);

  const scheduleSundayNotification = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) return false;

    try {
      // Cancel any existing weekly notification first
      await cancelSundayNotification();

      // Schedule notification for every Sunday at 7:00 PM
      await Notifications.scheduleNotificationAsync({
        identifier: WEEKLY_NOTIFICATION_ID,
        content: {
          title: '🍔 SUNDAY REFLECTION TIME',
          body: "Be honest. How many times did you hit the drive-thru this week?",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1, // Sunday (1 = Sunday in Expo)
          hour: 19,   // 7:00 PM
          minute: 0,
        },
      });

      console.log('Sunday notification scheduled successfully');
      return true;
    } catch (error) {
      console.error('Error scheduling Sunday notification:', error);
      return false;
    }
  }, []);

  const cancelSundayNotification = useCallback(async (): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(WEEKLY_NOTIFICATION_ID);
      console.log('Sunday notification cancelled');
    } catch (error) {
      // Notification might not exist, that's okay
      console.log('No existing notification to cancel');
    }
  }, []);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    const hasPermission = await requestPermission();
    if (hasPermission) {
      return await scheduleSundayNotification();
    }
    return false;
  }, [requestPermission, scheduleSundayNotification]);

  const disableNotifications = useCallback(async (): Promise<void> => {
    await cancelSundayNotification();
  }, [cancelSundayNotification]);

  return {
    ...state,
    requestPermission,
    enableNotifications,
    disableNotifications,
    scheduleSundayNotification,
    cancelSundayNotification,
    checkPermissionStatus,
  };
}

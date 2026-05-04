import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Unique identifiers for our weekly notifications
const SUNDAY_NOTIFICATION_ID = 'sunday-reflection';
const WEDNESDAY_NOTIFICATION_ID = 'wednesday-checkin';

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
          'Notifications Required',
          'Notifications are required to use Big Back. We only send 2 reminders per week (Wednesday & Sunday at 8 PM). Please enable notifications in your device settings.',
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

  const scheduleWeeklyNotifications = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) return false;

    try {
      // Cancel any existing notifications first
      await cancelWeeklyNotifications();

      // Schedule Wednesday notification at 8:00 PM
      await Notifications.scheduleNotificationAsync({
        identifier: WEDNESDAY_NOTIFICATION_ID,
        content: {
          title: '🍔 MIDWEEK CHECK-IN',
          body: "Be honest. How many times did you eat fast food so far?",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 4, // Wednesday (4 = Wednesday in Expo)
          hour: 20,   // 8:00 PM
          minute: 0,
        },
      });

      // Schedule Sunday notification at 8:00 PM
      await Notifications.scheduleNotificationAsync({
        identifier: SUNDAY_NOTIFICATION_ID,
        content: {
          title: '🍔 SUNDAY REFLECTION TIME',
          body: "Sunday Reflection! How many times did you eat fast food since Wednesday?",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1, // Sunday (1 = Sunday in Expo)
          hour: 20,   // 8:00 PM
          minute: 0,
        },
      });

      console.log('Weekly notifications scheduled successfully');
      return true;
    } catch (error) {
      console.error('Error scheduling weekly notifications:', error);
      return false;
    }
  }, []);

  const cancelWeeklyNotifications = useCallback(async (): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(SUNDAY_NOTIFICATION_ID);
      await Notifications.cancelScheduledNotificationAsync(WEDNESDAY_NOTIFICATION_ID);
      console.log('Weekly notifications cancelled');
    } catch (error) {
      // Notifications might not exist, that's okay
      console.log('No existing notifications to cancel');
    }
  }, []);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    const hasPermission = await requestPermission();
    if (hasPermission) {
      return await scheduleWeeklyNotifications();
    }
    return false;
  }, [requestPermission, scheduleWeeklyNotifications]);

  const disableNotifications = useCallback(async (): Promise<void> => {
    await cancelWeeklyNotifications();
  }, [cancelWeeklyNotifications]);

  return {
    ...state,
    requestPermission,
    enableNotifications,
    disableNotifications,
    scheduleWeeklyNotifications,
    cancelWeeklyNotifications,
    checkPermissionStatus,
  };
}

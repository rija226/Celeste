import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REMINDER_IDENTIFIER = 'daily-review-reminder';
const REMINDER_STORAGE_KEY = 'astro-learn-daily-reminder-enabled';
const REMINDER_HOUR = 19;
const REMINDER_MINUTE = 0;

export async function isDailyReminderEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
  return stored === 'true';
}

// expo-notifications nema native modul na webu (samo za mobilne uredjaje) --
// vraca false umjesto da baci UnavailabilityError.
export async function setDailyReminderEnabled(
  enabled: boolean,
  content: { title: string; body: string },
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  if (!enabled) {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});
    await AsyncStorage.setItem(REMINDER_STORAGE_KEY, 'false');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  const finalStatus =
    existingStatus === 'granted' ? existingStatus : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== 'granted') {
    await AsyncStorage.setItem(REMINDER_STORAGE_KEY, 'false');
    return false;
  }

  await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
    },
  });
  await AsyncStorage.setItem(REMINDER_STORAGE_KEY, 'true');
  return true;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hr from './locales/hr.json';

const LANGUAGE_STORAGE_KEY = 'astro-learn-language';
const SUPPORTED_LANGUAGES = ['en', 'hr'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function isSupportedLanguage(language: string | undefined): language is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
}

function resolveDeviceLanguage(): SupportedLanguage {
  const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? undefined;
  return isSupportedLanguage(deviceLanguage) ? deviceLanguage : 'en';
}

export async function initI18n(): Promise<void> {
  const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  const language = isSupportedLanguage(storedLanguage ?? undefined)
    ? (storedLanguage as SupportedLanguage)
    : resolveDeviceLanguage();

  // eslint-disable-next-line import/no-named-as-default-member -- standard i18next instance usage
  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      hr: { translation: hr },
    },
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export async function changeLanguage(language: SupportedLanguage): Promise<void> {
  // eslint-disable-next-line import/no-named-as-default-member -- standard i18next instance usage
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export default i18n;

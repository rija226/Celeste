import type { SupportedLanguage } from '@/i18n';
import type { LocalizedText } from '@/types/models';

export function pickLocalized(text: LocalizedText, language: string): string {
  return text[language as SupportedLanguage] ?? text.en;
}

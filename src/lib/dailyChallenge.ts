import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Constellation } from '@/types/models';

import type { QuizQuestion } from './quiz';

export const DAILY_CHALLENGE_LENGTH = 5;

const RESULT_STORAGE_KEY = 'astro-learn-daily-challenge-result';

export type DailyChallengeResult = {
  dateKey: string;
  correct: number;
  total: number;
};

export function todayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 2147483647;
  }
  return hash || 1;
}

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const random = seededRandom(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Isti datum -> isti seed -> isto pitanje/redoslijed za svakoga ko otvori
// izazov tog dana (deterministicno, bez potrebe da se pamti napredak).
export function buildDailyQuestions(pool: Constellation[], dateKey: string): QuizQuestion[] {
  const seed = hashString(dateKey);
  const chosen = seededShuffle(pool, seed).slice(0, DAILY_CHALLENGE_LENGTH);

  return chosen.map((answer, index) => {
    const others = pool.filter((c) => c.id !== answer.id);
    const wrongOptions = seededShuffle(others, seed + index + 1).slice(0, 3);
    const options = seededShuffle([answer, ...wrongOptions], seed + index + 100);
    return { answer, options };
  });
}

export async function getDailyChallengeResult(): Promise<DailyChallengeResult | null> {
  const raw = await AsyncStorage.getItem(RESULT_STORAGE_KEY);
  if (!raw) return null;
  const parsed: DailyChallengeResult = JSON.parse(raw);
  return parsed.dateKey === todayDateKey() ? parsed : null;
}

export async function saveDailyChallengeResult(correct: number, total: number): Promise<void> {
  const result: DailyChallengeResult = { dateKey: todayDateKey(), correct, total };
  await AsyncStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
}

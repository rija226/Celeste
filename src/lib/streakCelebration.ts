import { getQuizResultDates, getReviewLogDates } from '@/db';
import { getLastCelebratedStreak, setLastCelebratedStreak } from '@/lib/celebrations';
import { computeStreak } from '@/lib/stats';
import { useCelebrationStore } from '@/store/celebration';

// Pozvati na kraju sesije ucenja ili kviza (ne pri svakom pitanju/kartici).
// Proslavlja se samo ako je streak stvarno porastao naspram zadnjeg
// proslavljenog, i tek od 2 dana (1 dan je samo pocetak, ne "produzavanje").
export async function checkAndCelebrateStreak(userId: string): Promise<void> {
  const [reviewDates, quizDates] = await Promise.all([getReviewLogDates(userId), getQuizResultDates(userId)]);
  const streak = computeStreak([...reviewDates, ...quizDates]);
  const last = await getLastCelebratedStreak();

  if (streak >= 2 && streak > last) {
    useCelebrationStore.getState().celebrate({ kind: 'streak', streakCount: streak });
    await setLastCelebratedStreak(streak);
  }
}

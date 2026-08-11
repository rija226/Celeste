export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Broj uzastopnih dana (racunajuci danas) sa bar jednim pregledom, unazad.
export function computeStreak(reviewTimestamps: string[]): number {
  const reviewedDays = new Set(reviewTimestamps.map((ts) => toLocalDateKey(new Date(ts))));

  let streak = 0;
  const cursor = new Date();
  while (reviewedDays.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export type DailyActivity = { dateKey: string; reviews: number; quizAnswers: number };

// Zadnjih `days` dana, od najstarijeg ka danasnjem, sa brojem ponavljanja i
// kviz odgovora po danu (za graf aktivnosti i streak tackice). Dani bez
// aktivnosti dobiju 0 -- ne preskacu se.
export function buildDailyActivity(reviewTimestamps: string[], quizTimestamps: string[], days: number): DailyActivity[] {
  const reviewCounts = new Map<string, number>();
  for (const ts of reviewTimestamps) {
    const key = toLocalDateKey(new Date(ts));
    reviewCounts.set(key, (reviewCounts.get(key) ?? 0) + 1);
  }
  const quizCounts = new Map<string, number>();
  for (const ts of quizTimestamps) {
    const key = toLocalDateKey(new Date(ts));
    quizCounts.set(key, (quizCounts.get(key) ?? 0) + 1);
  }

  const result: DailyActivity[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const key = toLocalDateKey(cursor);
    result.push({ dateKey: key, reviews: reviewCounts.get(key) ?? 0, quizAnswers: quizCounts.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

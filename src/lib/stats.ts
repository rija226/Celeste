function toLocalDateKey(date: Date): string {
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

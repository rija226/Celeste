import type { Constellation, QuizDifficulty } from '@/types/models';

export type QuizQuestion = { answer: Constellation; options: Constellation[] };

export const POINTS_BY_DIFFICULTY: Record<QuizDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Pool mora imati bar 4 stavke (1 tacan + 3 pogresna odgovora).
export function pickQuestion(pool: Constellation[]): QuizQuestion {
  const [answer, ...rest] = shuffle(pool);
  const wrongOptions = shuffle(rest).slice(0, 3);
  return { answer, options: shuffle([answer, ...wrongOptions]) };
}

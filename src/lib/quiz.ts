import { getCardImageUrl } from '@/db';
import type { Constellation, LocalizedText, QuizDifficulty, QuizItem, QuizResultKind } from '@/types/models';

export type QuizOption = { id: string; label: LocalizedText };

export type QuizPrompt =
  | { kind: 'shape'; stars: Constellation['stars']; lines: Constellation['lines'] }
  | { kind: 'image'; url: string }
  | { kind: 'text'; text: LocalizedText };

export type QuizQuestion = {
  quizType: QuizResultKind;
  itemId: string;
  difficulty: QuizDifficulty;
  prompt: QuizPrompt;
  explanation: LocalizedText | null;
  options: QuizOption[];
  correctOptionId: string;
};

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

// order je ubacen tako da isti graditelj mogu koristiti i pravi nasumicni
// izbor (practice) i deterministicko seeded mijesanje (dnevni izazov).
export function constellationQuestion(
  answer: Constellation,
  wrongOptions: Constellation[],
  order: <T>(items: T[]) => T[]
): QuizQuestion {
  const options = order([answer, ...wrongOptions]).map((c) => ({ id: c.id, label: c.name }));
  return {
    quizType: 'constellation',
    itemId: answer.id,
    difficulty: answer.difficulty,
    prompt: { kind: 'shape', stars: answer.stars, lines: answer.lines },
    explanation: answer.facts,
    options,
    correctOptionId: answer.id,
  };
}

// Pool mora imati bar 4 stavke (1 tacan + 3 pogresna odgovora) -- distraktori
// se biraju od ostalih sazvijezdja u pool-u.
export function pickConstellationQuestion(pool: Constellation[]): QuizQuestion {
  const [answer, ...rest] = shuffle(pool);
  const wrongOptions = shuffle(rest).slice(0, 3);
  return constellationQuestion(answer, wrongOptions, shuffle);
}

function zipDistractors(distractors: QuizItem['distractors']): LocalizedText[] {
  return distractors.en.map((en, i) => ({ en, hr: distractors.hr[i] }));
}

// quiz_items nose sopstvene distraktore (nema potrebe za sibling entitetima
// iz pool-a), pa je dovoljna 1 stavka za bilo koji filter tip/tezina.
export function pickQuizItemQuestion(pool: QuizItem[]): QuizQuestion {
  const item = shuffle(pool)[0];
  const answerOption: QuizOption = { id: item.answer.en, label: item.answer };
  const wrongOptions: QuizOption[] = zipDistractors(item.distractors).map((label) => ({ id: label.en, label }));
  const options = shuffle([answerOption, ...wrongOptions]);
  const prompt: QuizPrompt =
    item.quizType === 'planet'
      ? { kind: 'image', url: getCardImageUrl(item.deckSlug ?? '', item.imageName ?? '') }
      : { kind: 'text', text: item.question ?? { en: '', hr: '' } };
  return {
    quizType: item.quizType,
    itemId: item.id,
    difficulty: item.difficulty,
    prompt,
    explanation: null,
    options,
    correctOptionId: answerOption.id,
  };
}

// Mesa sazvijezdja + quiz_items -- vjerovatnoca izvora je proporcionalna
// velicini svakog (vec filtriranog) pool-a.
export function pickMixedQuestion(constellations: Constellation[], items: QuizItem[]): QuizQuestion {
  const index = Math.floor(Math.random() * (constellations.length + items.length));
  return index < constellations.length ? pickConstellationQuestion(constellations) : pickQuizItemQuestion(items);
}

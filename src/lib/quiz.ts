import { getCardImageUrl } from '@/db';
import type { Constellation, LocalizedText, QuizDifficulty, QuizItem, QuizResultKind } from '@/types/models';

import { createShuffleBag, shuffle } from './shuffleBag';

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

function zipDistractors(distractors: QuizItem['distractors']): LocalizedText[] {
  return distractors.en.map((en, i) => ({ en, hr: distractors.hr[i] }));
}

// quiz_items nose sopstvene distraktore (nema potrebe za sibling entitetima
// iz pool-a), pa je dovoljna 1 stavka za bilo koji filter tip/tezina.
function quizItemQuestion(item: QuizItem): QuizQuestion {
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

type QuizEntry = { kind: 'constellation'; constellation: Constellation } | { kind: 'item'; item: QuizItem };

// Mijesa sazvijezdja + quiz_items u jedan spil bez ponavljanja (vidi
// createShuffleBag). Distraktori za sazvijezdje se biraju od ostalih
// sazvijezdja u istom pool-u, pa pool sazvijezdja treba bar 4 stavke.
export function createQuestionBag(constellations: Constellation[], items: QuizItem[]): () => QuizQuestion | null {
  const next = createShuffleBag<QuizEntry>([
    ...constellations.map((constellation) => ({ kind: 'constellation' as const, constellation })),
    ...items.map((item) => ({ kind: 'item' as const, item })),
  ]);
  return () => {
    const entry = next();
    if (!entry) return null;
    if (entry.kind === 'item') return quizItemQuestion(entry.item);
    const wrongOptions = shuffle(constellations.filter((c) => c !== entry.constellation)).slice(0, 3);
    return constellationQuestion(entry.constellation, wrongOptions, shuffle);
  };
}

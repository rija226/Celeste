import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, H2, Paragraph, Spinner, XStack, YStack } from 'tamagui';

import { QuizQuestionCard } from '@/components/QuizQuestionCard';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { ensureSession, getConstellations, insertQuizResult } from '@/db';
import {
  buildDailyQuestions,
  getDailyChallengeResult,
  saveDailyChallengeResult,
  todayDateKey,
  type DailyChallengeResult,
} from '@/lib/dailyChallenge';
import { pickLocalized } from '@/lib/localized';
import { pickQuestion, POINTS_BY_DIFFICULTY } from '@/lib/quiz';
import type { Constellation, QuizDifficulty } from '@/types/models';

type Mode = 'practice' | 'daily';

const DIFFICULTY_TIERS: QuizDifficulty[] = ['easy', 'medium', 'hard'];

export default function QuizScreen() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<Mode>('practice');
  const [pool, setPool] = useState<Constellation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [difficulty, setDifficulty] = useState<QuizDifficulty>('easy');
  const [practiceRound, setPracticeRound] = useState(0);
  const [practiceSelectedId, setPracticeSelectedId] = useState<string | null>(null);
  const [practiceScore, setPracticeScore] = useState({ correct: 0, total: 0, points: 0 });

  const [dailyResult, setDailyResult] = useState<DailyChallengeResult | null | undefined>(undefined);
  const [dailyIndex, setDailyIndex] = useState(0);
  const [dailySelectedId, setDailySelectedId] = useState<string | null>(null);
  const [dailyCorrect, setDailyCorrect] = useState(0);

  useEffect(() => {
    ensureSession().then(setUserId);
    getConstellations()
      .then(setPool)
      .catch((e: Error) => setError(e.message));
    getDailyChallengeResult().then(setDailyResult);
  }, []);

  const practiceQuestion = useMemo(() => {
    if (!pool) return null;
    const tierPool = pool.filter((c) => c.difficulty === difficulty);
    return pickQuestion(tierPool);
    // practiceRound je namjerno u zavisnostima -- svaki klik na "Dalje" mora
    // izvuci NOVO nasumicno pitanje, ne isto (pickQuestion nije cist).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, difficulty, practiceRound]);

  const dailyQuestions = useMemo(() => {
    if (!pool || dailyResult !== null) return null;
    return buildDailyQuestions(pool, todayDateKey());
  }, [pool, dailyResult]);

  function selectDifficulty(tier: QuizDifficulty) {
    setDifficulty(tier);
    setPracticeSelectedId(null);
  }

  async function handlePracticeSelect(option: Constellation) {
    if (!practiceQuestion || practiceSelectedId) return;
    setPracticeSelectedId(option.id);
    const isCorrect = option.id === practiceQuestion.answer.id;
    const points = isCorrect ? POINTS_BY_DIFFICULTY[difficulty] : 0;
    setPracticeScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
      points: s.points + points,
    }));
    if (userId) {
      await insertQuizResult({
        userId,
        constellationId: practiceQuestion.answer.id,
        mode: 'practice',
        difficulty,
        isCorrect,
        points,
        answeredAt: new Date().toISOString(),
      });
    }
  }

  function handlePracticeNext() {
    setPracticeSelectedId(null);
    setPracticeRound((r) => r + 1);
  }

  async function handleDailySelect(option: Constellation) {
    const question = dailyQuestions?.[dailyIndex];
    if (!question || dailySelectedId) return;
    setDailySelectedId(option.id);
    const isCorrect = option.id === question.answer.id;
    if (isCorrect) {
      setDailyCorrect((c) => c + 1);
    }
    if (userId) {
      await insertQuizResult({
        userId,
        constellationId: question.answer.id,
        mode: 'daily',
        difficulty: question.answer.difficulty,
        isCorrect,
        points: isCorrect ? POINTS_BY_DIFFICULTY[question.answer.difficulty] : 0,
        answeredAt: new Date().toISOString(),
      });
    }
  }

  async function handleDailyNext() {
    if (!dailyQuestions) return;
    const isLast = dailyIndex === dailyQuestions.length - 1;
    if (isLast) {
      await saveDailyChallengeResult(dailyCorrect, dailyQuestions.length);
      setDailyResult({ dateKey: todayDateKey(), correct: dailyCorrect, total: dailyQuestions.length });
    } else {
      setDailyIndex((i) => i + 1);
      setDailySelectedId(null);
    }
  }

  return (
    <ScreenBackdrop>
      <YStack f={1} pt="$8" px="$4" gap="$4">
        <H2 color="$color">{t('quiz.title')}</H2>

        <XStack gap="$2">
          <Button f={1} theme={mode === 'practice' ? 'blue' : undefined} onPress={() => setMode('practice')}>
            {t('quiz.practice')}
          </Button>
          <Button f={1} theme={mode === 'daily' ? 'blue' : undefined} onPress={() => setMode('daily')}>
            {t('quiz.dailyChallenge')}
          </Button>
        </XStack>

        {error && <Paragraph color="$red10">{error}</Paragraph>}
        {!pool && !error && <Spinner size="large" />}

        {pool && mode === 'practice' && (
          <>
            <XStack gap="$2">
              {DIFFICULTY_TIERS.map((tier) => (
                <Button
                  key={tier}
                  f={1}
                  size="$3"
                  theme={difficulty === tier ? 'blue' : undefined}
                  onPress={() => selectDifficulty(tier)}>
                  {t(`quiz.difficulty.${tier}`)}
                </Button>
              ))}
            </XStack>

            <Paragraph fontFamily="$heading" color="$blue10">
              {t('quiz.points', { count: practiceScore.points })} · {practiceScore.correct}/{practiceScore.total}
            </Paragraph>

            {practiceQuestion && (
              <>
                <Paragraph color="$color11">{t('quiz.prompt')}</Paragraph>
                <QuizQuestionCard
                  question={practiceQuestion}
                  selectedId={practiceSelectedId}
                  onSelect={handlePracticeSelect}
                />
                {practiceSelectedId && (
                  <>
                    <Paragraph color="$color11">
                      {pickLocalized(practiceQuestion.answer.facts, i18n.language)}
                    </Paragraph>
                    <Button theme="blue" onPress={handlePracticeNext}>
                      {t('quiz.next')}
                    </Button>
                  </>
                )}
              </>
            )}
          </>
        )}

        {pool && mode === 'daily' && (
          <>
            {dailyResult === undefined && <Spinner size="large" />}

            {dailyResult && (
              <YStack ai="center" gap="$2" py="$6">
                <Paragraph fontFamily="$heading" fontSize="$8" color="$blue10">
                  {t('quiz.dailyScore', { correct: dailyResult.correct, total: dailyResult.total })}
                </Paragraph>
                <Paragraph color="$color11">{t('quiz.dailyDone')}</Paragraph>
                <Paragraph color="$color11">{t('quiz.dailyComeBack')}</Paragraph>
              </YStack>
            )}

            {dailyResult === null && dailyQuestions && (
              <>
                <Paragraph fontFamily="$heading" color="$blue10">
                  {t('quiz.dailyProgress', { current: dailyIndex + 1, total: dailyQuestions.length })}
                </Paragraph>
                <Paragraph color="$color11">{t('quiz.prompt')}</Paragraph>
                <QuizQuestionCard
                  question={dailyQuestions[dailyIndex]}
                  selectedId={dailySelectedId}
                  onSelect={handleDailySelect}
                />
                {dailySelectedId && (
                  <>
                    <Paragraph color="$color11">
                      {pickLocalized(dailyQuestions[dailyIndex].answer.facts, i18n.language)}
                    </Paragraph>
                    <Button theme="blue" onPress={handleDailyNext}>
                      {dailyIndex === dailyQuestions.length - 1 ? t('quiz.finish') : t('quiz.next')}
                    </Button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </YStack>
    </ScreenBackdrop>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, H2, Paragraph, Spinner, XStack, YStack } from 'tamagui';

import { QuizQuestionCard } from '@/components/QuizQuestionCard';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { ensureSession, getConstellations, getQuizItems, insertQuizResult } from '@/db';
import {
  buildDailyQuestions,
  getDailyChallengeResult,
  saveDailyChallengeResult,
  todayDateKey,
  type DailyChallengeResult,
} from '@/lib/dailyChallenge';
import { pickLocalized } from '@/lib/localized';
import { pickMixedQuestion, POINTS_BY_DIFFICULTY, type QuizQuestion } from '@/lib/quiz';
import { playSfx } from '@/lib/sound';
import { checkAndCelebrateStreak } from '@/lib/streakCelebration';
import type { Constellation, QuizDifficulty, QuizItem, QuizItemType } from '@/types/models';

type Mode = 'practice' | 'daily' | 'timeAttack';
type TypeFilter = 'all' | 'constellation' | QuizItemType;

const DIFFICULTY_TIERS: QuizDifficulty[] = ['easy', 'medium', 'hard'];
const TYPE_FILTERS: TypeFilter[] = ['all', 'constellation', 'planet', 'knowledge'];
const TIME_ATTACK_SECONDS = 60;
const TIME_ATTACK_ADVANCE_DELAY_MS = 700;

export default function QuizScreen() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<Mode>('practice');
  const [pool, setPool] = useState<Constellation[] | null>(null);
  const [itemPool, setItemPool] = useState<QuizItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [difficulty, setDifficulty] = useState<QuizDifficulty>('easy');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [practiceRound, setPracticeRound] = useState(0);
  const [practiceSelectedId, setPracticeSelectedId] = useState<string | null>(null);
  const [practiceScore, setPracticeScore] = useState({ correct: 0, total: 0, points: 0 });

  const [dailyResult, setDailyResult] = useState<DailyChallengeResult | null | undefined>(undefined);
  const [dailyIndex, setDailyIndex] = useState(0);
  const [dailySelectedId, setDailySelectedId] = useState<string | null>(null);
  const [dailyCorrect, setDailyCorrect] = useState(0);

  const [taState, setTaState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [taSecondsLeft, setTaSecondsLeft] = useState(TIME_ATTACK_SECONDS);
  const [taQuestion, setTaQuestion] = useState<QuizQuestion | null>(null);
  const [taSelectedId, setTaSelectedId] = useState<string | null>(null);
  const [taScore, setTaScore] = useState({ correct: 0, total: 0, points: 0 });

  useEffect(() => {
    ensureSession().then(setUserId);
    getConstellations()
      .then(setPool)
      .catch((e: Error) => setError(e.message));
    getQuizItems()
      .then(setItemPool)
      .catch((e: Error) => setError(e.message));
    getDailyChallengeResult().then(setDailyResult);
  }, []);

  useEffect(() => {
    if (taState !== 'playing') return;
    const interval = setInterval(() => {
      setTaSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setTaState('finished');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [taState]);

  const practiceQuestion = useMemo(() => {
    if (!pool || !itemPool) return null;
    const constellationsForTier = typeFilter === 'planet' || typeFilter === 'knowledge' ? [] : pool.filter((c) => c.difficulty === difficulty);
    const itemsForTier =
      typeFilter === 'constellation'
        ? []
        : itemPool.filter((i) => i.difficulty === difficulty && (typeFilter === 'all' || i.quizType === typeFilter));
    if (constellationsForTier.length + itemsForTier.length === 0) return null;
    return pickMixedQuestion(constellationsForTier, itemsForTier);
    // practiceRound je namjerno u zavisnostima -- svaki klik na "Dalje" mora
    // izvuci NOVO nasumicno pitanje, ne isto (pickMixedQuestion nije cist).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, itemPool, difficulty, typeFilter, practiceRound]);

  const dailyQuestions = useMemo(() => {
    if (!pool || dailyResult !== null) return null;
    return buildDailyQuestions(pool, todayDateKey());
  }, [pool, dailyResult]);

  function selectDifficulty(tier: QuizDifficulty) {
    setDifficulty(tier);
    setPracticeSelectedId(null);
  }

  function selectTypeFilter(filter: TypeFilter) {
    setTypeFilter(filter);
    setPracticeSelectedId(null);
  }

  async function handlePracticeSelect(optionId: string) {
    if (!practiceQuestion || practiceSelectedId) return;
    setPracticeSelectedId(optionId);
    const isCorrect = optionId === practiceQuestion.correctOptionId;
    playSfx(isCorrect ? 'quizCorrect' : 'quizIncorrect');
    const points = isCorrect ? POINTS_BY_DIFFICULTY[difficulty] : 0;
    setPracticeScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
      points: s.points + points,
    }));
    if (userId) {
      await insertQuizResult({
        userId,
        quizType: practiceQuestion.quizType,
        constellationId: practiceQuestion.quizType === 'constellation' ? practiceQuestion.itemId : null,
        quizItemId: practiceQuestion.quizType === 'constellation' ? null : practiceQuestion.itemId,
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

  async function handleDailySelect(optionId: string) {
    const question = dailyQuestions?.[dailyIndex];
    if (!question || dailySelectedId) return;
    setDailySelectedId(optionId);
    const isCorrect = optionId === question.correctOptionId;
    playSfx(isCorrect ? 'quizCorrect' : 'quizIncorrect');
    if (isCorrect) {
      setDailyCorrect((c) => c + 1);
    }
    if (userId) {
      await insertQuizResult({
        userId,
        quizType: 'constellation',
        constellationId: question.itemId,
        quizItemId: null,
        mode: 'daily',
        difficulty: question.difficulty,
        isCorrect,
        points: isCorrect ? POINTS_BY_DIFFICULTY[question.difficulty] : 0,
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
      if (userId) checkAndCelebrateStreak(userId);
    } else {
      setDailyIndex((i) => i + 1);
      setDailySelectedId(null);
    }
  }

  function startTimeAttack() {
    if (!pool || !itemPool) return;
    setTaScore({ correct: 0, total: 0, points: 0 });
    setTaSecondsLeft(TIME_ATTACK_SECONDS);
    setTaSelectedId(null);
    setTaQuestion(pickMixedQuestion(pool, itemPool));
    setTaState('playing');
  }

  function handleTimeAttackSelect(optionId: string) {
    if (!taQuestion || taSelectedId || taState !== 'playing' || !pool || !itemPool) return;
    setTaSelectedId(optionId);
    const isCorrect = optionId === taQuestion.correctOptionId;
    playSfx(isCorrect ? 'quizCorrect' : 'quizIncorrect');
    const points = isCorrect ? POINTS_BY_DIFFICULTY[taQuestion.difficulty] : 0;
    setTaScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
      points: s.points + points,
    }));
    if (userId) {
      insertQuizResult({
        userId,
        quizType: taQuestion.quizType,
        constellationId: taQuestion.quizType === 'constellation' ? taQuestion.itemId : null,
        quizItemId: taQuestion.quizType === 'constellation' ? null : taQuestion.itemId,
        mode: 'timeAttack',
        difficulty: taQuestion.difficulty,
        isCorrect,
        points,
        answeredAt: new Date().toISOString(),
      });
    }
    setTimeout(() => {
      setTaSelectedId(null);
      setTaQuestion(pickMixedQuestion(pool, itemPool));
    }, TIME_ATTACK_ADVANCE_DELAY_MS);
  }

  return (
    <ScreenBackdrop>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack f={1} pt="$8" px="$4" pb="$8" gap="$4">
          <H2 color="$color">{t('quiz.title')}</H2>

          <XStack gap="$2">
            <Button f={1} size="$3" theme={mode === 'practice' ? 'blue' : undefined} onPress={() => setMode('practice')}>
              {t('quiz.practice')}
            </Button>
            <Button f={1} size="$3" theme={mode === 'daily' ? 'blue' : undefined} onPress={() => setMode('daily')}>
              {t('quiz.dailyChallenge')}
            </Button>
            <Button f={1} size="$3" theme={mode === 'timeAttack' ? 'blue' : undefined} onPress={() => setMode('timeAttack')}>
              {t('quiz.timeAttack.mode')}
            </Button>
          </XStack>

          {error && <Paragraph color="$red10">{error}</Paragraph>}
          {(!pool || !itemPool) && !error && <Spinner size="large" />}

          {pool && itemPool && mode === 'practice' && (
            <>
              <XStack gap="$2" flexWrap="wrap">
                {TYPE_FILTERS.map((filter) => (
                  <Button
                    key={filter}
                    size="$2"
                    theme={typeFilter === filter ? 'blue' : undefined}
                    onPress={() => selectTypeFilter(filter)}>
                    {t(`quiz.filter.${filter}`)}
                  </Button>
                ))}
              </XStack>

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

              {!practiceQuestion && <Paragraph color="$color11">{t('quiz.noQuestions')}</Paragraph>}

              {practiceQuestion && (
                <>
                  {practiceQuestion.quizType !== 'knowledge' && (
                    <Paragraph color="$color11">
                      {t(practiceQuestion.quizType === 'constellation' ? 'quiz.prompt' : 'quiz.promptPlanet')}
                    </Paragraph>
                  )}
                  <QuizQuestionCard
                    question={practiceQuestion}
                    selectedId={practiceSelectedId}
                    onSelect={handlePracticeSelect}
                  />
                  {practiceSelectedId && (
                    <>
                      {practiceQuestion.explanation && (
                        <Paragraph color="$color11">
                          {pickLocalized(practiceQuestion.explanation, i18n.language)}
                        </Paragraph>
                      )}
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
                      {dailyQuestions[dailyIndex].explanation && (
                        <Paragraph color="$color11">
                          {pickLocalized(dailyQuestions[dailyIndex].explanation!, i18n.language)}
                        </Paragraph>
                      )}
                      <Button theme="blue" onPress={handleDailyNext}>
                        {dailyIndex === dailyQuestions.length - 1 ? t('quiz.finish') : t('quiz.next')}
                      </Button>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {pool && itemPool && mode === 'timeAttack' && (
            <>
              {taState === 'idle' && (
                <YStack ai="center" gap="$3" py="$6">
                  <Paragraph color="$color11" textAlign="center">
                    {t('quiz.timeAttack.intro', { seconds: TIME_ATTACK_SECONDS })}
                  </Paragraph>
                  <Button theme="blue" onPress={startTimeAttack}>
                    {t('quiz.timeAttack.start')}
                  </Button>
                </YStack>
              )}

              {taState === 'playing' && taQuestion && (
                <>
                  <XStack jc="space-between" ai="center">
                    <Paragraph fontFamily="$heading" color="$blue10">
                      {t('quiz.timeAttack.timeLeft', { seconds: taSecondsLeft })}
                    </Paragraph>
                    <Paragraph fontFamily="$heading" color="$blue10">
                      {t('quiz.points', { count: taScore.points })}
                    </Paragraph>
                  </XStack>
                  <QuizQuestionCard question={taQuestion} selectedId={taSelectedId} onSelect={handleTimeAttackSelect} />
                </>
              )}

              {taState === 'finished' && (
                <YStack ai="center" gap="$2" py="$6">
                  <Paragraph fontFamily="$heading" fontSize="$8" color="$blue10">
                    {t('quiz.points', { count: taScore.points })}
                  </Paragraph>
                  <Paragraph color="$color11">
                    {t('quiz.timeAttack.result', { correct: taScore.correct, total: taScore.total })}
                  </Paragraph>
                  <Button theme="blue" onPress={startTimeAttack}>
                    {t('quiz.timeAttack.playAgain')}
                  </Button>
                </YStack>
              )}
            </>
          )}
        </YStack>
      </ScrollView>
    </ScreenBackdrop>
  );
}

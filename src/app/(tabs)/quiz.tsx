import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { H2, Paragraph, Spinner, XStack, YStack } from 'tamagui';

import { PillButton } from '@/components/PillButton';
import { QuizQuestionCard } from '@/components/QuizQuestionCard';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { XpRing } from '@/components/XpRing';
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
import { palette } from '@/theme/palette';
import type { Constellation, QuizDifficulty, QuizItem, QuizItemType } from '@/types/models';

type Mode = 'practice' | 'daily' | 'timeAttack';
type TypeFilter = 'all' | 'constellation' | QuizItemType;

const DIFFICULTY_TIERS: QuizDifficulty[] = ['easy', 'medium', 'hard'];
const TYPE_FILTERS: TypeFilter[] = ['all', 'constellation', 'planet', 'knowledge'];
const TIME_ATTACK_SECONDS = 60;
const TIME_ATTACK_ADVANCE_DELAY_MS = 700;

const DIFFICULTY_COLOR: Record<QuizDifficulty, string> = {
  easy: palette.aurora,
  medium: palette.amber,
  hard: palette.comet,
};

const MODE_TABS: { key: Mode; labelKey: string }[] = [
  { key: 'practice', labelKey: 'quiz.practice' },
  { key: 'daily', labelKey: 'quiz.dailyChallenge' },
  { key: 'timeAttack', labelKey: 'quiz.timeAttack.mode' },
];

const PROMPT_CAPTION = '#A5A5A5';

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

  const headerPoints = mode === 'practice' ? practiceScore.points : mode === 'timeAttack' ? taScore.points : null;

  return (
    <ScreenBackdrop>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack f={1} pt="$8" px="$4" pb="$8" gap="$3.5">
          <XStack ai="center" jc="space-between">
            <H2 color="$color">{t('quiz.title')}</H2>
            {headerPoints !== null && (
              <XStack
                ai="center"
                gap={6}
                px={12}
                py={6}
                borderRadius={999}
                backgroundColor="rgba(255,169,77,0.14)"
                borderWidth={1}
                borderColor="rgba(255,169,77,0.5)">
                <Ionicons name="sparkles" size={14} color={palette.amber} />
                <Paragraph fontFamily="$heading" fontSize={14} fontWeight="700" color={palette.amber}>
                  {t('quiz.points', { count: headerPoints })}
                </Paragraph>
              </XStack>
            )}
          </XStack>

          <XStack p={4} gap={4} borderRadius={14} backgroundColor="rgba(6,7,13,0.5)" borderWidth={1} borderColor="rgba(124,108,255,0.25)">
            {MODE_TABS.map((tab) => {
              const active = mode === tab.key;
              const activeColor = tab.key === 'timeAttack' ? palette.amber : palette.nebula;
              const activeTextColor = tab.key === 'timeAttack' ? palette.void : palette.starlight;
              return (
                <Pressable key={tab.key} style={{ flex: 1 }} onPress={() => setMode(tab.key)}>
                  <YStack height={38} borderRadius={10} ai="center" jc="center" backgroundColor={active ? activeColor : 'transparent'}>
                    <Paragraph fontSize={13} fontWeight={active ? '600' : '500'} color={active ? activeTextColor : palette.haze}>
                      {t(tab.labelKey)}
                    </Paragraph>
                  </YStack>
                </Pressable>
              );
            })}
          </XStack>

          {error && <Paragraph color="$red10">{error}</Paragraph>}
          {(!pool || !itemPool) && !error && <Spinner size="large" />}

          {pool && itemPool && mode === 'practice' && (
            <>
              <XStack gap={7} flexWrap="wrap">
                {TYPE_FILTERS.map((filter) => {
                  const active = typeFilter === filter;
                  return (
                    <Pressable key={filter} onPress={() => selectTypeFilter(filter)}>
                      <XStack
                        px={13}
                        py={6}
                        borderRadius={999}
                        backgroundColor={active ? 'rgba(124,108,255,0.22)' : 'transparent'}
                        borderWidth={1}
                        borderColor={active ? palette.nebula : 'rgba(141,138,174,0.4)'}>
                        <Paragraph fontSize={12} fontWeight={active ? '600' : '400'} color={active ? palette.starlight : palette.haze}>
                          {t(`quiz.filter.${filter}`)}
                        </Paragraph>
                      </XStack>
                    </Pressable>
                  );
                })}
              </XStack>

              <XStack gap={6}>
                {DIFFICULTY_TIERS.map((tier) => {
                  const active = difficulty === tier;
                  const color = DIFFICULTY_COLOR[tier];
                  return (
                    <Pressable key={tier} style={{ flex: 1 }} onPress={() => selectDifficulty(tier)}>
                      <YStack
                        height={32}
                        borderRadius={8}
                        ai="center"
                        jc="center"
                        backgroundColor={active ? `${color}2E` : 'transparent'}
                        borderWidth={1}
                        borderColor={active ? color : 'rgba(141,138,174,0.4)'}>
                        <Paragraph fontSize={12} fontWeight={active ? '600' : '400'} color={active ? color : palette.haze}>
                          {t(`quiz.difficulty.${tier}`)} · {POINTS_BY_DIFFICULTY[tier]}
                        </Paragraph>
                      </YStack>
                    </Pressable>
                  );
                })}
              </XStack>

              {!practiceQuestion && <Paragraph color="$color11">{t('quiz.noQuestions')}</Paragraph>}

              {practiceQuestion && (
                <>
                  {practiceQuestion.quizType !== 'knowledge' && (
                    <Paragraph fontSize={14} color={PROMPT_CAPTION}>
                      {t(practiceQuestion.quizType === 'constellation' ? 'quiz.prompt' : 'quiz.promptPlanet')}
                    </Paragraph>
                  )}
                  <QuizQuestionCard question={practiceQuestion} selectedId={practiceSelectedId} onSelect={handlePracticeSelect} />
                  {practiceSelectedId && (
                    <>
                      {practiceQuestion.explanation && (
                        <XStack
                          gap={10}
                          ai="center"
                          p={12}
                          borderRadius={15}
                          backgroundColor="rgba(51,214,176,0.1)"
                          borderWidth={1}
                          borderColor="rgba(51,214,176,0.35)">
                          <Ionicons name="bulb-outline" size={18} color={palette.aurora} />
                          <Paragraph f={1} fontSize={13} lineHeight={19} color="#C9E9DF">
                            {pickLocalized(practiceQuestion.explanation, i18n.language)}
                          </Paragraph>
                        </XStack>
                      )}
                      <PillButton label={t('quiz.next')} icon="arrow-forward" color={palette.nebula} onPress={handlePracticeNext} />
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
                  <Paragraph fontFamily="$heading" fontSize="$8" color={palette.amber}>
                    {t('quiz.dailyScore', { correct: dailyResult.correct, total: dailyResult.total })}
                  </Paragraph>
                  <Paragraph color="$color11">{t('quiz.dailyDone')}</Paragraph>
                  <Paragraph color="$color11">{t('quiz.dailyComeBack')}</Paragraph>
                </YStack>
              )}

              {dailyResult === null && dailyQuestions && (
                <>
                  <Paragraph fontFamily="$heading" color={palette.nebula}>
                    {t('quiz.dailyProgress', { current: dailyIndex + 1, total: dailyQuestions.length })}
                  </Paragraph>
                  <Paragraph fontSize={14} color={PROMPT_CAPTION}>
                    {t('quiz.prompt')}
                  </Paragraph>
                  <QuizQuestionCard question={dailyQuestions[dailyIndex]} selectedId={dailySelectedId} onSelect={handleDailySelect} />
                  {dailySelectedId && (
                    <>
                      {dailyQuestions[dailyIndex].explanation && (
                        <XStack
                          gap={10}
                          ai="center"
                          p={12}
                          borderRadius={15}
                          backgroundColor="rgba(51,214,176,0.1)"
                          borderWidth={1}
                          borderColor="rgba(51,214,176,0.35)">
                          <Ionicons name="bulb-outline" size={18} color={palette.aurora} />
                          <Paragraph f={1} fontSize={13} lineHeight={19} color="#C9E9DF">
                            {pickLocalized(dailyQuestions[dailyIndex].explanation!, i18n.language)}
                          </Paragraph>
                        </XStack>
                      )}
                      <PillButton
                        label={dailyIndex === dailyQuestions.length - 1 ? t('quiz.finish') : t('quiz.next')}
                        icon="arrow-forward"
                        color={palette.nebula}
                        onPress={handleDailyNext}
                      />
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
                  <YStack width="100%">
                    <PillButton label={t('quiz.timeAttack.start')} color={palette.amber} onPress={startTimeAttack} />
                  </YStack>
                </YStack>
              )}

              {taState === 'playing' && taQuestion && (
                <>
                  <XStack
                    ai="center"
                    gap={14}
                    p={14}
                    borderRadius={18}
                    backgroundColor="rgba(43,37,96,0.6)"
                    borderWidth={1}
                    borderColor="rgba(255,169,77,0.4)">
                    <YStack width={60} height={60} ai="center" jc="center">
                      <YStack position="absolute" width={57} height={57}>
                        <XpRing
                          size={57}
                          strokeWidth={5}
                          fraction={taSecondsLeft / TIME_ATTACK_SECONDS}
                          color={palette.amber}
                          trackColor="rgba(255,255,255,0.1)"
                        />
                      </YStack>
                      <Paragraph fontFamily="$heading" fontSize={18} fontWeight="700" color={palette.amber}>
                        {taSecondsLeft}
                      </Paragraph>
                    </YStack>
                    <YStack f={1} gap={2}>
                      <Paragraph fontSize={12} letterSpacing={0.6} textTransform="uppercase" color={palette.haze}>
                        {t('quiz.timeAttack.secondsLeft')}
                      </Paragraph>
                      <Paragraph fontFamily="$heading" fontSize={18} fontWeight="600" color={palette.starlight}>
                        {t('quiz.timeAttack.keepGoing')}
                      </Paragraph>
                    </YStack>
                    <YStack ai="flex-end">
                      <Paragraph fontFamily="$heading" fontSize={22} fontWeight="700" color={palette.aurora}>
                        {taScore.correct}
                      </Paragraph>
                      <Paragraph fontSize={11} color={palette.haze}>
                        {t('quiz.timeAttack.correct')}
                      </Paragraph>
                    </YStack>
                  </XStack>

                  {taQuestion.quizType !== 'knowledge' && (
                    <Paragraph fontSize={14} color={PROMPT_CAPTION}>
                      {t(taQuestion.quizType === 'constellation' ? 'quiz.prompt' : 'quiz.promptPlanet')}
                    </Paragraph>
                  )}
                  <QuizQuestionCard
                    question={taQuestion}
                    selectedId={taSelectedId}
                    onSelect={handleTimeAttackSelect}
                    panelHeight={220}
                  />
                </>
              )}

              {taState === 'finished' && (
                <YStack ai="center" gap="$2" py="$6">
                  <Paragraph fontFamily="$heading" fontSize="$8" color={palette.amber}>
                    {t('quiz.points', { count: taScore.points })}
                  </Paragraph>
                  <Paragraph color="$color11">{t('quiz.timeAttack.result', { correct: taScore.correct, total: taScore.total })}</Paragraph>
                  <YStack width="100%" pt="$2">
                    <PillButton label={t('quiz.timeAttack.playAgain')} color={palette.amber} onPress={startTimeAttack} />
                  </YStack>
                </YStack>
              )}
            </>
          )}
        </YStack>
      </ScrollView>
    </ScreenBackdrop>
  );
}

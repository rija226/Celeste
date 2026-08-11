import { useTranslation } from 'react-i18next';
import { G, Rect, Svg, Text as SvgText } from 'react-native-svg';
import { Paragraph, XStack, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';
import type { DailyActivity } from '@/lib/stats';
import { palette } from '@/theme/palette';

const CHART_W = 320;
const CHART_H = 130;
const BAR_WIDTH = 28;
const MAX_BAR_HEIGHT = 74;
const BASELINE_Y = 90;
const LABEL_Y = 108;

const REVIEWS_COLOR = '#4FA8FF';
const QUIZ_COLOR = palette.nebula;

export function ActivityChart({ activity }: { activity: DailyActivity[] }) {
  const { t, i18n } = useTranslation();
  const maxTotal = Math.max(1, ...activity.map((day) => day.reviews + day.quizAnswers));
  const hasActivity = activity.some((day) => day.reviews + day.quizAnswers > 0);
  const gap = (CHART_W - activity.length * BAR_WIDTH) / (activity.length + 1);
  const weekdayFormatter = new Intl.DateTimeFormat(i18n.language === 'hr' ? 'hr-HR' : 'en-US', { weekday: 'short' });

  return (
    <GlassCard gap="$2">
      <Paragraph fontFamily="$heading" fontSize="$4" color="$color">
        {t('stats.activityTitle')}
      </Paragraph>

      <YStack position="relative">
        <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
          {activity.map((day, index) => {
            const x = gap + index * (BAR_WIDTH + gap);
            const total = day.reviews + day.quizAnswers;
            const label = weekdayFormatter.format(new Date(`${day.dateKey}T00:00:00`)).slice(0, 2);

            if (!hasActivity) {
              return (
                <G key={day.dateKey}>
                  <Rect x={x} y={BASELINE_Y - 6} width={BAR_WIDTH} height={6} rx={3} fill={palette.nebulaDeep} />
                  <SvgText x={x + BAR_WIDTH / 2} y={LABEL_Y} fontSize={11} fill={palette.haze} textAnchor="middle">
                    {label}
                  </SvgText>
                </G>
              );
            }

            const barHeight = total === 0 ? 0 : Math.max(4, (total / maxTotal) * MAX_BAR_HEIGHT);
            const reviewsHeight = total === 0 ? 0 : (day.reviews / total) * barHeight;
            const quizHeight = barHeight - reviewsHeight;

            return (
              <G key={day.dateKey}>
                {reviewsHeight > 0 && (
                  <Rect x={x} y={BASELINE_Y - reviewsHeight} width={BAR_WIDTH} height={reviewsHeight} fill={REVIEWS_COLOR} />
                )}
                {quizHeight > 0 && (
                  <Rect x={x} y={BASELINE_Y - barHeight} width={BAR_WIDTH} height={quizHeight} rx={3} fill={QUIZ_COLOR} />
                )}
                <SvgText x={x + BAR_WIDTH / 2} y={LABEL_Y} fontSize={11} fill={palette.haze} textAnchor="middle">
                  {label}
                </SvgText>
              </G>
            );
          })}
        </Svg>

        {!hasActivity && (
          <YStack position="absolute" top={0} left={0} right={20} bottom={20} ai="center" jc="center">
            <Paragraph fontSize="$2" color="$color11" textAlign="center" px="$4">
              {t('stats.activityEmpty')}
            </Paragraph>
          </YStack>
        )}
      </YStack>

      <XStack gap="$4" ai="center" jc="center" pt="$1">
        <XStack gap="$2" ai="center">
          <YStack width={10} height={10} borderRadius={3} backgroundColor={REVIEWS_COLOR} />
          <Paragraph fontSize="$2" color="$color11">
            {t('stats.activityReviews')}
          </Paragraph>
        </XStack>
        <XStack gap="$2" ai="center">
          <YStack width={10} height={10} borderRadius={3} backgroundColor={QUIZ_COLOR} />
          <Paragraph fontSize="$2" color="$color11">
            {t('stats.activityQuiz')}
          </Paragraph>
        </XStack>
      </XStack>
    </GlassCard>
  );
}

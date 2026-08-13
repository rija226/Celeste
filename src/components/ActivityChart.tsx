import { useTranslation } from 'react-i18next';
import { G, Rect, Svg, Text as SvgText } from 'react-native-svg';
import { Paragraph, XStack, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';
import type { DailyActivity } from '@/lib/stats';
import { palette } from '@/theme/palette';

const CHART_W = 330;
const CHART_H = 150;
const BAR_WIDTH = 26;
const MAX_BAR_HEIGHT = 92;
const BASELINE_Y = 112;
const LABEL_Y = 132;
const STUB_HEIGHT = 5;
const BAR_RADIUS = 5;
// Kvadratni donji + zaobljeni gornji (quiz) segment ostave tanak procjep na
// spoju zbog zaobljenja -- quiz pravougaonik malo "zaroni" u reviews segment
// da spoj ostane cist (kozmeticki, ne mijenja vidljivo omjer boja).
const SEAM_OVERLAP = 2;

const REVIEWS_COLOR = '#4FA8FF';
const QUIZ_COLOR = palette.nebula;

export function ActivityChart({ activity }: { activity: DailyActivity[] }) {
  const { t, i18n } = useTranslation();
  const maxTotal = Math.max(1, ...activity.map((day) => day.reviews + day.quizAnswers));
  const totalCount = activity.reduce((sum, day) => sum + day.reviews + day.quizAnswers, 0);
  const hasActivity = totalCount > 0;
  const gap = (CHART_W - activity.length * BAR_WIDTH) / (activity.length + 1);
  const weekdayFormatter = new Intl.DateTimeFormat(i18n.language === 'hr' ? 'hr-HR' : 'en-US', { weekday: 'short' });

  return (
    <GlassCard gap={10} pt={18} px={16} pb={14} borderRadius={18}>
      <XStack ai="center" jc="space-between">
        <Paragraph fontFamily="$heading" fontSize={15} fontWeight="600" color={palette.starlight}>
          {t('stats.activityTitle')}
        </Paragraph>
        <Paragraph fontSize={12} color={palette.haze}>
          {t('stats.activityTotal', { count: totalCount })}
        </Paragraph>
      </XStack>

      <YStack position="relative">
        <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
          {activity.map((day, index) => {
            const x = gap + index * (BAR_WIDTH + gap);
            const total = day.reviews + day.quizAnswers;
            const isToday = index === activity.length - 1;
            const label = weekdayFormatter.format(new Date(`${day.dateKey}T00:00:00`)).slice(0, 2);
            const labelColor = isToday ? palette.starlight : palette.haze;
            const labelWeight = isToday ? '700' : '400';

            if (!hasActivity || total === 0) {
              return (
                <G key={day.dateKey}>
                  <Rect
                    x={x}
                    y={BASELINE_Y - STUB_HEIGHT}
                    width={BAR_WIDTH}
                    height={STUB_HEIGHT}
                    rx={STUB_HEIGHT / 2}
                    fill={palette.nebulaDeep}
                  />
                  <SvgText x={x + BAR_WIDTH / 2} y={LABEL_Y} fontSize={12} fontWeight={labelWeight} fill={labelColor} textAnchor="middle">
                    {label}
                  </SvgText>
                </G>
              );
            }

            const barHeight = Math.max(4, (total / maxTotal) * MAX_BAR_HEIGHT);
            const reviewsHeight = (day.reviews / total) * barHeight;
            const quizHeight = barHeight - reviewsHeight;

            return (
              <G key={day.dateKey}>
                {reviewsHeight > 0 && (
                  <Rect x={x} y={BASELINE_Y - reviewsHeight} width={BAR_WIDTH} height={reviewsHeight} fill={REVIEWS_COLOR} />
                )}
                {quizHeight > 0 && (
                  <Rect
                    x={x}
                    y={BASELINE_Y - barHeight}
                    width={BAR_WIDTH}
                    height={quizHeight + (reviewsHeight > 0 ? SEAM_OVERLAP : 0)}
                    rx={BAR_RADIUS}
                    fill={QUIZ_COLOR}
                  />
                )}
                <SvgText x={x + BAR_WIDTH / 2} y={LABEL_Y} fontSize={12} fontWeight={labelWeight} fill={labelColor} textAnchor="middle">
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

      <XStack gap={18} ai="center" jc="center">
        <XStack gap={7} ai="center">
          <YStack width={10} height={10} borderRadius={3} backgroundColor={REVIEWS_COLOR} />
          <Paragraph fontSize={12} color="#A5A5A5">
            {t('stats.activityReviews')}
          </Paragraph>
        </XStack>
        <XStack gap={7} ai="center">
          <YStack width={10} height={10} borderRadius={3} backgroundColor={QUIZ_COLOR} />
          <Paragraph fontSize={12} color="#A5A5A5">
            {t('stats.activityQuiz')}
          </Paragraph>
        </XStack>
      </XStack>
    </GlassCard>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, H2, Paragraph, Spinner, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { azimuthToCompass, getMoonPhaseName, getTonightSky, type SkyBodyInfo, type TonightSky } from '@/lib/astronomy';
import { getCurrentCoordinates, type Coordinates } from '@/lib/location';

function formatTime(date: Date | null): string {
  if (!date) return '—';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function TonightScreen() {
  const { t } = useTranslation();
  const [coords, setCoords] = useState<Coordinates | null | undefined>(undefined);
  const [sky, setSky] = useState<TonightSky | null>(null);

  async function loadLocation() {
    setCoords(undefined);
    const result = await getCurrentCoordinates();
    setCoords(result);
    if (result) {
      setSky(getTonightSky(result.latitude, result.longitude));
    }
  }

  useEffect(() => {
    (async () => {
      await loadLocation();
    })();
  }, []);

  return (
    <ScreenBackdrop>
      <YStack f={1} pt="$8" px="$4" gap="$3">
        <H2 color="$color">{t('tonight.title')}</H2>

        {coords === undefined && <Spinner size="large" />}

        {coords === null && (
          <GlassCard gap="$3">
            <Paragraph color="$color11">{t('tonight.permissionMessage')}</Paragraph>
            <Button theme="blue" onPress={loadLocation}>
              {t('tonight.enableLocation')}
            </Button>
          </GlassCard>
        )}

        {coords && sky && (
          <>
            <GlassCard gap="$1">
              <Paragraph fontFamily="$heading" fontSize="$5" color="$color">
                {t('tonight.sunset', { time: formatTime(sky.sunset) })}
              </Paragraph>
              <Paragraph color="$color11">{t('tonight.sunrise', { time: formatTime(sky.sunrise) })}</Paragraph>
            </GlassCard>

            <GlassCard gap="$1">
              <Paragraph fontFamily="$heading" fontSize="$5" color="$blue10">
                {t(`tonight.moonPhase.${getMoonPhaseName(sky.moonPhaseAngle)}`)}
              </Paragraph>
              <Paragraph color="$color11">
                {t('tonight.illuminated', { percent: Math.round(sky.moonPhaseFraction * 100) })}
              </Paragraph>
            </GlassCard>

            {sky.bodies
              .filter((body) => body.key !== 'moon')
              .map((body) => (
                <PlanetCard key={body.key} body={body} />
              ))}
          </>
        )}
      </YStack>
    </ScreenBackdrop>
  );
}

function PlanetCard({ body }: { body: SkyBodyInfo }) {
  const { t } = useTranslation();
  return (
    <GlassCard gap="$1">
      <Paragraph fontFamily="$heading" fontSize="$5" color={body.isUp ? '$green10' : '$color11'}>
        {t(`tonight.bodies.${body.key}`)}
      </Paragraph>
      {body.isUp ? (
        <Paragraph color="$color11">
          {t('tonight.visible', { direction: azimuthToCompass(body.azimuth), altitude: Math.round(body.altitude) })}
        </Paragraph>
      ) : (
        <Paragraph color="$color11">{t('tonight.notVisible')}</Paragraph>
      )}
      {body.riseTime && <Paragraph color="$color11">{t('tonight.rises', { time: formatTime(body.riseTime) })}</Paragraph>}
      {body.setTime && <Paragraph color="$color11">{t('tonight.sets', { time: formatTime(body.setTime) })}</Paragraph>}
    </GlassCard>
  );
}

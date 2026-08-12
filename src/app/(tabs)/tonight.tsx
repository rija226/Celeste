import { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, H2, Paragraph, Spinner, XStack, YStack } from 'tamagui';

import { GlassCard } from '@/components/GlassCard';
import { LinkedFact } from '@/components/LinkedFact';
import { ScreenBackdrop } from '@/components/ScreenBackdrop';
import { SkyMap, type SkyMapConstellation, type SkyMapObject } from '@/components/SkyMap';
import { getActiveShowers, getNextShower, type MeteorShower } from '@/data/meteorShowers';
import { SKY_BODY_CARD_SLUG } from '@/data/skyObjectCards';
import { getCardsBySlugs, getConstellations } from '@/db';
import {
  azimuthToCompass,
  getConstellationSkyPositions,
  getMoonPhaseName,
  getSunPosition,
  getTonightSky,
  type SkyBodyInfo,
  type SkyBodyKey,
  type TonightSky,
} from '@/lib/astronomy';
import { getCurrentCoordinates, type Coordinates } from '@/lib/location';
import { pickLocalized } from '@/lib/localized';
import { palette } from '@/theme/palette';
import type { Card, Constellation } from '@/types/models';

const PLANET_COLORS: Partial<Record<SkyBodyKey, string>> = {
  mercury: palette.haze,
  venus: '#F4C542',
  mars: palette.comet,
  jupiter: '#E0B88A',
  saturn: '#D8C48A',
};

function formatTime(date: Date | null): string {
  if (!date) return '—';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatShowerDate(date: Date, language: string): string {
  if (language === 'hr') {
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.`;
  }
  return `${EN_MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export default function TonightScreen() {
  const { t, i18n } = useTranslation();
  const [coords, setCoords] = useState<Coordinates | null | undefined>(undefined);
  const [sky, setSky] = useState<TonightSky | null>(null);
  const [linkedCards, setLinkedCards] = useState<Partial<Record<SkyBodyKey, Card>>>({});
  const [constellations, setConstellations] = useState<Constellation[]>([]);
  const [showMap, setShowMap] = useState(false);

  const mapObjects: SkyMapObject[] = useMemo(() => {
    if (!sky || !coords) return [];
    const sun = getSunPosition(coords.latitude, coords.longitude);
    const objects: SkyMapObject[] = [
      { id: 'sun', azimuth: sun.azimuth, altitude: sun.altitude, label: t('tonight.bodies.sun'), color: '#FFD54F', radius: 10 },
    ];
    for (const body of sky.bodies) {
      const isMoon = body.key === 'moon';
      objects.push({
        id: body.key,
        azimuth: body.azimuth,
        altitude: body.altitude,
        label: t(`tonight.bodies.${body.key}`),
        color: isMoon ? palette.starlight : (PLANET_COLORS[body.key] ?? palette.nebula),
        radius: isMoon ? 8 : 5,
      });
    }
    return objects;
  }, [sky, coords, t]);

  const mapConstellations: SkyMapConstellation[] = useMemo(() => {
    if (!coords || constellations.length === 0) return [];
    const positionsBySlug = new Map(
      getConstellationSkyPositions(coords.latitude, coords.longitude).map((p) => [p.slug, p]),
    );
    return constellations
      .map((c) => {
        const position = positionsBySlug.get(c.slug);
        if (!position || !position.isUp) return null;
        return {
          slug: c.slug,
          azimuth: position.azimuth,
          altitude: position.altitude,
          name: pickLocalized(c.name, i18n.language),
          stars: c.stars,
          lines: c.lines,
        };
      })
      .filter((c): c is SkyMapConstellation => c !== null);
  }, [constellations, coords, i18n.language]);

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
      const entries = Object.entries(SKY_BODY_CARD_SLUG) as [SkyBodyKey, string][];
      const cards = await getCardsBySlugs(entries.map(([, slug]) => slug));
      const cardsBySlug = new Map(cards.map((card) => [card.slug, card]));
      const bySkyBody: Partial<Record<SkyBodyKey, Card>> = {};
      for (const [key, slug] of entries) {
        const card = cardsBySlug.get(slug);
        if (card) bySkyBody[key] = card;
      }
      setLinkedCards(bySkyBody);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      await loadLocation();
    })();
  }, []);

  useEffect(() => {
    getConstellations()
      .then(setConstellations)
      .catch(() => {});
  }, []);

  return (
    <ScreenBackdrop>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack f={1} pt="$8" px="$4" pb="$8" gap="$3">
          <XStack ai="center" jc="space-between">
            <H2 color="$color">{t('tonight.title')}</H2>
            {coords && sky && (
              <Button size="$3" theme={showMap ? 'blue' : undefined} onPress={() => setShowMap((v) => !v)}>
                {showMap ? t('tonight.map.listView') : t('tonight.map.toggle')}
              </Button>
            )}
          </XStack>

          {coords === undefined && <Spinner size="large" />}

          {coords === null && (
            <GlassCard gap="$3">
              <Paragraph color="$color11">{t('tonight.permissionMessage')}</Paragraph>
              <Button theme="blue" onPress={loadLocation}>
                {t('tonight.enableLocation')}
              </Button>
            </GlassCard>
          )}

          {coords && sky && showMap && (
            <YStack ai="center" py="$2">
              <SkyMap objects={mapObjects} constellations={mapConstellations} />
            </YStack>
          )}

          {coords && sky && !showMap && (
            <>
              <MeteorShowerSection />

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
                {linkedCards.moon && <LinkedFact card={linkedCards.moon} />}
              </GlassCard>

              {sky.bodies
                .filter((body) => body.key !== 'moon')
                .map((body) => (
                  <PlanetCard key={body.key} body={body} linkedCard={linkedCards[body.key]} />
                ))}
            </>
          )}
        </YStack>
      </ScrollView>
    </ScreenBackdrop>
  );
}

function PlanetCard({ body, linkedCard }: { body: SkyBodyInfo; linkedCard: Card | undefined }) {
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
      {linkedCard && <LinkedFact card={linkedCard} />}
    </GlassCard>
  );
}

function MeteorShowerSection() {
  const { t } = useTranslation();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const active = getActiveShowers(now);
  const next = getNextShower(now);
  const nextIsAlreadyActive = next ? active.some((shower) => shower.slug === next.shower.slug) : false;

  return (
    <GlassCard gap="$2">
      <Paragraph fontFamily="$heading" fontSize="$5" color="$color">
        {t('tonight.meteorShowers.title')}
      </Paragraph>

      {active.map((shower) => (
        <ShowerRow
          key={shower.slug}
          shower={shower}
          peakDate={new Date(today.getFullYear(), shower.peak.month - 1, shower.peak.day)}
          label={t('tonight.meteorShowers.activeNow')}
        />
      ))}

      {next && !nextIsAlreadyActive && (
        <ShowerRow
          shower={next.shower}
          peakDate={next.peakDate}
          label={(() => {
            const daysUntil = Math.round((next.peakDate.getTime() - today.getTime()) / 86400000);
            return daysUntil <= 0
              ? t('tonight.meteorShowers.today')
              : `${t('tonight.meteorShowers.nextUp')} · ${t('tonight.meteorShowers.inDays', { count: daysUntil })}`;
          })()}
        />
      )}
    </GlassCard>
  );
}

function ShowerRow({ shower, peakDate, label }: { shower: MeteorShower; peakDate: Date; label: string }) {
  const { t, i18n } = useTranslation();
  return (
    <YStack gap="$0.5">
      <Paragraph color="$blue10" fontWeight="600">
        {pickLocalized(shower.name, i18n.language)} · {label}
      </Paragraph>
      <Paragraph color="$color11" fontSize="$2">
        {t('tonight.meteorShowers.peakOn', { date: formatShowerDate(peakDate, i18n.language) })}
        {' · '}
        {t('tonight.meteorShowers.radiant', { name: pickLocalized(shower.radiant, i18n.language) })}
      </Paragraph>
    </YStack>
  );
}

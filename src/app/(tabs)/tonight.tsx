import { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { Defs, Line as SvgLine, LinearGradient as SvgLinearGradient, Stop, Svg, Circle as SvgCircle } from 'react-native-svg';
import { H2, H3, Paragraph, Spinner, XStack, YStack } from 'tamagui';

import { AltitudeGauge } from '@/components/AltitudeGauge';
import { GlassCard } from '@/components/GlassCard';
import { LinkedFact } from '@/components/LinkedFact';
import { MoonPhaseDisc } from '@/components/MoonPhaseDisc';
import { PillButton } from '@/components/PillButton';
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
import { useAmbientSound } from '@/lib/sound';
import { palette } from '@/theme/palette';
import type { Card, Constellation } from '@/types/models';

const PLANET_COLORS: Partial<Record<SkyBodyKey, string>> = {
  mercury: palette.haze,
  venus: '#F4C542',
  mars: palette.comet,
  jupiter: '#E0B88A',
  saturn: '#D8C48A',
};

const CAPTION = '#A5A5A5';
const SUB_INK = '#C9C4EC';

function formatTime(date: Date | null): string {
  if (!date) return '—';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

type SelectedInfo = { title: string; description?: string; card?: Card };
type ViewMode = 'list' | 'map' | 'ar';

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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedInfo, setSelectedInfo] = useState<SelectedInfo | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useAmbientSound();

  const mapObjects: SkyMapObject[] = useMemo(() => {
    if (!sky || !coords) return [];
    const sun = getSunPosition(coords.latitude, coords.longitude);
    const objects: SkyMapObject[] = [
      {
        id: 'sun',
        azimuth: sun.azimuth,
        altitude: sun.altitude,
        label: t('tonight.bodies.sun'),
        color: '#FFD54F',
        radius: 10,
        onPress: () => setSelectedInfo({ title: t('tonight.bodies.sun') }),
      },
    ];
    for (const body of sky.bodies) {
      const isMoon = body.key === 'moon';
      const linkedCard = linkedCards[body.key];
      objects.push({
        id: body.key,
        azimuth: body.azimuth,
        altitude: body.altitude,
        label: t(`tonight.bodies.${body.key}`),
        color: isMoon ? palette.starlight : (PLANET_COLORS[body.key] ?? palette.nebula),
        radius: isMoon ? 8 : 5,
        onPress: () => setSelectedInfo({ title: t(`tonight.bodies.${body.key}`), card: linkedCard }),
      });
    }
    return objects;
  }, [sky, coords, t, linkedCards]);

  const mapConstellations: SkyMapConstellation[] = useMemo(() => {
    if (!coords || constellations.length === 0) return [];
    const positionsBySlug = new Map(
      getConstellationSkyPositions(coords.latitude, coords.longitude).map((p) => [p.slug, p]),
    );
    return constellations
      .map((c): SkyMapConstellation | null => {
        const position = positionsBySlug.get(c.slug);
        if (!position || !position.isUp) return null;
        const name = pickLocalized(c.name, i18n.language);
        return {
          slug: c.slug,
          azimuth: position.azimuth,
          altitude: position.altitude,
          name,
          stars: c.stars,
          lines: c.lines,
          onPress: () => setSelectedInfo({ title: name, description: pickLocalized(c.facts, i18n.language) }),
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
              <XStack gap="$1.5">
                <ViewModeButton
                  active={viewMode === 'list'}
                  onPress={() => {
                    setViewMode('list');
                    setSelectedInfo(null);
                  }}
                  icon="list"
                />
                <ViewModeButton
                  active={viewMode === 'map'}
                  onPress={() => {
                    setViewMode('map');
                    setSelectedInfo(null);
                  }}
                  icon="planet-outline"
                />
                <ViewModeButton
                  active={viewMode === 'ar'}
                  onPress={async () => {
                    if (!cameraPermission?.granted) await requestCameraPermission();
                    setViewMode('ar');
                    setSelectedInfo(null);
                  }}
                  icon="camera-outline"
                />
              </XStack>
            )}
          </XStack>

          {coords === undefined && <Spinner size="large" />}

          {coords === null && (
            <GlassCard gap="$3">
              <Paragraph color="$color11">{t('tonight.permissionMessage')}</Paragraph>
              <PillButton label={t('tonight.enableLocation')} color={palette.nebula} onPress={loadLocation} />
            </GlassCard>
          )}

          {coords && sky && viewMode === 'map' && (
            <YStack ai="center" py="$2" gap="$3">
              <SkyMap objects={mapObjects} constellations={mapConstellations} />
              <SelectedInfoPanel info={selectedInfo} onClose={() => setSelectedInfo(null)} />
            </YStack>
          )}

          {coords && sky && viewMode === 'ar' && (
            <YStack ai="center" py="$2" gap="$3">
              {cameraPermission?.granted ? (
                <SkyMap objects={mapObjects} constellations={mapConstellations} arMode />
              ) : (
                <GlassCard gap="$3" width="100%">
                  <Paragraph color="$color11">{t('tonight.map.cameraPermissionMessage')}</Paragraph>
                  <PillButton label={t('tonight.map.enableCamera')} color={palette.nebula} onPress={requestCameraPermission} />
                </GlassCard>
              )}
              <SelectedInfoPanel info={selectedInfo} onClose={() => setSelectedInfo(null)} />
            </YStack>
          )}

          {coords && sky && viewMode === 'list' && (
            <>
              <MeteorShowerSection />

              <XStack gap="$3">
                <HorizonCard
                  icon="arrow-down-outline"
                  iconColor={palette.amber}
                  label={t('tonight.sunsetLabel')}
                  time={formatTime(sky.sunset)}
                />
                <HorizonCard
                  icon="arrow-up-outline"
                  iconColor="#52A9FF"
                  label={t('tonight.sunriseLabel')}
                  time={formatTime(sky.sunrise)}
                />
              </XStack>

              <XStack
                ai="center"
                gap={14}
                p={16}
                borderRadius={18}
                backgroundColor="rgba(43,37,96,0.85)"
                borderWidth={1}
                borderColor="rgba(124,108,255,0.4)">
                <MoonPhaseDisc phaseAngle={sky.moonPhaseAngle} illuminatedFraction={sky.moonPhaseFraction} />
                <YStack f={1} gap={2}>
                  <Paragraph fontFamily="$heading" fontSize={17} fontWeight="600" color={palette.starlight}>
                    {t(`tonight.moonPhase.${getMoonPhaseName(sky.moonPhaseAngle)}`)}
                  </Paragraph>
                  <Paragraph fontSize={13} color={CAPTION}>
                    {t('tonight.illuminated', { percent: Math.round(sky.moonPhaseFraction * 100) })}
                  </Paragraph>
                  {linkedCards.moon && <LinkedFact card={linkedCards.moon} />}
                </YStack>
              </XStack>

              <Paragraph fontSize={11} fontWeight="600" letterSpacing={1.1} textTransform="uppercase" color={palette.haze} mt="$0.5">
                {t('tonight.planetsLabel')}
              </Paragraph>

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

function SelectedInfoPanel({ info, onClose }: { info: SelectedInfo | null; onClose: () => void }) {
  if (!info) return null;
  return (
    <GlassCard gap="$2" width="100%">
      <XStack ai="center" jc="space-between">
        <H3 fontFamily="$heading" color="$color">
          {info.title}
        </H3>
        <YStack onPress={onClose} pressStyle={{ opacity: 0.7 }} p="$1">
          <Ionicons name="close" size={20} color={palette.haze} />
        </YStack>
      </XStack>
      {info.description && <Paragraph color="$color11">{info.description}</Paragraph>}
      {info.card && <LinkedFact card={info.card} />}
    </GlassCard>
  );
}

function ViewModeButton({
  active,
  onPress,
  icon,
}: {
  active: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <YStack
      width={38}
      height={38}
      borderRadius={999}
      ai="center"
      jc="center"
      backgroundColor={active ? palette.nebula : 'rgba(43,37,96,0.9)'}
      borderWidth={1}
      borderColor={active ? palette.nebula : 'rgba(124,108,255,0.5)'}
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}>
      <Ionicons name={icon} size={18} color={palette.starlight} />
    </YStack>
  );
}

function HorizonCard({
  icon,
  iconColor,
  label,
  time,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  time: string;
}) {
  return (
    <XStack
      f={1}
      ai="center"
      gap={10}
      p={14}
      borderRadius={18}
      backgroundColor="rgba(43,37,96,0.85)"
      borderWidth={1}
      borderColor="rgba(124,108,255,0.4)">
      <Ionicons name={icon} size={20} color={iconColor} />
      <YStack>
        <Paragraph fontSize={11} textTransform="uppercase" letterSpacing={0.7} color={palette.haze}>
          {label}
        </Paragraph>
        <Paragraph fontFamily="$heading" fontSize={18} fontWeight="600" color={palette.starlight}>
          {time}
        </Paragraph>
      </YStack>
    </XStack>
  );
}

function planetMetaLine(body: SkyBodyInfo, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const compass = azimuthToCompass(body.azimuth);
  const alt = Math.round(body.altitude);
  if (body.isUp) {
    const timePart = body.setTime
      ? t('tonight.setsCompact', { time: formatTime(body.setTime) })
      : body.riseTime
        ? t('tonight.risesCompact', { time: formatTime(body.riseTime) })
        : '';
    return [`${compass} · ${alt}°`, timePart].filter(Boolean).join(' · ');
  }
  const parts: string[] = [];
  if (body.riseTime) parts.push(t('tonight.rises', { time: formatTime(body.riseTime) }));
  if (body.setTime) parts.push(t('tonight.setsCompact', { time: formatTime(body.setTime) }));
  return parts.join(' · ');
}

function PlanetCard({ body, linkedCard }: { body: SkyBodyInfo; linkedCard: Card | undefined }) {
  const { t } = useTranslation();
  const visible = body.isUp;
  const dotColor = visible ? (PLANET_COLORS[body.key] ?? palette.nebula) : palette.haze;

  return (
    <XStack
      ai="center"
      gap={12}
      py={13}
      px={14}
      borderRadius={16}
      backgroundColor={visible ? 'rgba(43,37,96,0.7)' : 'rgba(23,19,52,0.55)'}
      borderWidth={1}
      borderColor={visible ? 'rgba(51,214,176,0.35)' : 'rgba(141,138,174,0.25)'}
      opacity={visible ? 1 : 0.75}>
      <YStack
        width={12}
        height={12}
        borderRadius={999}
        backgroundColor={dotColor}
        shadowColor={dotColor}
        shadowOpacity={visible ? 0.7 : 0}
        shadowRadius={visible ? 6 : 0}
        shadowOffset={{ width: 0, height: 0 }}
      />
      <YStack f={1} gap="$1">
        <XStack ai="center" gap="$2">
          <Paragraph fontFamily="$heading" fontSize={16} fontWeight="600" color={visible ? palette.starlight : SUB_INK}>
            {t(`tonight.bodies.${body.key}`)}
          </Paragraph>
          <XStack
            px={8}
            py={2}
            borderRadius={999}
            backgroundColor={visible ? 'rgba(51,214,176,0.18)' : 'transparent'}
            borderWidth={visible ? 0 : 1}
            borderColor="rgba(141,138,174,0.5)">
            <Paragraph fontSize={10} fontWeight="700" color={visible ? palette.aurora : palette.haze}>
              {visible ? t('tonight.pill.visible') : t('tonight.pill.below')}
            </Paragraph>
          </XStack>
        </XStack>
        <Paragraph fontSize={12} color={CAPTION}>
          {planetMetaLine(body, t)}
        </Paragraph>
        {linkedCard && <LinkedFact card={linkedCard} />}
      </YStack>
      {visible && <AltitudeGauge altitude={body.altitude} color={dotColor} />}
      <Ionicons name="chevron-forward" size={18} color={palette.haze} />
    </XStack>
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
    <YStack
      position="relative"
      borderRadius={20}
      p={16}
      overflow="hidden"
      borderWidth={1}
      borderColor="rgba(124,108,255,0.6)"
      shadowColor={palette.nebula}
      shadowOpacity={0.28}
      shadowRadius={20}
      shadowOffset={{ width: 0, height: 8 }}>
      <LinearGradient
        colors={['rgba(124,108,255,0.35)', 'rgba(43,37,96,0.92)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Svg
        width={120}
        height={120}
        viewBox="0 0 120 120"
        style={{ position: 'absolute', top: -10, right: -6, opacity: 0.9 }}
        pointerEvents="none">
        <Defs>
          <SvgLinearGradient id="meteorStreak" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.starlight} stopOpacity={0} />
            <Stop offset="1" stopColor={palette.starlight} stopOpacity={0.9} />
          </SvgLinearGradient>
        </Defs>
        <SvgLine x1={20} y1={18} x2={86} y2={84} stroke="url(#meteorStreak)" strokeWidth={2.5} strokeLinecap="round" />
        <SvgCircle cx={86} cy={84} r={3} fill={palette.starlight} />
        <SvgLine x1={48} y1={8} x2={82} y2={42} stroke="url(#meteorStreak)" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
      </Svg>

      <XStack ai="center" gap={8} mb={10}>
        <Ionicons name="sparkles" size={16} color={palette.amber} />
        <Paragraph fontFamily="$heading" fontSize={16} fontWeight="600" color={palette.starlight}>
          {t('tonight.meteorShowers.title')}
        </Paragraph>
      </XStack>

      <YStack gap={10}>
        {active.map((shower) => (
          <ShowerRow
            key={shower.slug}
            shower={shower}
            peakDate={new Date(today.getFullYear(), shower.peak.month - 1, shower.peak.day)}
            label={t('tonight.meteorShowers.activeNow')}
            variant="active"
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
            variant="next"
          />
        )}
      </YStack>
    </YStack>
  );
}

function ShowerRow({
  shower,
  peakDate,
  label,
  variant,
}: {
  shower: MeteorShower;
  peakDate: Date;
  label: string;
  variant: 'active' | 'next';
}) {
  const { t, i18n } = useTranslation();
  const color = variant === 'active' ? palette.aurora : palette.amber;
  return (
    <XStack ai="center" gap={10}>
      <XStack
        px={9}
        py={3}
        borderRadius={999}
        backgroundColor={`${color}33`}
        borderWidth={1}
        borderColor={color}
        flexShrink={0}>
        <Paragraph fontSize={10} fontWeight="700" letterSpacing={0.5} textTransform="uppercase" color={color}>
          {label}
        </Paragraph>
      </XStack>
      <YStack f={1}>
        <Paragraph fontWeight="600" fontSize={14} color={palette.starlight}>
          {pickLocalized(shower.name, i18n.language)}
        </Paragraph>
        <Paragraph fontSize={12} color={SUB_INK}>
          {t('tonight.meteorShowers.peakOn', { date: formatShowerDate(peakDate, i18n.language) })}
          {' · '}
          {t('tonight.meteorShowers.radiant', { name: pickLocalized(shower.radiant, i18n.language) })}
        </Paragraph>
      </YStack>
    </XStack>
  );
}

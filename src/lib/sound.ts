import { useCallback } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import ambientSource from '../../assets/audio/ambient/space-ambient.wav';
import celebrationSound from '../../assets/audio/sfx/celebration.wav';
import quizCorrectSound from '../../assets/audio/sfx/quiz-correct.wav';
import quizIncorrectSound from '../../assets/audio/sfx/quiz-incorrect.wav';
import ratingConfirmSound from '../../assets/audio/sfx/rating-confirm.wav';
import rocketLaunchSound from '../../assets/audio/sfx/rocket-launch.wav';
import { useSoundStore } from '@/store/sound';

const SFX_SOURCES = {
  quizCorrect: quizCorrectSound,
  quizIncorrect: quizIncorrectSound,
  ratingConfirm: ratingConfirmSound,
  rocketLaunch: rocketLaunchSound,
  celebration: celebrationSound,
} as const;

export type SfxKey = keyof typeof SFX_SOURCES;

const AMBIENT_SOURCE = ambientSource;
const AMBIENT_VOLUME = 0.25;

let sfxPlayers: Partial<Record<SfxKey, AudioPlayer>> | null = null;
let ambientPlayer: AudioPlayer | null = null;

// Postuje sistemski tihi rezim (iOS mute switch) -- zvuk se NE probija kad je
// telefon utisan. Bez background reprodukcije (ambijent i onako treba stati
// kad app ode u pozadinu), pa ne treba expo-audio background plugin/rebuild.
export async function configureAudioMode(): Promise<void> {
  await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false });
}

function getSfxPlayers(): Partial<Record<SfxKey, AudioPlayer>> {
  if (!sfxPlayers) {
    sfxPlayers = {};
    for (const key of Object.keys(SFX_SOURCES) as SfxKey[]) {
      sfxPlayers[key] = createAudioPlayer(SFX_SOURCES[key]);
    }
  }
  return sfxPlayers;
}

function getAmbientPlayer(): AudioPlayer {
  if (!ambientPlayer) {
    ambientPlayer = createAudioPlayer(AMBIENT_SOURCE);
    ambientPlayer.loop = true;
    ambientPlayer.volume = AMBIENT_VOLUME;
  }
  return ambientPlayer;
}

// Kreira sve playere odmah (lokalni bundlovani fajlovi, ucitavanje je skoro
// trenutno) da prvi playSfx() poziv nema kasnjenje. Pozvati jednom pri startu.
export function preloadSounds(): void {
  getSfxPlayers();
  getAmbientPlayer();
}

export function playSfx(key: SfxKey): void {
  if (!useSoundStore.getState().sfxEnabled) return;
  const player = getSfxPlayers()[key];
  if (!player) return;
  player.seekTo(0);
  player.play();
}

function startAmbient(): void {
  if (!useSoundStore.getState().ambientEnabled) return;
  getAmbientPlayer().play();
}

function stopAmbient(): void {
  ambientPlayer?.pause();
}

// Pozvati jednom po ekranu gdje ambijent treba svirati (Study, Tonight).
// useFocusEffect pokriva i tab-navigaciju (ekran ostaje montiran ali gubi
// fokus) i obican unmount; AppState pretplata unutra hvata odlazak u
// pozadinu dok je ekran fokusiran. Cleanup uvijek zaustavlja ambijent.
export function useAmbientSound(): void {
  const ambientEnabled = useSoundStore((s) => s.ambientEnabled);

  useFocusEffect(
    useCallback(() => {
      if (ambientEnabled && AppState.currentState === 'active') startAmbient();

      const subscription = AppState.addEventListener('change', (state) => {
        if (ambientEnabled && state === 'active') startAmbient();
        else stopAmbient();
      });

      return () => {
        subscription.remove();
        stopAmbient();
      };
    }, [ambientEnabled]),
  );
}

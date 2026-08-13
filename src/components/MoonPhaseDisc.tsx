import Svg, { Circle, ClipPath, Defs } from 'react-native-svg';

const LIT_COLOR = '#EDEAF7';
const DARK_COLOR = '#20203a';
const OUTLINE_COLOR = 'rgba(241,239,251,0.25)';

type MoonPhaseDiscProps = {
  size?: number;
  /** MoonPhase() -- 0-360, 0=novi mjesec, 180=pun mjesec. */
  phaseAngle: number;
  /** Illumination().phase_fraction -- 0-1, uvijek pozitivno. */
  illuminatedFraction: number;
};

// Dva preklopljena kruga istog radijusa: svijetla puna baza + tamni krug
// pomjeren horizontalno da "izgrize" terminator. Kod 0% pomak=0 (tamni
// potpuno prekriva svijetli), kod 100% pomak=precnik (bez preklapanja).
// Rastuci mjesec (< 180) osvijetljen je desno -- tamni krug se pomjera
// ulijevo; opadajuci (>= 180) obrnuto. Aproksimacija, ne prava elipsa
// terminatora, ali ispravna za bilo koju fazu (ne samo mock vrijednosti).
export function MoonPhaseDisc({ size = 68, phaseAngle, illuminatedFraction }: MoonPhaseDiscProps) {
  const radius = 30;
  const cx = size / 2;
  const cy = size / 2;
  const waxing = phaseAngle < 180;
  const fraction = Math.max(0, Math.min(1, illuminatedFraction));
  const offsetX = (waxing ? -1 : 1) * fraction * radius * 2;
  const clipId = 'moon-disc-clip';

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx={cx} cy={cy} r={radius} />
        </ClipPath>
      </Defs>
      <Circle cx={cx} cy={cy} r={radius} fill={LIT_COLOR} clipPath={`url(#${clipId})`} />
      <Circle cx={cx + offsetX} cy={cy} r={radius} fill={DARK_COLOR} clipPath={`url(#${clipId})`} />
      <Circle cx={cx} cy={cy} r={radius - 0.5} fill="none" stroke={OUTLINE_COLOR} strokeWidth={1} />
    </Svg>
  );
}

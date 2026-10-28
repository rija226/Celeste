export type FieldOfView = { horizontalDeg: number; verticalDeg: number };
export type SkyVector = readonly [number, number, number];
export type ScreenPoint = { x: number; y: number; visible: boolean };

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// Jedinicni vektor u world okviru (X=istok, Y=sjever, Z=gore) za tacku neba
// zadatu azimutom i visinom. Racuna se jednom po objektu, ne po frame-u.
export function horizontalToVector(azimuth: number, altitude: number): SkyVector {
  const az = azimuth * DEG2RAD;
  const alt = altitude * DEG2RAD;
  return [Math.cos(alt) * Math.sin(az), Math.cos(alt) * Math.cos(az), Math.sin(alt)];
}

// Pinhole projekcija kroz zadnju kameru -- isti model kao objektiv. `matrix`
// je device->world rotaciona matrica (row-major, vidi DeviceAttitudeEvent);
// posto je ortonormirana, world->device je njena transpozicija. Device okvir:
// X desno, Y prema vrhu ekrana, Z prema korisniku (kamera gleda u -Z).
// Rezultat su pikseli relativno na centar prikaza. Radi s punom orijentacijom
// (nagib telefona u stranu, gledanje u zenit) -- nema singulariteta kao kod
// racunanja preko azimuta/visine pogleda.
export function projectToScreen(v: SkyVector, matrix: readonly number[], focalPx: number): ScreenPoint {
  'worklet';
  const dx = matrix[0] * v[0] + matrix[3] * v[1] + matrix[6] * v[2];
  const dy = matrix[1] * v[0] + matrix[4] * v[1] + matrix[7] * v[2];
  const dz = matrix[2] * v[0] + matrix[5] * v[1] + matrix[8] * v[2];
  const depth = -dz;
  if (depth <= 0.01) {
    return { x: 0, y: 0, visible: false }; // iza kamere
  }
  return { x: (focalPx * dx) / depth, y: (-focalPx * dy) / depth, visible: true };
}

// Azimut smjera u kojem gleda zadnja kamera (za "Gledas prema ..." hint).
export function cameraAzimuth(matrix: readonly number[]): number {
  'worklet';
  const azimuth = Math.atan2(-matrix[2], -matrix[5]) * RAD2DEG;
  return azimuth < 0 ? azimuth + 360 : azimuth;
}

// Fokalna duzina u pikselima za prikaz width x height koji pregled kamere
// popunjava "cover" nacinom (visak slike se odsijece) -- uzima se veca od
// dvije, tj. strana koja je odsjecena ne smanjuje uvecanje. `fov` je u
// portret orijentaciji.
export function focalLengthPx(width: number, height: number, fov: FieldOfView): number {
  const tanH = Math.tan((fov.horizontalDeg / 2) * DEG2RAD);
  const tanV = Math.tan((fov.verticalDeg / 2) * DEG2RAD);
  return Math.max(width / 2 / tanH, height / 2 / tanV);
}

// 1€ filtar (Casiez i sar., 2012) nad rotacionom matricom: dok telefon miruje,
// niska granicna frekvencija gasi drhtanje ruke i magnetni sum; kad se brzo
// okrece, granicna frekvencija raste s ugaonom brzinom pa nema osjetnog
// kasnjenja. Konstante su prvi pokusaj -- fino podesavanje na uredjaju.
const MIN_CUTOFF_HZ = 1.0;
const BETA = 0.03; // Hz po stepenu/s ugaone brzine
const SPEED_CUTOFF_HZ = 1.0;

function smoothingFactor(cutoffHz: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoffHz);
  return 1 / (1 + tau / dt);
}

export function createAttitudeFilter(): (raw: number[], timestamp: number) => number[] {
  let filtered: number[] | null = null;
  let lastRaw: number[] = [];
  let lastTime = 0;
  let speed = 0; // stepeni/s, i sama zagladjena

  return (raw, timestamp) => {
    if (!filtered) {
      filtered = raw.slice();
      lastRaw = raw;
      lastTime = timestamp;
      return filtered;
    }
    const dt = timestamp - lastTime;
    if (dt <= 0) return filtered;

    // Za male rotacije je Frobeniusova norma razlike dvije matrice ≈ √2·ugao.
    let squared = 0;
    for (let i = 0; i < 9; i++) squared += (raw[i] - lastRaw[i]) ** 2;
    const rawSpeed = (Math.sqrt(squared / 2) * RAD2DEG) / dt;
    speed += (rawSpeed - speed) * smoothingFactor(SPEED_CUTOFF_HZ, dt);

    const alpha = smoothingFactor(MIN_CUTOFF_HZ + BETA * speed, dt);
    // ponytail: usrednjavanje po elementima bez re-ortonormalizacije -- uzastopne
    // orijentacije su bliske pa je greska drugog reda; Gram-Schmidt ako se ikad
    // pojavi izoblicenje.
    const previous: number[] = filtered;
    filtered = previous.map((value, i) => value + (raw[i] - value) * alpha);
    lastRaw = raw;
    lastTime = timestamp;
    return filtered;
  };
}

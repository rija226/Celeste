export type ViewDirection = { azimuth: number; altitude: number };
export type FieldOfView = { horizontalDeg: number; verticalDeg: number };
export type ProjectedPoint = { x: number; y: number; visible: boolean };

const DEG2RAD = Math.PI / 180;

function wrapDeg180(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

// Projektuje realnu (azimut, visina) tacku neba u normalizovan prostor
// pogleda (-1..1 po x i y, (0,0) = centar), u odnosu na trenutni smjer
// gledanja (view) i vidno polje (fov). Cista funkcija -- rectilinear
// (gnomonic) projekcija, isti model kao objektiv kamere. Faza C (AR) ce
// koristiti ovu istu funkciju nepromijenjenu, samo ce "view" dolaziti iz
// senzora (kompas/ziroskop) umjesto rucnog pomjeranja kao u Fazi A.
export function projectToView(
  objectAzimuth: number,
  objectAltitude: number,
  view: ViewDirection,
  fov: FieldOfView,
): ProjectedPoint {
  const relAz = wrapDeg180(objectAzimuth - view.azimuth) * DEG2RAD;
  const alt = objectAltitude * DEG2RAD;
  const pitch = view.altitude * DEG2RAD;

  // Vektor objekta u ravni "gledaoca prije nagiba" (relativni azimut 0 = pravo naprijed).
  const vx = Math.sin(relAz) * Math.cos(alt);
  const vyFlat = Math.cos(relAz) * Math.cos(alt);
  const vz = Math.sin(alt);

  // Nagni za view.altitude oko horizontalne (x) ose -- dovodi centar pogleda na "pravo naprijed".
  const vy = vyFlat * Math.cos(pitch) + vz * Math.sin(pitch);
  const vzTilted = -vyFlat * Math.sin(pitch) + vz * Math.cos(pitch);

  if (vy <= 0.01) {
    return { x: 0, y: 0, visible: false }; // iza posmatraca
  }

  const halfH = (fov.horizontalDeg / 2) * DEG2RAD;
  const halfV = (fov.verticalDeg / 2) * DEG2RAD;

  const screenX = vx / vy / Math.tan(halfH);
  const screenY = -vzTilted / vy / Math.tan(halfV);

  const visible = Math.abs(screenX) <= 1 && Math.abs(screenY) <= 1;
  return { x: screenX, y: screenY, visible };
}

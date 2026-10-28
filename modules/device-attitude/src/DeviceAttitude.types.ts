export type DeviceAttitudeEvent = {
  // Rotaciona matrica device->world, row-major (9 elemenata). World okvir:
  // X=istok, Y=sjever, Z=gore. Device okvir: X desno, Y prema vrhu ekrana,
  // Z iz ekrana prema korisniku (zadnja kamera gleda u -Z).
  matrix: number[];
  // Vrijeme ocitanja senzora u sekundama (monotono, ne Unix vrijeme).
  timestamp: number;
};

// Vidno polje zadnje kamere u portret orijentaciji.
export type CameraFov = {
  horizontalDeg: number;
  verticalDeg: number;
};

export type DeviceAttitudeModuleEvents = {
  onAttitudeUpdate: (event: DeviceAttitudeEvent) => void;
};

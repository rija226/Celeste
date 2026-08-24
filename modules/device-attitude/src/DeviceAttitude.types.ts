export type DeviceAttitudeEvent = {
  azimuth: number;
  altitude: number;
};

export type DeviceAttitudeModuleEvents = {
  onAttitudeUpdate: (event: DeviceAttitudeEvent) => void;
};

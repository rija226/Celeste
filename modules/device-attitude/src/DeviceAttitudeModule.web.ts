import { registerWebModule, NativeModule } from 'expo';

import type { DeviceAttitudeModuleEvents } from './DeviceAttitude.types';

// Nije podrzano na webu -- nema fuzionisanog attitude senzora u browseru.
class DeviceAttitudeModule extends NativeModule<DeviceAttitudeModuleEvents> {
  async isAvailableAsync(): Promise<boolean> {
    return false;
  }
  async setUpdateInterval(_intervalMs: number): Promise<void> {}
}

export default registerWebModule(DeviceAttitudeModule, 'DeviceAttitudeModule');

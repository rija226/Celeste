import { NativeModule, requireNativeModule } from 'expo';

import type { DeviceAttitudeModuleEvents } from './DeviceAttitude.types';

declare class DeviceAttitudeModule extends NativeModule<DeviceAttitudeModuleEvents> {
  isAvailableAsync(): Promise<boolean>;
  setUpdateInterval(intervalMs: number): Promise<void>;
}

export default requireNativeModule<DeviceAttitudeModule>('DeviceAttitude');

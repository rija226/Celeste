import { NativeModule, requireNativeModule } from 'expo';

import type { CameraFov, DeviceAttitudeModuleEvents } from './DeviceAttitude.types';

declare class DeviceAttitudeModule extends NativeModule<DeviceAttitudeModuleEvents> {
  isAvailableAsync(): Promise<boolean>;
  setUpdateInterval(intervalMs: number): Promise<void>;
  getCameraFovAsync(): Promise<CameraFov | null>;
}

export default requireNativeModule<DeviceAttitudeModule>('DeviceAttitude');

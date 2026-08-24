// Re-export the native module. On web, it will be resolved to DeviceAttitudeModule.web.ts
// and on native platforms to DeviceAttitudeModule.ts
export { default } from './src/DeviceAttitudeModule';
export * from './src/DeviceAttitude.types';

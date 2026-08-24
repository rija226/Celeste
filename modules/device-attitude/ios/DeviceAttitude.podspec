Pod::Spec.new do |s|
  s.name           = 'DeviceAttitude'
  s.version        = '1.0.0'
  s.summary        = 'Fused device attitude (azimuth/altitude) for AR sky view'
  s.description    = 'Fused device attitude (azimuth/altitude) from OS-level sensor fusion for AR sky view'
  s.author         = 'Celeste'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end

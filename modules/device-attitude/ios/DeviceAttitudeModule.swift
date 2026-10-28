import AVFoundation
import CoreMotion
import ExpoModulesCore

private let EVENT_ATTITUDE_DID_UPDATE = "onAttitudeUpdate"
private let DEFAULT_UPDATE_INTERVAL_SECONDS = 1.0 / 60.0

// Koristi CMDeviceMotion (zirokop+akcelerometar+kompas, fuzionisano na nivou
// OS-a preko CMAttitudeReferenceFrameXTrueNorthZVertical) -- isti pristup koji
// koriste prave AR aplikacije za nebo (npr. Star Walk). Salje PUNU orijentaciju
// (rotacionu matricu), ne azimut/visinu: tek iz pune matrice JS moze ispravno
// pratiti nagib telefona u stranu i gledanje u zenit.
public final class DeviceAttitudeModule: Module {
  private lazy var motionManager = CMMotionManager()
  private lazy var operationQueue = OperationQueue()

  public func definition() -> ModuleDefinition {
    Name("DeviceAttitude")

    Events(EVENT_ATTITUDE_DID_UPDATE)

    AsyncFunction("isAvailableAsync") {
      motionManager.isDeviceMotionAvailable
    }

    AsyncFunction("setUpdateInterval") { (intervalMs: Double) in
      motionManager.deviceMotionUpdateInterval = intervalMs / 1000.0
    }

    // Vidno polje zadnje (glavne) kamere u portret orijentaciji.
    // videoFieldOfView je horizontalni FOV landscape senzora (duza strana) --
    // u portretu je to vertikala; kraca strana se racuna iz omjera formata.
    AsyncFunction("getCameraFovAsync") { () -> [String: Double]? in
      guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
        return nil
      }
      let format = device.activeFormat
      let dimensions = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
      let longFovDeg = Double(format.videoFieldOfView)
      let tanHalfShort = tan(longFovDeg * .pi / 360) * Double(dimensions.height) / Double(dimensions.width)
      return [
        "horizontalDeg": atan(tanHalfShort) * 360 / .pi,
        "verticalDeg": longFovDeg
      ]
    }

    OnStartObserving {
      startUpdates()
    }

    OnStopObserving {
      motionManager.stopDeviceMotionUpdates()
    }

    OnDestroy {
      motionManager.stopDeviceMotionUpdates()
    }
  }

  private func startUpdates() {
    guard motionManager.isDeviceMotionAvailable, !motionManager.isDeviceMotionActive else {
      return
    }
    if motionManager.deviceMotionUpdateInterval <= 0 {
      motionManager.deviceMotionUpdateInterval = DEFAULT_UPDATE_INTERVAL_SECONDS
    }
    motionManager.startDeviceMotionUpdates(using: .xTrueNorthZVertical, to: operationQueue) { [weak self] data, _ in
      guard let self, let data else { return }
      let m = data.attitude.rotationMatrix

      // VAZNO: redovi CMAttitude.rotationMatrix su ose uredjaja izrazene u
      // world okviru (X=sjever, Y=zapad, Z=gore) -- tj. to je TRANSPONOVANA
      // device->world matrica. Ovdje se pretvara u device->world u ENU okviru
      // (X=istok, Y=sjever, Z=gore), row-major -- isti format kao Android
      // getRotationMatrixFromVector. Istok = -zapad, otud minusi u prvom redu.
      // Ako se na uredjaju pokaze da je sjever/jug ili istok/zapad zamijenjen,
      // popravka je ovdje, ne u JS sloju.
      let matrix: [Double] = [
        -m.m12, -m.m22, -m.m32,
        m.m11, m.m21, m.m31,
        m.m13, m.m23, m.m33
      ]

      self.sendEvent(EVENT_ATTITUDE_DID_UPDATE, [
        "matrix": matrix,
        "timestamp": data.timestamp
      ])
    }
  }
}

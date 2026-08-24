import CoreMotion
import ExpoModulesCore

private let EVENT_ATTITUDE_DID_UPDATE = "onAttitudeUpdate"
private let DEFAULT_UPDATE_INTERVAL_SECONDS = 1.0 / 30.0

// Koristi CMDeviceMotion (zirokop+akcelerometar+kompas, fuzionisano na nivou
// OS-a preko CMAttitudeReferenceFrameXTrueNorthZVertical) umjesto rucnog
// EMA zaglađivanja nad odvojenim kompas/DeviceMotion ocitanjima -- ovo je isti
// pristup koji koriste prave AR aplikacije za nebo (npr. Star Walk).
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
      let r = data.attitude.rotationMatrix

      // VAZNO: CMAttitude.rotationMatrix je transponovana verzija matrice koja
      // preslikava device->world (Apple je vraca kao world->device -- potvrdjeno
      // iz vise nezavisnih izvora, vidi PR opis). Zato ovdje koristimo TRECI RED
      // (m31, m32, m33), ne trecu kolonu, da dobijemo pravac zadnje kamere
      // (device -Z osa, "iza ekrana") u world koordinatama, gdje je za
      // .xTrueNorthZVertical referentni okvir: X=sjever, Y=zapad, Z=gore.
      // Ako se na uredjaju pokaze da je sjever/jug ili istok/zapad zamijenjen,
      // popravka je zamjena predznaka/redova ovdje, ne u JS sloju.
      let north = -r.m31
      let east = r.m32
      let up = max(-1, min(1, -r.m33))

      let altitude = asin(up) * 180 / .pi
      var azimuth = atan2(east, north) * 180 / .pi
      if azimuth < 0 { azimuth += 360 }

      self.sendEvent(EVENT_ATTITUDE_DID_UPDATE, [
        "azimuth": azimuth,
        "altitude": altitude
      ])
    }
  }
}

package expo.modules.deviceattitude

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.asin
import kotlin.math.atan2

private const val EVENT_ATTITUDE_DID_UPDATE = "onAttitudeUpdate"
private const val DEFAULT_UPDATE_INTERVAL_US = 33_000 // ~30Hz

// Koristi TYPE_ROTATION_VECTOR (zirokop+akcelerometar+kompas, fuzionisano na
// nivou OS-a/senzorskog hardvera) umjesto rucnog EMA zaglađivanja nad
// odvojenim kompas/DeviceMotion ocitanjima -- ovo je isti pristup koji
// koriste prave AR aplikacije za nebo (npr. Star Walk).
class DeviceAttitudeModule : Module() {
  private val sensorManager: SensorManager?
    get() = appContext.reactContext?.getSystemService(Context.SENSOR_SERVICE) as? SensorManager

  private val rotationMatrix = FloatArray(9)
  private var intervalUs = DEFAULT_UPDATE_INTERVAL_US

  private val listener = object : SensorEventListener {
    override fun onSensorChanged(event: SensorEvent) {
      SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)

      // Android-ov getRotationMatrixFromVector vec direktno preslikava
      // device->world (world = R * device, world frame je X=istok, Y=sjever,
      // Z=gore) -- za razliku od iOS-a, ovdje NIJE potrebna transpozicija.
      // Kamera (zadnja strana telefona) gleda u device -Z pravcu.
      val east = -rotationMatrix[2]
      val north = -rotationMatrix[5]
      val up = (-rotationMatrix[8]).coerceIn(-1f, 1f)

      val altitude = Math.toDegrees(asin(up.toDouble()))
      var azimuth = Math.toDegrees(atan2(east.toDouble(), north.toDouble()))
      if (azimuth < 0) azimuth += 360

      sendEvent(EVENT_ATTITUDE_DID_UPDATE, mapOf("azimuth" to azimuth, "altitude" to altitude))
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
  }

  override fun definition() = ModuleDefinition {
    Name("DeviceAttitude")

    Events(EVENT_ATTITUDE_DID_UPDATE)

    AsyncFunction("isAvailableAsync") {
      sensorManager?.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR) != null
    }

    AsyncFunction("setUpdateInterval") { intervalMs: Double ->
      intervalUs = (intervalMs * 1000).toInt()
    }

    OnStartObserving {
      val sensor = sensorManager?.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR) ?: return@OnStartObserving
      sensorManager?.registerListener(listener, sensor, intervalUs)
    }

    OnStopObserving {
      sensorManager?.unregisterListener(listener)
    }

    OnDestroy {
      sensorManager?.unregisterListener(listener)
    }
  }
}

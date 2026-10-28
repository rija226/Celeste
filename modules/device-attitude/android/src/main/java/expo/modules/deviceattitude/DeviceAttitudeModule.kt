package expo.modules.deviceattitude

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.atan

private const val EVENT_ATTITUDE_DID_UPDATE = "onAttitudeUpdate"
private const val DEFAULT_UPDATE_INTERVAL_US = 16_666 // ~60Hz

// Koristi TYPE_ROTATION_VECTOR (zirokop+akcelerometar+kompas, fuzionisano na
// nivou OS-a/senzorskog hardvera) -- isti pristup koji koriste prave AR
// aplikacije za nebo (npr. Star Walk). Salje PUNU orijentaciju (rotacionu
// matricu), ne azimut/visinu: tek iz pune matrice JS moze ispravno pratiti
// nagib telefona u stranu i gledanje u zenit.
class DeviceAttitudeModule : Module() {
  private val sensorManager: SensorManager?
    get() = appContext.reactContext?.getSystemService(Context.SENSOR_SERVICE) as? SensorManager

  private val rotationMatrix = FloatArray(9)
  private var intervalUs = DEFAULT_UPDATE_INTERVAL_US

  private val listener = object : SensorEventListener {
    override fun onSensorChanged(event: SensorEvent) {
      // getRotationMatrixFromVector vec daje device->world (world = R * device),
      // world okvir X=istok, Y=sjever, Z=gore -- isti format koji salje i iOS.
      SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
      sendEvent(
        EVENT_ATTITUDE_DID_UPDATE,
        mapOf(
          "matrix" to rotationMatrix.map { it.toDouble() },
          "timestamp" to event.timestamp / 1e9,
        ),
      )
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
  }

  // Vidno polje zadnje (glavne) kamere u portret orijentaciji. Senzor kamere je
  // montiran polozeno (landscape), pa u portretu sirina ekrana odgovara KRACOJ
  // strani senzora.
  private fun backCameraFov(): Map<String, Double>? {
    val manager = appContext.reactContext?.getSystemService(Context.CAMERA_SERVICE) as? CameraManager ?: return null
    val id = manager.cameraIdList.firstOrNull {
      manager.getCameraCharacteristics(it).get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_BACK
    } ?: return null
    val characteristics = manager.getCameraCharacteristics(id)
    val focal = characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)?.firstOrNull() ?: return null
    val size = characteristics.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE) ?: return null
    return mapOf(
      "horizontalDeg" to Math.toDegrees(2 * atan(size.height / (2.0 * focal))),
      "verticalDeg" to Math.toDegrees(2 * atan(size.width / (2.0 * focal))),
    )
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

    AsyncFunction("getCameraFovAsync") {
      backCameraFov()
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

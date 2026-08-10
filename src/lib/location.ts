import * as Location from 'expo-location';

export type Coordinates = { latitude: number; longitude: number };

// Vraca null ako korisnik odbije dozvolu -- pozivalac (ekran) odlucuje kako
// to prikazati, ovaj modul ne baca gresku za ocekivano "korisnik je rekao ne".
export async function getCurrentCoordinates(): Promise<Coordinates | null> {
  const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
  const finalStatus =
    existingStatus === 'granted' ? existingStatus : (await Location.requestForegroundPermissionsAsync()).status;

  if (finalStatus !== 'granted') {
    return null;
  }

  const position = await Location.getCurrentPositionAsync({});
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

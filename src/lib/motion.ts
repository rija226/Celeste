import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Reanimated animacije treba skratiti/preskociti kad korisnik ima ukljucen
// reduced-motion u sistemskim podesavanjima (pristupacnost).
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduced)
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => subscription.remove();
  }, []);

  return reduced;
}

import { useState, useEffect, useRef, useCallback } from 'react';

const DOUBLE_TAP_THRESHOLD = 300; // ms

export const useInhaleInput = () => {
  const [isSucking, setIsSucking] = useState(false);
  const lastTapTime = useRef(0);

  const handleInteractionStart = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < DOUBLE_TAP_THRESHOLD) {
      setIsSucking(true);
    }
    lastTapTime.current = now;
  }, []);

  useEffect(() => {
    // Auto-stop sucking after a certain duration
    if (isSucking) {
      const timer = setTimeout(() => {
        setIsSucking(false);
      }, 1500); // Suck for 1.5 seconds
      return () => clearTimeout(timer);
    }
  }, [isSucking]);


  useEffect(() => {
    const handleDoubleClick = () => {
      setIsSucking(true);
    };

    window.addEventListener('dblclick', handleDoubleClick);
    window.addEventListener('touchstart', handleInteractionStart);

    return () => {
      window.removeEventListener('dblclick', handleDoubleClick);
      window.removeEventListener('touchstart', handleInteractionStart);
    };
  }, [handleInteractionStart]);

  return isSucking;
};

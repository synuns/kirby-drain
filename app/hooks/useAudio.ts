import { useCallback, useMemo } from 'react';

export const useAudio = (src: string, volume = 1) => {
  const audio = useMemo(() => {
    if (typeof window === 'undefined') {
      // Return a dummy object for SSR
      return null;
    }
    const a = new Audio(src);
    a.volume = volume;
    return a;
  }, [src, volume]);

  const play = useCallback(() => {
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [audio]);

  return play;
};

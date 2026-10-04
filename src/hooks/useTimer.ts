import { useState, useEffect } from 'react';

export interface TimerState {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  display: string; // e.g. "02:44:12"
}

// A plain function of the end time, outside the hook: the effect below then depends on exactly
// `endTime` and nothing it closes over, instead of on a closure rebuilt on every render.
const secondsLeft = (endTime: string) => Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));

export function useTimer(endTime: string): TimerState {
  const [totalSeconds, setTotalSeconds] = useState(() => secondsLeft(endTime));

  useEffect(() => {
    // The zero-delay tick re-syncs at once when `endTime` changes (the state above only read it at mount).
    const timeoutId = setTimeout(() => setTotalSeconds(secondsLeft(endTime)), 0);
    const intervalId = setInterval(() => setTotalSeconds(secondsLeft(endTime)), 1000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [endTime]);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const display = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return { hours, minutes, seconds, totalSeconds, isExpired: totalSeconds === 0, display };
}

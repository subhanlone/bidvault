import { useState, useEffect, useRef } from 'react';

export interface TimerState {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  display: string; // e.g. "02:44:12"
}

export function useTimer(endTime: string): TimerState {
  const calc = () => Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
  const [totalSeconds, setTotalSeconds] = useState(calc);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => setTotalSeconds(calc()), 0);
    ref.current = setInterval(() => setTotalSeconds(calc()), 1000);
    return () => {
      clearTimeout(timeoutId);
      if (ref.current) clearInterval(ref.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime]);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const display = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return { hours, minutes, seconds, totalSeconds, isExpired: totalSeconds === 0, display };
}

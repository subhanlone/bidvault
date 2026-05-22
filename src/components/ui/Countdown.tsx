interface CountdownProps {
  hours: number;
  minutes: number;
  seconds: number;
  variant?: 'normal' | 'final' | 'card';
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function Countdown({ hours, minutes, seconds, variant = 'normal' }: CountdownProps) {
  const isFinal = variant === 'final' || (hours === 0 && minutes === 0);

  if (variant === 'card') {
    return (
      <div className={`rounded-lg px-4 py-3 text-center ${isFinal ? 'bg-[#d0021b] animate-countdown-pulse' : 'bg-[#0b1f3a]'}`}>
        <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
          {isFinal ? 'Final Countdown' : 'Ends In'}
        </div>
        <div className="text-3xl font-bold text-white tracking-widest">
          {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </div>
        <div className="text-[11px] text-white/60 mt-0.5">seconds remaining</div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-bold
      ${isFinal ? 'bg-[#d0021b] text-white animate-countdown-pulse' : 'bg-[#0b1f3a]/80 text-white'}
    `}>
      {hours > 0 && <>{pad(hours)}<span className="opacity-60">:</span></>}
      {pad(minutes)}<span className="opacity-60">:</span>{pad(seconds)}
    </div>
  );
}

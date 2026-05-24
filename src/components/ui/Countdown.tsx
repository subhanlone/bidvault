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
  const isFinal = variant === 'final' || (hours === 0 && minutes < 5);
  const isWarningSoon = !isFinal && hours === 0 && minutes >= 5;
  const label = hours > 0 ? 'hrs remaining' : minutes > 0 ? 'min remaining' : 'sec remaining';

  if (variant === 'card') {
    const cardBg = isFinal
      ? 'bg-primary animate-countdown-pulse'
      : isWarningSoon
        ? 'bg-warning'
        : 'bg-navy';
    return (
      <div className={`rounded-lg px-4 py-3 text-center ${cardBg}`}>
        <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
          {isFinal ? 'Final Countdown' : 'Ends In'}
        </div>
        <div className="text-3xl font-bold text-white tracking-widest">
          {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </div>
        <div className="text-[11px] text-white/60 mt-0.5">{label}</div>
      </div>
    );
  }

  const inlineStyle = isFinal
    ? 'bg-primary text-white animate-countdown-pulse'
    : isWarningSoon
      ? 'bg-warning-bg text-warning border border-warning-border'
      : 'bg-navy/80 text-white';

  return (
    <div className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-bold ${inlineStyle}`}>
      {hours > 0 && <>{pad(hours)}<span className="opacity-60">:</span></>}
      {pad(minutes)}<span className="opacity-60">:</span>{pad(seconds)}
    </div>
  );
}

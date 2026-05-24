import BidVaultLogo from './BidVaultLogo';

interface AuthLayoutProps {
  headline: string;
  subtext?: string;
  bullets?: string[];
  stats?: { value: string; label: string }[];
  children: React.ReactNode;
}

export default function AuthLayout({ headline, subtext, bullets, stats, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[42%] auth-panel-gradient flex-col p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, #d0021b 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1f4e8c 0%, transparent 50%)'
        }} />
        <div className="relative z-10 flex flex-col h-full">
          <BidVaultLogo size="lg" to="/" />
          <div className="flex-1 flex flex-col justify-center mt-12">
            <h1 className="text-3xl font-bold text-white leading-tight mb-4">{headline}</h1>
            {subtext && <p className="text-white/60 text-sm leading-relaxed mb-8">{subtext}</p>}
            {bullets && (
              <ul className="space-y-3">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {stats && (
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
              {stats.map((s, i) => (
                <div key={i}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      {/* TODO: Add preconnect for Google Fonts in index.html for performance. */}
      <main className="flex-1 bg-surface flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-[480px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

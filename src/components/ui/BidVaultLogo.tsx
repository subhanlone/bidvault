import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  color?: 'light' | 'dark';
}

const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' };
const iconSizes = { sm: 'w-6 h-6', md: 'w-7 h-7', lg: 'w-8 h-8' };

export default function BidVaultLogo({ size = 'md', to = '/', color = 'light' }: LogoProps) {
  const bidTextColor = color === 'dark' ? 'text-navy' : 'text-white';
  const content = (
    <div className="flex items-center gap-2">
      <div className={`${iconSizes[size]} bg-primary rounded-lg flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
          <path d="M5 17L12 5l7 12H5z" fill="white" />
        </svg>
      </div>
      <span className={`font-bold ${sizes[size]} ${bidTextColor}`}>
        Bid<span className="text-primary">Vault</span>
      </span>
    </div>
  );

  return to ? (
    <Link to={to} aria-label="BidVault — Home" className="no-underline hover:opacity-90 transition-opacity">
      {content}
    </Link>
  ) : (
    <div aria-label="BidVault">{content}</div>
  );
}

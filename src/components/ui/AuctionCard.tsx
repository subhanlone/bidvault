import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';
import Countdown from './Countdown';

interface AuctionCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  currentPrice: number;
  bidCount: number;
  watchers?: number;
  category: string;
  condition: 'New' | 'Like New' | 'Used';
  endsAt: Date;
  to?: string;
}

function formatPrice(n: number) {
  return `PKR ${n.toLocaleString()}`;
}

function getTimeLeft(endsAt: Date) {
  const diff = Math.max(0, endsAt.getTime() - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s };
}

export default function AuctionCard({ id, title, imageUrl, currentPrice, bidCount, watchers, category, condition, endsAt, to }: AuctionCardProps) {
  const { h, m, s } = getTimeLeft(endsAt);
  const linkTo = to || `/buyer/auction/${id}`;

  return (
    <div className="bg-surface rounded-md border border-border shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-200">
      <div className="relative h-48 bg-surface-raised">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-placeholder text-sm">No image</div>
        )}
        <div className="absolute top-2 left-2">
          <Countdown hours={h} minutes={m} seconds={s} />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex gap-1.5 flex-wrap">
          <Badge variant="tag">{category}</Badge>
          <Badge variant={condition === 'New' ? 'success' : 'tag'}>{condition}</Badge>
        </div>
        <h3 className="text-sm font-semibold text-navy line-clamp-2 leading-snug">{title}</h3>
        <div className="flex items-center justify-between mt-auto pt-1">
          <div>
            <p className="text-[11px] text-muted">Current Bid</p>
            <p className="text-base font-bold text-primary">{formatPrice(currentPrice)}</p>
          </div>
          <div className="flex items-center gap-1 text-muted text-xs">
            <Users size={12} />
            {bidCount} bids
            {watchers != null && <span className="ml-1">· {watchers} watching</span>}
          </div>
        </div>
        <Link to={linkTo} className="no-underline mt-1">
          <Button variant="primary" fullWidth size="sm">Bid Now</Button>
        </Link>
      </div>
    </div>
  );
}

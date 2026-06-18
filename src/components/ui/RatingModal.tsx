import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { api } from '../../services/api';
import Button from './Button';
import Textarea from './Textarea';

interface Props {
  transactionId: string;
  sellerName: string;
  auctionTitle: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function RatingModal({ transactionId, sellerName, auctionTitle, onSuccess, onClose }: Props) {
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars === 0) {
      setError('Please select a star rating.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/reviews', { transactionId, stars, comment: comment.trim() || undefined });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not submit your review.');
    } finally {
      setLoading(false);
    }
  }

  const displayStars = hoverStars || stars;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-[440px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-[16px] text-navy">Rate {sellerName}</h2>
          <button
            onClick={onClose}
            aria-label="Close rating modal"
            className="text-muted hover:text-navy transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <p className="text-[13px] text-muted mb-1">For your purchase of</p>
            <p className="font-bold text-[14px] text-navy">{auctionTitle}</p>
          </div>

          <div className="flex items-center justify-center gap-1" role="radiogroup" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={stars === n}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                onClick={() => setStars(n)}
                onMouseEnter={() => setHoverStars(n)}
                onMouseLeave={() => setHoverStars(0)}
                className="cursor-pointer p-1"
              >
                <Star
                  size={28}
                  className={displayStars >= n ? 'text-gold' : 'text-border-medium'}
                  fill={displayStars >= n ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>

          <Textarea
            label="Comment (optional)"
            placeholder="How was your experience with this seller?"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
          />

          {error && (
            <p className="text-[13px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>
          )}

          <Button type="submit" loading={loading} disabled={stars === 0} className="w-full">
            Submit Review
          </Button>
        </form>
      </div>
    </div>
  );
}

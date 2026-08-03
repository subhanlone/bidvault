import { useState } from 'react';
import { Package } from 'lucide-react';

interface AuctionThumbnailProps {
  src?: string | null;
  alt: string;
  className?: string;
  iconSize?: number;
}

// Shared missing/broken-image handling for auction thumbnails. Several buyer screens
// used to render a bare <img> with no fallback (broken-image icon) or an onError that
// just hid the image (blank box) — this gives every screen the same placeholder.
export default function AuctionThumbnail({ src, alt, className = 'w-full h-full object-cover', iconSize = 22 }: AuctionThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Package size={iconSize} strokeWidth={1.5} className="text-placeholder" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

import { Star } from 'lucide-react';

interface RatingStarsProps {
  /** Average rating, 0–5. */
  value: number;
  /** Number of ratings, shown in parentheses when > 0. */
  count?: number;
  /** Hide the numeric label, show stars only. */
  compact?: boolean;
}

/**
 * Renders a 0–5 star rating with half-star precision plus an optional numeric
 * label. Used on Discover cards so a numeric rating reads at a glance.
 */
export function RatingStars({ value, count, compact = false }: RatingStarsProps) {
  const rounded = Math.round(value * 2) / 2; // nearest half
  return (
    <span className="disc__stars" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rounded >= i;
        const half = !filled && rounded >= i - 0.5;
        return (
          <Star
            key={i}
            className={filled || half ? 'text-amber-400' : 'text-gray-300'}
            fill={filled ? 'currentColor' : half ? 'url(#half)' : 'none'}
            strokeWidth={1.5}
          />
        );
      })}
      {!compact && (
        <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 4 }}>
          {value > 0 ? value.toFixed(1) : 'New'}
          {count && count > 0 ? <span style={{ color: '#667085', fontWeight: 400 }}> ({count})</span> : null}
        </span>
      )}
    </span>
  );
}

import { useReducedMotion } from '../lib/motion';

interface SkeletonProps {
  className?: string;
  /** Inline style overrides (width/height/borderRadius). */
  style?: React.CSSProperties;
  rounded?: boolean | string;
}

/**
 * A single shimmering placeholder block. Respects prefers-reduced-motion
 * (renders a static muted block instead of the shimmer sweep).
 */
export function Skeleton({ className = '', style, rounded = '8px' }: SkeletonProps) {
  const reduce = useReducedMotion();
  const radius = rounded === true ? '9999px' : rounded === false ? '0' : rounded;
  return (
    <span
      aria-hidden
      className={`dx-skeleton ${reduce ? 'dx-skeleton--static' : ''} ${className}`}
      style={{ borderRadius: radius, ...style }}
    />
  );
}

/** A skeleton placeholder list for the matches/conversations view. */
export function MatchListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bx__wrap">
      <div style={{ marginBottom: 16 }}>
        <Skeleton style={{ width: 90, height: 14 }} />
      </div>
      <div className="bx__list">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
            <Skeleton style={{ width: 44, height: 44, flexShrink: 0 }} rounded />
            <div className="bx__lr-main">
              <Skeleton style={{ width: '55%', height: 14 }} />
              <div style={{ marginTop: 6 }}><Skeleton style={{ width: '80%', height: 12 }} /></div>
            </div>
            <Skeleton style={{ width: 36, height: 12 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

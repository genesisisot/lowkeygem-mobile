import { motion } from 'motion/react';

interface SimpleLoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export function SimpleLoader({ message = 'Loading...', size = 'medium' }: SimpleLoaderProps) {
  const sizes = {
    small: { gem: 40 },
    medium: { gem: 60 },
    large: { gem: 80 }
  };

  const { gem } = sizes[size];

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated Gem */}
      <motion.svg
        width={gem}
        height={gem}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <path
          d="M20 2L28 12H12L20 2Z"
          fill="url(#simpleGemGradient1)"
          stroke="#d64c7a"
          strokeWidth="1.5"
          strokeLinejoin="bevel"
        />
        <path
          d="M12 12L6 16L20 38L34 16L28 12H12Z"
          fill="url(#simpleGemGradient2)"
          stroke="#d64c7a"
          strokeWidth="1.5"
          strokeLinejoin="bevel"
        />
        <path d="M20 12V38" stroke="#b5295e" strokeWidth="1" opacity="0.6" />
        <path d="M12 12L20 38L28 12" stroke="#b5295e" strokeWidth="1" opacity="0.4" />
        <path d="M6 16L20 12L34 16" stroke="#d64c7a" strokeWidth="1" opacity="0.5" />

        <motion.circle
          cx="16"
          cy="8"
          r="1.5"
          fill="white"
          animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
        />
        <motion.circle
          cx="24"
          cy="20"
          r="1"
          fill="white"
          animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5, delay: 0.5 }}
        />

        <defs>
          <linearGradient id="simpleGemGradient1" x1="20" y1="2" x2="20" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff7aa2" />
            <stop offset="100%" stopColor="#d64c7a" />
          </linearGradient>
          <linearGradient id="simpleGemGradient2" x1="20" y1="12" x2="20" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d64c7a" />
            <stop offset="50%" stopColor="var(--bx-accent)" />
            <stop offset="100%" stopColor="#5a0330" />
          </linearGradient>
        </defs>
      </motion.svg>

      <motion.p
        style={{ marginTop: 16, color: 'var(--bx-accent)', fontSize: 16, fontWeight: 500 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {message}
      </motion.p>

      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bx-accent)' }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

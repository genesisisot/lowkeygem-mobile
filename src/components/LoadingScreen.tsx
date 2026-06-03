import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(onComplete, 800);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 3 + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="h-screen overflow-hidden fixed w-full left-0 top-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a0a12] to-[#0a0a0a] min-h-[stretch] z-[100]"
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 accent-bg rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Radial glow behind gem */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(var(--bx-accent-rgb),0.3) 0%, rgba(var(--bx-accent-rgb),0.1) 40%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-[102]">
        {/* Animated Gem Logo */}
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Outer rotating ring */}
          <motion.div
            className="absolute -inset-8 border-2 border-[var(--bx-accent)]/30 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner rotating ring (opposite direction) */}
          <motion.div
            className="absolute -inset-4 border border-[#d64c7a]/20 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />

          {/* The Gem SVG */}
          <motion.svg
            width={120}
            height={120}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{
              y: [0, -10, 0],
              filter: [
                'drop-shadow(0 0 20px rgba(151,7,71,0.5))',
                'drop-shadow(0 0 40px rgba(151,7,71,0.8))',
                'drop-shadow(0 0 20px rgba(151,7,71,0.5))',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Outer gem shape */}
            <motion.path
              d="M20 2L28 12H12L20 2Z"
              fill="url(#loadingGemGradient1)"
              stroke="#d64c7a"
              strokeWidth="1.5"
              strokeLinejoin="bevel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            />
            <motion.path
              d="M12 12L6 16L20 38L34 16L28 12H12Z"
              fill="url(#loadingGemGradient2)"
              stroke="#d64c7a"
              strokeWidth="1.5"
              strokeLinejoin="bevel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />
            {/* Inner facets */}
            <path
              d="M20 12V38"
              stroke="#b5295e"
              strokeWidth="1"
              opacity="0.6"
            />
            <path
              d="M12 12L20 38L28 12"
              stroke="#b5295e"
              strokeWidth="1"
              opacity="0.4"
            />
            <path
              d="M6 16L20 12L34 16"
              stroke="#d64c7a"
              strokeWidth="1"
              opacity="0.5"
            />

            {/* Animated sparkles */}
            <motion.circle
              cx="16"
              cy="8"
              r="2"
              fill="white"
              animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
            />
            <motion.circle
              cx="26"
              cy="20"
              r="1.5"
              fill="white"
              animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5, delay: 0.3 }}
            />
            <motion.circle
              cx="14"
              cy="24"
              r="1.5"
              fill="white"
              animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5, delay: 0.6 }}
            />
            <motion.circle
              cx="20"
              cy="5"
              r="1"
              fill="white"
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8, delay: 0.9 }}
            />

            {/* Gradients */}
            <defs>
              <linearGradient id="loadingGemGradient1" x1="20" y1="2" x2="20" y2="12" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ff7aa2" />
                <stop offset="100%" stopColor="#d64c7a" />
              </linearGradient>
              <linearGradient id="loadingGemGradient2" x1="20" y1="12" x2="20" y2="38" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#d64c7a" />
                <stop offset="50%" stopColor="var(--bx-accent)" />
                <stop offset="100%" stopColor="#5a0330" />
              </linearGradient>
            </defs>
          </motion.svg>
        </motion.div>

        {/* Loading text */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h2 className="accent-text text-2xl font-bold tracking-wide mb-2">
            Lowkey Gem
          </h2>
          <motion.p
            className="text-[#d64c7a] text-sm tracking-widest uppercase"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Discovering talent...
          </motion.p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="mt-10 w-64"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--bx-accent)] via-[#d64c7a] to-[var(--bx-accent)] rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
            {/* Shimmer effect on progress bar */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[var(--bx-accent)]/60 text-xs">Loading</span>
            <span className="accent-text text-xs font-mono">{Math.min(Math.round(progress), 100)}%</span>
          </div>
        </motion.div>
      </div>

      {/* Corner decorations */}
      <motion.div
        className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-[var(--bx-accent)]/30"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      />
      <motion.div
        className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-[var(--bx-accent)]/30"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      />
      <motion.div
        className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-[var(--bx-accent)]/30"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      />
      <motion.div
        className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-[var(--bx-accent)]/30"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      />
    </motion.div>
  );
}

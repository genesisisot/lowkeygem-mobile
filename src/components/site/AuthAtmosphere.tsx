import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Logo } from '../Logo';

/** Lightweight animated gradient background for auth screens (no WebGL). */
export function AuthAtmosphere() {
  return (
    <div className="auth__atmos" aria-hidden>
      <div className="auth__orb auth__orb--1" />
      <div className="auth__orb auth__orb--2" />
      <div className="auth__orb auth__orb--3" />
    </div>
  );
}

const PROOF = [
  'Randomized discovery — no ranking bias',
  'Escrow-protected payments, released on approval',
  'KYC-verified people on both sides',
  'Tinder-style matching, real conversations',
];

/** The left-hand brand panel shown on desktop auth layouts. */
export function AuthBrandPanel({ title }: { title: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % PROOF.length), 2800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="auth__brand">
      <div className="auth__brand-head">
        <Logo textColor="text-white" />
      </div>
      <div className="auth__brand-mid">
        <span className="lk__eyebrow">Nigeria’s fair marketplace</span>
        <h1 className="auth__brand-title" style={{ marginTop: 18 }}>
          {title.split(' ').map((w, idx) => (
            <span key={idx}>{w} </span>
          ))}
        </h1>
        <div className="auth__rotator">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              className="auth__rotator-item"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="dot" />
              {PROOF[i]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="auth__brand-foot">
        <span>Equal discovery</span>
        <span>Escrow</span>
        <span>KYC verified</span>
      </div>
    </div>
  );
}

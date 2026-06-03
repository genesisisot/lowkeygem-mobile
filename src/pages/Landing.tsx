import { Suspense, lazy, useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  Scale,
  Shuffle,
  Sparkles,
  Gem,
  ArrowUpRight,
  Menu,
  X,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { SmoothScroll } from '../components/site/SmoothScroll';
import {
  ScrollProgress,
  Cursor,
  RevealText,
  FadeIn,
  MagneticButton,
  TiltCard,
  Parallax,
  Marquee,
  useScrolled,
} from '../components/site/primitives';
import '../styles/landing.css';

import { FairMatchDemo } from '../components/site/FairMatchDemo';
import { DeferMount } from '../components/site/DeferMount';

const Hero3D = lazy(() => import('../components/site/Hero3D'));
const HowItWorks3D = lazy(() => import('../components/site/HowItWorks3D'));
const HiddenGemGame = lazy(() => import('../components/site/HiddenGemGame'));

const NAV = [
  { label: 'How it works', href: '#how' },
  { label: 'Why fair', href: '#why' },
  { label: 'Trust', href: '#trust' },
];

const STEPS = [
  { n: '01', t: 'Create your profile', d: 'Freelancers post skill profiles; clients post jobs. Verified once, surfaced fairly forever.' },
  { n: '02', t: 'Randomized discovery', d: 'No ranking auctions. No pay-to-win. Talent is shuffled so every profile gets a real shot.' },
  { n: '03', t: 'Swipe to connect', d: 'Tinder-style matching. When both sides say yes, a private channel opens instantly.' },
  { n: '04', t: 'Escrow & deliver', d: 'Funds held in escrow, released on approval. Disputes mediated by real humans.' },
];

const FEATURES = [
  { icon: Scale, t: 'Equal visibility', d: 'Algorithms bury talent. We refuse to. Discovery is randomized so newcomers and veterans share the same stage.', glow: 'rgba(255,29,104,0.5)' },
  { icon: Shuffle, t: 'Tinder-style matching', d: 'Browsing is a deck, not a leaderboard. Swipe, match, and start a conversation — no cold proposals.', glow: 'rgba(124,58,237,0.5)' },
  { icon: Gem, t: 'Hidden gems celebrated', d: 'Skill-matched feeds put the right work in front of the right people, regardless of follower counts.', glow: 'rgba(65,224,208,0.45)' },
  { icon: Lock, t: 'Secure escrow', d: 'Every contract is funded up front and held safe until the work is approved. Money you can trust.', glow: 'rgba(255,29,104,0.5)' },
];

const TRUST = [
  { icon: ShieldCheck, t: 'KYC verified', d: 'Government ID + selfie checks on every account, reviewed by our team before anyone transacts.' },
  { icon: Lock, t: 'Escrow protected', d: "Funds sit in escrow, not someone's pocket. Released only when both sides are satisfied." },
  { icon: Scale, t: 'Human dispute resolution', d: 'Real mediators review evidence and resolve conflicts fairly — release, refund, or split.' },
];

function CanvasFallback() {
  return <div className="lk__hero-fallback" />;
}

export function Landing() {
  const scrolled = useScrolled(40);
  const reduce = useReducedMotion();
  const [allow3D, setAllow3D] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Re-evaluate whether to run the WebGL scenes on mount AND on resize/rotate,
  // so switching between portrait/landscape or resizing a window upgrades or
  // downgrades to the lightweight fallbacks correctly.
  useEffect(() => {
    const compute = () => {
      // 3D runs on mobile too — only disabled for users who ask for reduced
      // motion or on very low-core devices (where it would jank badly).
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const lowCore = (navigator.hardwareConcurrency || 4) < 4;
      setAllow3D(!prefersReduced && !lowCore);
    };
    compute();
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(compute, 200);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="lk">
      <div className="lk__grain" />
      <ScrollProgress />
      {!reduce && <Cursor />}

      {/* NAV */}
      <nav className={`lk__nav${scrolled ? ' lk__nav--scrolled' : ''}`}>
        <a href="/" aria-label="Home" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo textColor="text-white" />
        </a>
        <div className="lk__navlinks">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="lk__navlink">{n.label}</a>
          ))}
        </div>
        <div className="lk__navauth">
          <MagneticButton href="/login" className="lk__btn lk__btn--ghost" strength={0.25}>
            Log in
          </MagneticButton>
          <MagneticButton href="/signup" className="lk__btn lk__btn--primary" strength={0.25}>
            Get started <ArrowUpRight size={16} />
          </MagneticButton>
        </div>
        <button
          className="lk__navtoggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`lk__navmenu${menuOpen ? ' is-open' : ''}`} aria-hidden={!menuOpen}>
        {NAV.map((n) => (
          <a key={n.href} href={n.href} className="lk__navmenu-link" onClick={() => setMenuOpen(false)}>
            {n.label}
          </a>
        ))}
        <a href="/login" className="lk__btn lk__btn--ghost" onClick={() => setMenuOpen(false)}>
          Log in
        </a>
        <a href="/signup" className="lk__btn lk__btn--primary" onClick={() => setMenuOpen(false)}>
          Get started <ArrowUpRight size={16} />
        </a>
      </div>

      <SmoothScroll>
        {/* HERO */}
        <header className="lk__hero">
          {allow3D ? (
            <Suspense fallback={<CanvasFallback />}>
              <Hero3D />
            </Suspense>
          ) : (
            <CanvasFallback />
          )}

          <div className="lk__hero-inner">
            <FadeIn>
              <span className="lk__eyebrow">Nigeria's first fair marketplace</span>
            </FadeIn>
            <h1 className="lk__display" style={{ marginTop: 22 }}>
              <RevealText as="span" delay={0.05}>Talent shouldn't be</RevealText>
              <RevealText as="span" delay={0.15}>buried by</RevealText>
              <RevealText as="span" delay={0.25}><span className="lk__gradient">algorithms.</span></RevealText>
            </h1>
            <FadeIn delay={0.4}>
              <p className="lk__hero-sub">
                A freelancer marketplace built for equal discovery. No ranking bias, no
                pay-to-win — just pure talent, fairly showcased through randomized browsing
                and Tinder-style matching.
              </p>
            </FadeIn>
            <FadeIn delay={0.5}>
              <div className="lk__hero-cta">
                <MagneticButton href="/signup" className="lk__btn lk__btn--primary">
                  Hire a freelancer <ArrowUpRight size={16} />
                </MagneticButton>
                <MagneticButton href="/signup" className="lk__btn lk__btn--ghost">
                  Become a freelancer
                </MagneticButton>
              </div>
            </FadeIn>
          </div>

          <div className="lk__hero-meta">
            <FadeIn delay={0.6}>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--paper)', fontSize: 26 }}>5.0★</strong>
                <br />Rated by early builders across Lagos, Abuja & Port Harcourt.
              </div>
            </FadeIn>
          </div>

          <div className="lk__scrollcue">
            Scroll
            <span />
          </div>
        </header>

        {/* MARQUEE */}
        <Marquee items={['Equal discovery', 'Escrow protected', 'KYC verified', 'No pay-to-win', 'Hidden gems', 'Fairly ranked']} />

        {/* HOW IT WORKS — scroll-driven 3D sequence (static fallback when 3D off) */}
        {allow3D ? (
          <DeferMount minHeight="100vh">
            <Suspense
              fallback={
                <section id="how" className="lk__section">
                  <div className="lk__wrap" style={{ minHeight: '40vh' }} />
                </section>
              }
            >
              <HowItWorks3D steps={STEPS} />
            </Suspense>
          </DeferMount>
        ) : (
          <section id="how" className="lk__section">
            <div className="lk__wrap">
              <span className="lk__eyebrow">How it works</span>
              <h2 className="lk__heading" style={{ marginTop: 18 }}>
                <RevealText as="span">Four steps from</RevealText>
                <RevealText as="span" delay={0.08}>stranger to shipped.</RevealText>
              </h2>
              <div className="lk__steps">
                {STEPS.map((s, i) => (
                  <FadeIn key={s.n} delay={i * 0.08}>
                    <div className="lk__step">
                      <span className="lk__step-num">{s.n}</span>
                      <div>
                        <h3>{s.t}</h3>
                        <p>{s.d}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TRY IT — Fair Match swipe demo (light DOM, works on touch) */}
        <FairMatchDemo />

        {/* WHY FAIR — tilt cards */}
        <section id="why" className="lk__section" style={{ paddingTop: 0 }}>
          <div className="lk__wrap">
            <Parallax amount={40}>
              <span className="lk__eyebrow">Why we're different</span>
              <h2 className="lk__heading" style={{ marginTop: 18 }}>
                Built so the best work wins — not the biggest budget.
              </h2>
            </Parallax>
            <div className="lk__cards">
              {FEATURES.map((f, i) => (
                <FadeIn key={f.t} delay={i * 0.06}>
                  <TiltCard className="lk__card" glow={f.glow}>
                    <span className="lk__card-icon"><f.icon size={24} /></span>
                    <h3>{f.t}</h3>
                    <p>{f.d}</p>
                  </TiltCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* PLAY — Find the hidden gem (3D only; teaser fallback otherwise) */}
        {allow3D ? (
          <DeferMount minHeight="80vh">
            <Suspense
              fallback={
                <section className="lk__section" style={{ paddingTop: 0 }}>
                  <div className="lk__wrap" style={{ minHeight: '40vh' }} />
                </section>
              }
            >
              <HiddenGemGame />
            </Suspense>
          </DeferMount>
        ) : (
          <section className="lk__section" style={{ paddingTop: 0 }}>
            <div className="lk__wrap">
              <span className="lk__eyebrow">Play · Find the hidden gem</span>
              <h2 className="lk__heading" style={{ marginTop: 18 }}>
                Most platforms bury talent. We surface it.
              </h2>
              <p className="lk__lead">
                Open the site on a larger screen to play the hidden-gem game — or just sign up
                and start getting discovered fairly.
              </p>
            </div>
          </section>
        )}

        {/* TRUST */}
        <section id="trust" className="lk__section" style={{ paddingTop: 0 }}>
          <div className="lk__wrap">
            <span className="lk__eyebrow">Trust &amp; safety</span>
            <h2 className="lk__heading" style={{ marginTop: 18 }}>Money and identity, handled with care.</h2>
            <div className="lk__trust">
              {TRUST.map((t, i) => (
                <FadeIn key={t.t} delay={i * 0.08}>
                  <div className="lk__trust-item">
                    <h4><t.icon size={18} color="var(--magenta)" /> {t.t}</h4>
                    <p>{t.d}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="lk__section" style={{ paddingTop: 0 }}>
          <div className="lk__wrap">
            <div className="lk__cta">
              <FadeIn>
                <span className="lk__eyebrow" style={{ justifyContent: 'center' }}>
                  <Sparkles size={14} /> Ready when you are
                </span>
              </FadeIn>
              <h2 className="lk__heading" style={{ margin: '20px auto 0', maxWidth: 900 }}>
                Your next match is one swipe away.
              </h2>
              <FadeIn delay={0.15}>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 34, flexWrap: 'wrap' }}>
                  <MagneticButton href="/signup" className="lk__btn lk__btn--primary">
                    Create your account <ArrowUpRight size={16} />
                  </MagneticButton>
                  <MagneticButton href="/login" className="lk__btn lk__btn--ghost">
                    I already have one
                  </MagneticButton>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lk__footer">
          <div className="lk__wrap">
            <div className="lk__footer-grid">
              <div>
                <Parallax amount={24}>
                  <div className="lk__footer-big lk__gradient">Fairly.</div>
                </Parallax>
                <p style={{ color: 'var(--muted)', maxWidth: 320, marginTop: 16, fontSize: 14, lineHeight: 1.6 }}>
                  The marketplace where talent is discovered, not ranked. Made in Nigeria.
                </p>
              </div>
              <div className="lk__footer-cols">
                <div className="lk__footer-col">
                  <h5>Product</h5>
                  <a href="/signup">Become a freelancer</a>
                  <a href="/signup">Hire talent</a>
                  <a href="#how">How it works</a>
                </div>
                <div className="lk__footer-col">
                  <h5>Company</h5>
                  <a href="#why">Why fair</a>
                  <a href="#trust">Trust &amp; safety</a>
                  <a href="/login">Log in</a>
                </div>
              </div>
            </div>
            <div className="lk__footer-base">
              <span>© {new Date().getFullYear()} Fairly. All rights reserved.</span>
              <span>Equal discovery · Escrow protected · KYC verified</span>
            </div>
          </div>
        </footer>
      </SmoothScroll>
    </div>
  );
}

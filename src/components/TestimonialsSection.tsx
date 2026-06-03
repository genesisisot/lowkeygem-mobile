import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FadeInSection } from './FadeInSection';
import { statsService } from '../services/stats';

// Marketing fallback shown while loading or if the stats endpoint is unreachable,
// so the landing page never renders blank.
const FALLBACK_STATS = [
  { number: '5,000+', label: 'Verified Freelancers' },
  { number: '1,200+', label: 'Projects Completed' },
  { number: '4.9', label: 'Average Rating' },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [stats, setStats] = useState(FALLBACK_STATS);

  useEffect(() => {
    let cancelled = false;
    statsService.getPublic().then(({ data, error }) => {
      if (cancelled || error || !data) return;
      setStats([
        { number: `${data.freelancers.toLocaleString()}+`, label: 'Verified Freelancers' },
        { number: `${data.projects_completed.toLocaleString()}+`, label: 'Projects Completed' },
        { number: data.avg_rating > 0 ? data.avg_rating.toFixed(1) : 'New', label: 'Average Rating' },
      ]);
    });
    return () => { cancelled = true; };
  }, []);

  const testimonials = [
    {
      quote: "Finally, a platform where my work speaks louder than my follower count. I got my first client within a week!",
      author: "Chidinma Okafor",
      role: "Graphic Designer",
      company: "Lagos, Nigeria"
    },
    {
      quote: "The randomized discovery is genius. I found an amazing developer who would've been buried on other platforms.",
      author: "Michael Adebayo",
      role: "Startup Founder",
      company: "Abuja, Nigeria"
    },
    {
      quote: "No more competing with fake reviews and inflated portfolios. This platform celebrates real talent and transparency.",
      author: "Blessing Nnamdi",
      role: "Content Writer",
      company: "Port Harcourt, Nigeria"
    }
  ];

  return (
    <section className="bg-black text-white py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-16" id="freelancers">
      <div className="max-w-[1200px] mx-auto">
        <FadeInSection direction="up">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-12 sm:w-20 lg:w-[100px] h-[0.5px] bg-white/20"></div>
              <span className="text-[10px] sm:text-[12px] lg:text-[14px] uppercase tracking-tight text-gray-400" style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}>
                Testimonials
              </span>
              <div className="w-12 sm:w-20 lg:w-[100px] h-[0.5px] bg-white/20"></div>
            </div>
            <h2 className="text-[36px] sm:text-[48px] lg:text-[60px] leading-tight tracking-tight font-bold">
              What Clients Say
            </h2>
          </div>
        </FadeInSection>

        <div className="relative min-h-[300px] sm:min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-8 sm:mb-12">
                <p className="text-[20px] sm:text-[28px] lg:text-[32px] leading-snug sm:leading-[44px] mb-6 sm:mb-8 max-w-[900px] mx-auto px-4" style={{ fontFamily: 'rinter, "rinter Fallback"' }}>
                  "{testimonials[activeIndex].quote}"
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                  <div className="text-[16px] sm:text-[18px] font-medium">{testimonials[activeIndex].author}</div>
                  <div className="hidden sm:block w-[4px] h-[4px] bg-white/40 rounded-full"></div>
                  <div className="text-[12px] sm:text-[14px] text-gray-400">{testimonials[activeIndex].role}</div>
                </div>
                <div className="text-[12px] sm:text-[14px] text-gray-500 mt-1 sm:mt-2">{testimonials[activeIndex].company}</div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-2 sm:gap-3 mt-8 sm:mt-12">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                  index === activeIndex ? 'bg-white w-6 sm:w-8' : 'bg-white/30'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <FadeInSection delay={0.4}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 mt-16 sm:mt-24 lg:mt-32 pt-12 sm:pt-16 lg:pt-20 border-t border-white/10">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              >
                <div className="text-[48px] sm:text-[56px] lg:text-[64px] font-bold leading-tight mb-3 sm:mb-4" style={{ color: 'var(--bx-accent)' }}>
                  {stat.number}
                </div>
                <div className="text-[12px] sm:text-[14px] uppercase tracking-tight text-gray-400" style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}
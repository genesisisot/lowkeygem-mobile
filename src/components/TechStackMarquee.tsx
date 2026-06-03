import React from 'react';
import { motion } from 'motion/react';

export function TechStackMarquee() {
  const technologies = [
    'React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Figma', 'Webflow',
    'Node.js', 'GraphQL', 'Motion', 'Vercel', 'Supabase', 'Stripe'
  ];

  return (
    <section className="py-8 overflow-hidden" style={{ background: "linear-gradient(to right, #2563eb, var(--bx-accent))" }}>
      <div className="flex">
        <motion.div
          className="flex gap-16 whitespace-nowrap"
          animate={{ x: [0, -1920] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {/* Duplicate the array for seamless loop */}
          {[...technologies, ...technologies, ...technologies].map((tech, index) => (
            <div
              key={index}
              className="text-white text-[24px] uppercase tracking-[-0.72px]"
              style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}
            >
              {tech}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
import React from 'react';
import { motion } from 'motion/react';
import { FadeInSection } from './FadeInSection';

export function CasesSection() {
  const cases = [
    {
      title: "Equal Visibility for All",
      category: "Fair Discovery",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=640&h=480&fit=crop&q=80",
      tags: ["Randomized", "No Bias", "Fresh Talent"]
    },
    {
      title: "Tinder-Style Matching",
      category: "Innovation",
      image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=640&h=480&fit=crop&q=80",
      tags: ["Swipe", "Quick", "Intuitive"]
    },
    {
      title: "Hidden Gems Celebrated",
      category: "Transparency",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=640&h=480&fit=crop&q=80",
      tags: ["Underrated", "Skilled", "Undiscovered"]
    },
    {
      title: "Secure Escrow Protection",
      category: "Trust",
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=640&h=480&fit=crop&q=80",
      tags: ["Safe", "Protected", "Verified"]
    }
  ];

  return (
    <section className="bg-gray-50 py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-16" id="why-platform">
      <div className="max-w-[1500px] mx-auto">
        <FadeInSection direction="up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 sm:mb-16 gap-6">
            <div>
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-12 sm:w-20 lg:w-[100px] h-[0.5px] bg-black/20"></div>
                <span className="text-[10px] sm:text-[12px] lg:text-[14px] uppercase tracking-tight text-gray-500" style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}>
                  Our Difference
                </span>
              </div>
              <h2 className="text-[36px] sm:text-[48px] lg:text-[60px] leading-tight tracking-tight text-black font-bold">
                Why This Platform
              </h2>
            </div>
            <motion.a
              href="#features"
              className="text-[12px] sm:text-[14px] uppercase tracking-tight flex items-center gap-2 hover:gap-4 transition-all text-black"
              style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}
              whileHover={{ x: 5 }}
            >
              Learn More
              <img src="https://cdn-icons.flaticon.com/512/2921/2921222.svg" className="w-4 h-4 sm:w-5 sm:h-5" alt="" />
            </motion.a>
          </div>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {cases.map((caseItem, index) => (
            <FadeInSection key={caseItem.title} delay={0.2 + index * 0.1} direction="up">
              <motion.div
                className="group cursor-pointer"
                whileHover={{ y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <div className="relative overflow-hidden rounded-lg mb-4 sm:mb-6 aspect-[4/3]">
                  <motion.img
                    src={caseItem.image}
                    alt={caseItem.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <span className="text-[10px] sm:text-[12px] uppercase tracking-tight text-gray-500" style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}>
                    {caseItem.category}
                  </span>
                  {caseItem.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] sm:text-[12px] px-2 sm:px-3 py-1 bg-black/5 rounded-full text-gray-700">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-[24px] sm:text-[28px] lg:text-[32px] tracking-tight text-black transition-colors font-medium group-hover:[color:var(--bx-accent)]">
                  {caseItem.title}
                </h3>
              </motion.div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
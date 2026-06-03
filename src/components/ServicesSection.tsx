import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { FadeInSection } from './FadeInSection';
import backgroundImage from 'figma:asset/9bed18162ddffb4f08f6a61f2064f8ab7ca8e96f.png';

export function ServicesSection() {
  const steps = [
    {
      number: "01",
      title: "Create Your Profile",
      description: "Complete KYC verification and showcase your skills, portfolio, and experience. Build your professional presence.",
      icon: "https://cdn-icons.flaticon.com/512/1828/1828881.svg",
      color: "from-blue-500 to-purple-500"
    },
    {
      number: "02",
      title: "Randomized Discovery",
      description: "Browse talent through our fair algorithm or swipe Tinder-style to find your perfect match. Everyone gets equal visibility.",
      icon: "https://cdn-icons.flaticon.com/512/1828/1828883.svg",
      color: "from-purple-500 to-pink-500"
    },
    {
      number: "03",
      title: "Connect & Negotiate",
      description: "Chat directly with freelancers, discuss project details, and agree on terms. Transparent communication from the start.",
      icon: "https://cdn-icons.flaticon.com/512/2921/2921222.svg",
      color: "from-pink-500 to-red-500"
    },
    {
      number: "04",
      title: "Secure Payment",
      description: "Use our escrow system to protect both parties. Funds are released only after job completion and approval.",
      icon: "https://cdn-icons.flaticon.com/512/3595/3595977.svg",
      color: "from-red-500 to-orange-500"
    }
  ];

  return (
    <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-16 relative overflow-hidden" id="how-it-works">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      {/* Netflix-style Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      
      {/* Colored gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-pink-900/30" />

      <div className="max-w-[1200px] mx-auto relative z-10">
        <FadeInSection direction="up">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-12 sm:w-20 lg:w-[100px] h-[0.5px] bg-white/40"></div>
              <span className="text-[10px] sm:text-[12px] lg:text-[14px] uppercase tracking-tight text-white/80" style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}>
                Your Journey
              </span>
              <div className="w-12 sm:w-20 lg:w-[100px] h-[0.5px] bg-white/40"></div>
            </div>
            <h2 className="text-[36px] sm:text-[48px] lg:text-[60px] leading-tight mb-4 sm:mb-6 tracking-tight text-white font-bold">
              How It Works
            </h2>
            <p className="text-[16px] sm:text-[18px] lg:text-[20px] text-white/80 max-w-[600px] mx-auto px-4">
              Four simple steps to connect with Nigeria's top freelance talent
            </p>
          </div>
        </FadeInSection>

        {/* Journey Map */}
        <div className="relative">
          {/* Connecting Path */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 hidden md:block">
            <motion.div
              className="w-full h-full bg-gradient-to-b from-blue-500 via-purple-500 via-pink-500 to-orange-500 opacity-40"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              style={{ transformOrigin: "top" }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-24 md:space-y-32">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className={`relative flex flex-col md:flex-row items-center gap-8 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {/* Content Side */}
                <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right md:pr-16' : 'md:text-left md:pl-16'}`}>
                  <motion.div
                    initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                  >
                    <div className={`inline-block mb-4 text-[14px] uppercase tracking-[-0.42px] font-semibold bg-gradient-to-r ${step.color} bg-clip-text text-transparent`} style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}>
                      Step {step.number}
                    </div>
                    <h3 className="text-[40px] leading-[44px] mb-4 tracking-[-1.5px] text-white font-bold">
                      {step.title}
                    </h3>
                    <p className={`text-[18px] leading-[28px] text-white/80 max-w-[400px] ${index % 2 === 0 ? 'md:ml-auto' : 'md:mr-auto'}`}>
                      {step.description}
                    </p>
                  </motion.div>
                </div>

                {/* Center Icon */}
                <div className="relative z-20 flex-shrink-0">
                  <motion.div
                    className="relative"
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 0.3 + index * 0.1,
                      type: "spring",
                      stiffness: 200
                    }}
                  >
                    {/* Glow effect */}
                    <motion.div
                      className={`absolute inset-0 rounded-full bg-gradient-to-r ${step.color} opacity-30 blur-2xl`}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Main circle */}
                    <div className="relative w-32 h-32 bg-white/95 backdrop-blur-sm rounded-full shadow-2xl border-4 border-white/50 flex items-center justify-center overflow-hidden group">
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                      />
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        transition={{ duration: 0.3 }}
                        className="relative z-10"
                      >
                        <img src={step.icon} alt="" className="w-12 h-12" />
                      </motion.div>
                      
                      {/* Number badge */}
                      <motion.div
                        className={`absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r ${step.color} text-white flex items-center justify-center text-[14px] font-bold shadow-lg`}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 300 }}
                      >
                        {step.number}
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* Empty Side (for balance) */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>

          {/* Success indicator at the end */}
          <motion.div
            className="mt-24 flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl"
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 10px 40px rgba(16, 185, 129, 0.5)",
                  "0 10px 60px rgba(16, 185, 129, 0.7)",
                  "0 10px 40px rgba(16, 185, 129, 0.5)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <motion.p
              className="mt-6 text-[24px] font-bold text-white drop-shadow-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              Project Complete!
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
import React from 'react';
import { motion } from 'motion/react';
import { FadeInSection } from './FadeInSection';

export function ContactSection() {
  return (
    <section className="bg-white py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-16" id="trust-safety">
      <div className="max-w-[1500px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 lg:gap-20">
          <FadeInSection direction="right">
            <div>
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-12 sm:w-20 lg:w-[100px] h-[0.5px] bg-black/20"></div>
                <span className="text-[10px] sm:text-[12px] lg:text-[14px] uppercase tracking-tight text-gray-500" style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}>
                  Security First
                </span>
              </div>
              <h2 className="text-[36px] sm:text-[52px] lg:text-[70px] leading-tight mb-6 sm:mb-8 tracking-tight text-black font-bold">
                Your safety is our priority
              </h2>
              <p className="text-[16px] sm:text-[18px] lg:text-[20px] text-gray-600 mb-8 sm:mb-12 leading-relaxed">
                We've built a platform where trust and transparency come first, protecting both freelancers and clients every step of the way.
              </p>

              <div className="space-y-6 sm:space-y-8">
                {[
                  {
                    label: 'KYC Verification',
                    value: 'All freelancers verified with government ID',
                    icon: 'https://cdn-icons.flaticon.com/512/1828/1828881.svg'
                  },
                  {
                    label: 'Escrow Protection',
                    value: 'Payments held securely until work is approved',
                    icon: 'https://cdn-icons.flaticon.com/512/1828/1828883.svg'
                  },
                  {
                    label: 'Dispute Resolution',
                    value: 'Fair mediation process for conflict resolution',
                    icon: 'https://cdn-icons.flaticon.com/512/2921/2921222.svg'
                  }
                ].map((contact, index) => (
                  <motion.div
                    key={contact.label}
                    className="flex items-start gap-3 sm:gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                      <img src={contact.icon} alt="" className="w-5 h-5 sm:w-6 sm:h-6 invert" />
                    </div>
                    <div>
                      <div className="text-[10px] sm:text-[12px] uppercase tracking-tight text-gray-500 mb-1" style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}>
                        {contact.label}
                      </div>
                      <div className="text-[14px] sm:text-[16px] lg:text-[18px]">{contact.value}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.3} direction="left">
            <div className="bg-gray-50 p-6 sm:p-10 lg:p-12 rounded-lg">
              <form className="space-y-5 sm:space-y-6">
                {[
                  { label: 'Name', type: 'text', placeholder: 'Your name' },
                  { label: 'Email', type: 'email', placeholder: 'your@email.com' },
                  { label: 'Role', type: 'text', placeholder: 'Freelancer or Client' }
                ].map((field, index) => (
                  <motion.div
                    key={field.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  >
                    <label className="block text-[10px] sm:text-[12px] uppercase tracking-tight mb-2 text-gray-600" style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-[14px] sm:text-[16px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                      style={{ fontFamily: 'var(--font-effra)' }}
                    />
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <label className="block text-[10px] sm:text-[12px] uppercase tracking-tight mb-2 text-gray-600" style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}>
                    Message
                  </label>
                  <textarea
                    placeholder="Tell us how we can help you"
                    rows={6}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-[14px] sm:text-[16px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    style={{ fontFamily: 'var(--font-effra)' }}
                  />
                </motion.div>

                <motion.button
                  type="submit"
                  className="w-full text-white py-3 sm:py-4 rounded-lg uppercase text-[12px] sm:text-[14px] tracking-tight flex items-center justify-center gap-2 sm:gap-3 font-semibold accent-bg accent-hover-darken"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  Get In Touch
                  <img src="https://cdn-icons.flaticon.com/512/1086/1086581.svg" className="w-4 h-4 sm:w-5 sm:h-5" alt="" />
                </motion.button>
              </form>
            </div>
          </FadeInSection>
        </div>
      </div>
    </section>
  );
}
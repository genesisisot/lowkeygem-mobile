import React from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="bg-black text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-8 lg:px-16">
      <div className="max-w-[1500px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 pb-10 sm:pb-12 lg:pb-16 border-b border-white/10">
          {/* Logo & Description */}
          <motion.div
            className="col-span-1 sm:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 sm:mb-6">
              <Logo iconSize={40} />
            </div>
            <p className="text-gray-400 text-[14px] sm:text-[16px] leading-relaxed max-w-[400px]">
              Nigeria's first fair freelancer marketplace. Connecting talent with opportunity through randomized discovery and secure transactions.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h3 className="text-[12px] sm:text-[14px] uppercase tracking-tight mb-4 sm:mb-6" style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}>
              Quick Links
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {['How It Works', 'Why Platform', 'Trust & Safety', 'For Freelancers', 'For Clients'].map((link, index) => (
                <motion.li
                  key={link}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                >
                  <a href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-[14px] sm:text-[16px] text-gray-400 hover:text-white transition-colors">
                    {link}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Social */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h3 className="text-[12px] sm:text-[14px] uppercase tracking-tight mb-4 sm:mb-6" style={{ fontFamily: '"Source Code Pro", "Source Code Pro Fallback"' }}>
              Follow Us
            </h3>
            <div className="flex gap-3 sm:gap-4">
              {[
                { name: 'LinkedIn', icon: 'https://cdn-icons.flaticon.com/512/174/174857.svg' },
                { name: 'Twitter', icon: 'https://cdn-icons.flaticon.com/512/733/733579.svg' },
                { name: 'Instagram', icon: 'https://cdn-icons.flaticon.com/512/2111/2111463.svg' }
              ].map((social, index) => (
                <motion.a
                  key={social.name}
                  href="#"
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                >
                  <img src={social.icon} alt={social.name} className="w-4 h-4 sm:w-5 sm:h-5 invert" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom */}
        <motion.div
          className="pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <p className="text-gray-500 text-[12px] sm:text-[14px] text-center md:text-left">
            © 2025 Nigerian Freelancer Marketplace. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[12px] sm:text-[14px]">
            {['Privacy Policy', 'Terms of Service', 'Cookies'].map((link) => (
              <a key={link} href="#" className="text-gray-500 hover:text-white transition-colors">
                {link}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
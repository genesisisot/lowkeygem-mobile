import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useScroll } from 'motion/react';

interface GalleryProps {
  images: string[];
  direction?: 'up' | 'down';
  speed?: number;
}

export function ScrollingGallery({ images, direction = 'up', speed = 0.5 }: GalleryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
  // Create smooth scrolling animation based on page scroll
  const baseY = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up' ? [0, -400] : [0, 400]
  );
  
  const smoothY = useSpring(baseY, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Auto-scroll animation
  const autoY = useMotionValue(direction === 'up' ? 0 : -200);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const currentY = autoY.get();
      const newY = currentY + (direction === 'up' ? -speed : speed) * deltaTime * 100;
      
      // Reset position for infinite loop
      if (direction === 'up' && newY < -800) {
        autoY.set(0);
      } else if (direction === 'down' && newY > 0) {
        autoY.set(-800);
      } else {
        autoY.set(newY);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [autoY, direction, speed]);

  return (
    <div ref={ref} className="overflow-hidden relative">
      <div className="h-full overflow-hidden relative">
        <motion.div 
          className="flex flex-col gap-[23px]"
          style={{ y: autoY }}
        >
          {/* Duplicate images for seamless loop */}
          {[...images, ...images].map((src, index) => (
            <motion.div
              key={index}
              className="overflow-hidden relative w-[302px] h-[360px] shrink-0"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
            >
              <img
                alt="Digital Design Agency"
                src={src}
                className="block size-full max-w-full object-cover overflow-clip align-middle aspect-[auto_400_/_400]"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

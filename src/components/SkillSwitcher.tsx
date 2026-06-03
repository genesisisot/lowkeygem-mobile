import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, ChevronDown } from 'lucide-react';

interface SkillProfile {
  id: string;
  headline: string;
  category: string;
  status: 'active' | 'paused' | 'draft' | 'pending_review';
}

interface SkillSwitcherProps {
  skills: SkillProfile[];
  selectedSkillId: string;
  onSelectSkill: (skillId: string) => void;
  className?: string;
}

export function SkillSwitcher({ skills, selectedSkillId, onSelectSkill, className = '' }: SkillSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedSkill = skills.find(s => s.id === selectedSkillId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#0f9d76';
      case 'paused': return '#d98a00';
      case 'pending_review': return '#d98a00';
      case 'draft': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div className={`bx-switch ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="bx-switch__btn"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="bx-switch__ic">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="bx-switch__cap">Active Skill Profile</div>
          <div className="bx-switch__title">{selectedSkill?.headline || 'Select Skill'}</div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5" style={{ color: 'var(--bx-faint)' }} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bx-switch__menu"
            >
              <div className="max-h-80 overflow-y-auto">
                {skills.map((skill) => (
                  <motion.button
                    key={skill.id}
                    onClick={() => {
                      onSelectSkill(skill.id);
                      setIsOpen(false);
                    }}
                    className={`bx-switch__opt ${selectedSkillId === skill.id ? 'on' : ''}`}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="bx-switch__dot" style={{ backgroundColor: getStatusColor(skill.status) }} />
                      <div className="flex-1 min-w-0">
                        <div className="bx-switch__title">{skill.headline}</div>
                        <div className="bx-switch__sub">{skill.category}</div>
                      </div>
                    </div>
                    {selectedSkillId === skill.id && (
                      <Check className="w-5 h-5" style={{ color: 'var(--bx-accent-2)' }} />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

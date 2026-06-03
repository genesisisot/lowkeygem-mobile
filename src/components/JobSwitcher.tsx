import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Check, ChevronDown } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  category: string;
  status: 'active' | 'filled' | 'paused';
}

interface JobSwitcherProps {
  jobs: Job[];
  selectedJobId: string;
  onSelectJob: (jobId: string) => void;
  className?: string;
}

export function JobSwitcher({ jobs, selectedJobId, onSelectJob, className = '' }: JobSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#0f9d76';
      case 'filled': return '#6b7280';
      case 'paused': return '#d98a00';
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
          <Briefcase className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="bx-switch__cap">Active Job</div>
          <div className="bx-switch__title">{selectedJob?.title || 'Select Job'}</div>
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
                {jobs.map((job) => (
                  <motion.button
                    key={job.id}
                    onClick={() => {
                      onSelectJob(job.id);
                      setIsOpen(false);
                    }}
                    className={`bx-switch__opt ${selectedJobId === job.id ? 'on' : ''}`}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="bx-switch__dot" style={{ backgroundColor: getStatusColor(job.status) }} />
                      <div className="flex-1 min-w-0">
                        <div className="bx-switch__title">{job.title}</div>
                        <div className="bx-switch__sub">{job.category}</div>
                      </div>
                    </div>
                    {selectedJobId === job.id && (
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
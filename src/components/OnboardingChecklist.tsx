import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  User,
  Sparkles,
  Shield,
  CreditCard,
  Briefcase,
  ChevronRight,
  X,
  Rocket
} from 'lucide-react';
import type { Profile } from '../types/database';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  action: () => void;
  icon: React.ElementType;
}

interface OnboardingChecklistProps {
  userType: 'freelancer' | 'client';
  profile: Profile | null;
  hasSkillProfiles?: boolean;
  hasJobs?: boolean;
  hasBankLinked?: boolean;
  hasPaymentMethod?: boolean;
  onNavigate: (view: string) => void;
  onDismiss?: () => void;
}

export function OnboardingChecklist({
  userType,
  profile,
  hasSkillProfiles = false,
  hasJobs = false,
  hasBankLinked = false,
  hasPaymentMethod = false,
  onNavigate,
  onDismiss,
}: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if dismissed in localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem(`onboarding_dismissed_${profile?.id}`);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, [profile?.id]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(`onboarding_dismissed_${profile?.id}`, 'true');
    onDismiss?.();
  };

  // Check profile completion
  const isProfileComplete = Boolean(
    profile?.full_name &&
    profile?.bio &&
    profile?.location
  );

  // Check KYC status
  const isVerified = profile?.kyc_status === 'approved';
  const kycSubmitted = profile?.kyc_status === 'submitted' || isVerified;

  const freelancerItems: ChecklistItem[] = [
    {
      id: 'profile',
      label: 'Complete your profile',
      description: 'Add your name, bio, and location',
      completed: isProfileComplete,
      action: () => onNavigate('myProfile'),
      icon: User,
    },
    {
      id: 'skills',
      label: 'Add a skill profile',
      description: 'Showcase your services to clients',
      completed: hasSkillProfiles,
      action: () => onNavigate('mySkills'),
      icon: Sparkles,
    },
    {
      id: 'kyc',
      label: 'Get verified',
      description: kycSubmitted ? (isVerified ? 'Verified!' : 'Under review') : 'Submit your ID for verification',
      completed: isVerified,
      action: () => onNavigate('myProfile'),
      icon: Shield,
    },
    {
      id: 'bank',
      label: 'Link bank account',
      description: 'Set up payments to receive earnings',
      completed: hasBankLinked,
      action: () => onNavigate('wallet'),
      icon: CreditCard,
    },
  ];

  const clientItems: ChecklistItem[] = [
    {
      id: 'profile',
      label: 'Complete your profile',
      description: 'Add your name and company info',
      completed: isProfileComplete,
      action: () => onNavigate('myProfile'),
      icon: User,
    },
    {
      id: 'job',
      label: 'Post your first job',
      description: 'Start finding talented freelancers',
      completed: hasJobs,
      action: () => onNavigate('addJob'),
      icon: Briefcase,
    },
    {
      id: 'kyc',
      label: 'Get verified',
      description: kycSubmitted ? (isVerified ? 'Verified!' : 'Under review') : 'Build trust with freelancers',
      completed: isVerified,
      action: () => onNavigate('myProfile'),
      icon: Shield,
    },
    {
      id: 'payment',
      label: 'Add payment method',
      description: 'Fund projects securely',
      completed: hasPaymentMethod,
      action: () => onNavigate('wallet'),
      icon: CreditCard,
    },
  ];

  const items = userType === 'freelancer' ? freelancerItems : clientItems;
  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const progress = (completedCount / totalCount) * 100;

  // Don't show if all items complete or dismissed
  if (completedCount === totalCount || isDismissed) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bx-onb"
    >
      {/* Header */}
      <div className="bx-onb__head">
        <div className="bx-onb__head-row">
          <div className="bx-onb__brand">
            <div className="bx-onb__rocket"><Rocket className="w-5 h-5" /></div>
            <div>
              <h3 className="bx-onb__title">Getting Started</h3>
              <p className="bx-onb__sub">{completedCount} of {totalCount} complete</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="bx-onb__x" title="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="bx-onb__bar">
          <motion.i
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ display: 'block', height: '100%' }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div>
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            onClick={item.action}
            disabled={item.completed}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bx-onb__row"
          >
            <div className={`bx-onb__check ${item.completed ? 'done' : ''}`}>
              {item.completed && <Check className="w-4 h-4" />}
            </div>
            <div className={`bx-onb__ic ${item.completed ? 'done' : ''}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="bx-onb__main">
              <p className={`bx-onb__label ${item.completed ? 'done' : ''}`}>{item.label}</p>
              <p className="bx-onb__desc">{item.description}</p>
            </div>
            {!item.completed && <ChevronRight className="w-5 h-5" style={{ color: 'var(--bx-faint)', flex: 'none' }} />}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

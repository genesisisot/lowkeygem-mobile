import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Briefcase, Mail, Phone, Shield, Camera, CheckCircle, Upload, ArrowRight, ArrowLeft, X, Search, ChevronDown, Loader2 } from 'lucide-react';
import { Logo } from './Logo';
import { BottomSheet } from './BottomSheet';
import { authService } from '../services/auth';
import { kycService } from '../services/kyc';
import { skillProfilesService } from '../services/profiles';
import { storageService } from '../services/storage';
import { AuthAtmosphere } from './site/AuthAtmosphere';
import '../styles/landing.css';

interface OnboardingProps {
  onComplete: () => void;
}

type UserType = 'freelancer' | 'client' | null;

// Profession categories with related skills
const professionSkillsMap: Record<string, string[]> = {
  'UI/UX Designer': ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'Wireframing', 'Visual Design', 'Interaction Design'],
  'Web Developer': ['HTML/CSS', 'JavaScript', 'React', 'Vue.js', 'Node.js', 'PHP', 'WordPress', 'Responsive Design'],
  'Mobile Developer': ['React Native', 'Flutter', 'iOS Development', 'Android Development', 'Swift', 'Kotlin', 'Mobile UI/UX', 'App Store Optimization'],
  'Graphic Designer': ['Adobe Photoshop', 'Adobe Illustrator', 'CorelDRAW', 'Brand Identity', 'Logo Design', 'Print Design', 'Digital Illustration', 'Typography'],
  'Content Writer': ['SEO Writing', 'Copywriting', 'Blog Writing', 'Technical Writing', 'Creative Writing', 'Proofreading', 'Research', 'Content Strategy'],
  'Video Editor': ['Adobe Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'After Effects', 'Motion Graphics', 'Color Grading', 'Audio Editing', 'Storytelling'],
  'Social Media Manager': ['Content Planning', 'Instagram Marketing', 'Facebook Ads', 'Twitter Management', 'Analytics', 'Community Management', 'Copywriting', 'Canva'],
  'Digital Marketer': ['SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Email Marketing', 'Analytics', 'Content Marketing', 'Conversion Optimization'],
  'Data Analyst': ['Excel', 'SQL', 'Python', 'Power BI', 'Tableau', 'Data Visualization', 'Statistics', 'Business Intelligence'],
  'Virtual Assistant': ['Email Management', 'Scheduling', 'Data Entry', 'Customer Service', 'Microsoft Office', 'Google Workspace', 'Communication', 'Organization'],
  'Photographer': ['Portrait Photography', 'Event Photography', 'Product Photography', 'Adobe Lightroom', 'Photo Editing', 'Studio Lighting', 'Composition', 'Retouching'],
  '3D Artist': ['Blender', '3D Modeling', 'Texturing', 'Rendering', 'Animation', 'Cinema 4D', 'Maya', 'ZBrush'],
  'Crochet Artist': ['Amigurumi', 'Pattern Design', 'Color Theory', 'Yarn Selection', 'Custom Orders', 'Fashion Crochet', 'Home Décor', 'Granny Squares'],
  'Fashion Designer': ['Sketching', 'Pattern Making', 'Sewing', 'Fabric Selection', 'Fashion Illustration', 'Tailoring', 'Trend Forecasting', 'CAD Design'],
  'Voice Over Artist': ['Voice Acting', 'Narration', 'Commercial VO', 'Character Voices', 'Audio Editing', 'Script Reading', 'Accent Work', 'Home Studio Setup'],
  'Animator': ['2D Animation', '3D Animation', 'Character Animation', 'Motion Graphics', 'Storyboarding', 'After Effects', 'Toon Boom', 'Rigging'],
  'Makeup Artist': ['Bridal Makeup', 'Special Effects', 'Beauty Makeup', 'Editorial Makeup', 'Color Theory', 'Contouring', 'Airbrush Makeup', 'Skincare Knowledge'],
  'Event Planner': ['Event Coordination', 'Vendor Management', 'Budget Planning', 'Logistics', 'Wedding Planning', 'Corporate Events', 'Décor Design', 'Timeline Management'],
};

const professions = Object.keys(professionSkillsMap);

const idTypes = [
  { value: 'national-id', label: 'National ID Card' },
  { value: 'drivers-license', label: "Driver's License" },
  { value: 'international-passport', label: 'International Passport' },
  { value: 'voters-card', label: "Voter's Card" },
];

const industries = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'other', label: 'Other' },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userType, setUserType] = useState<UserType>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    verificationCode: '',
    idType: 'national-id',
    idNumber: '',
    profession: '',
    skills: [] as string[],
    companyName: '',
    industry: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState({
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
  });

  // Bottom sheet states
  const [showProfessionSheet, setShowProfessionSheet] = useState(false);
  const [showIdTypeSheet, setShowIdTypeSheet] = useState(false);
  const [showIndustrySheet, setShowIndustrySheet] = useState(false);
  const [professionSearch, setProfessionSearch] = useState('');
  const [industrySearch, setIndustrySearch] = useState('');

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email OTP state (Step 2)
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpDevCode, setOtpDevCode] = useState<string | null>(null);
  const [otpRequestedFor, setOtpRequestedFor] = useState<string | null>(null);

  const sendOtp = async () => {
    if (!formData.email) return;
    setOtpSending(true);
    setOtpError(null);
    setOtpDevCode(null);
    const { data, error } = await authService.requestOtp(formData.email);
    setOtpSending(false);
    if (error) {
      setOtpError(error.message);
      return;
    }
    setOtpRequestedFor(formData.email);
    if (data?.dev_code) setOtpDevCode(data.dev_code); // shown only when no email provider is configured
  };

  const verifyOtpCode = async () => {
    setOtpVerifying(true);
    setOtpError(null);
    const { error } = await authService.verifyOtp(formData.email, formData.verificationCode);
    setOtpVerifying(false);
    if (error) {
      setOtpError(error.message || 'Invalid code');
      return;
    }
    nextStep();
  };

  // Request a code the first time the user reaches the email-verification step.
  useEffect(() => {
    if (currentStep === 2 && formData.email && otpRequestedFor !== formData.email) {
      void sendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'profession' && value) {
      setFormData(prev => ({ ...prev, skills: [] }));
    }
  };

  const handleFileUpload = (field: keyof typeof uploadedFiles, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSkillAdd = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const handleSkillRemove = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const selectUserType = (type: UserType) => {
    setUserType(type);
    setCurrentStep(1);
  };

  const filteredProfessions = professionSearch
    ? professions.filter(p => p.toLowerCase().includes(professionSearch.toLowerCase()))
    : professions;

  const filteredIndustries = industrySearch
    ? industries.filter(i => i.label.toLowerCase().includes(industrySearch.toLowerCase()))
    : industries;

  // Handle signup with Supabase
  const handleSignup = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create the account (user + profile + wallet) and authenticate.
      const { data: profile, error: authError } = await authService.signup({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        user_type: userType as 'freelancer' | 'client',
        phone: formData.phone || undefined,
        profession: userType === 'freelancer' ? formData.profession : undefined,
        company_name: userType === 'client' ? formData.companyName : undefined,
        industry: userType === 'client' ? formData.industry : undefined,
      });

      if (authError || !profile) {
        setError(authError?.message || 'Failed to create account. Please try again.');
        setIsSubmitting(false);
        return false;
      }

      const userId = profile.id;

      // 2. Upload KYC documents (now authenticated).
      let idFrontUrl = '';
      let idBackUrl = '';
      let selfieUrl = '';

      if (uploadedFiles.idFront) {
        idFrontUrl = (await storageService.uploadKYCDocument(userId, uploadedFiles.idFront, 'id_front')) || '';
      }
      if (uploadedFiles.idBack) {
        idBackUrl = (await storageService.uploadKYCDocument(userId, uploadedFiles.idBack, 'id_back')) || '';
      }
      if (uploadedFiles.selfie) {
        selfieUrl = (await storageService.uploadKYCDocument(userId, uploadedFiles.selfie, 'selfie')) || '';
      }

      // 3. Create the KYC submission (also flips profile.kyc_status to 'submitted').
      await kycService.submit({
        user_id: userId,
        id_type: formData.idType,
        id_number: formData.idNumber,
        id_front_url: idFrontUrl || 'pending',
        id_back_url: idBackUrl || 'pending',
        selfie_url: selfieUrl || 'pending',
      } as any);

      // 4. If freelancer, create an initial skill profile.
      if (userType === 'freelancer' && formData.profession) {
        await skillProfilesService.create({
          freelancer_id: userId,
          headline: `${formData.profession} - ${formData.fullName}`,
          category: formData.profession,
          skills: formData.skills,
          status: 'active',
        } as any);
      }

      setIsSubmitting(false);
      return true;
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
      return false;
    }
  };

  // Modified nextStep for step 4 to handle signup
  const handleStep4Next = async () => {
    const success = await handleSignup();
    if (success) {
      nextStep();
    }
  };

  return (
    <div className="auth" style={{ minHeight: '100svh' }}>
      <AuthAtmosphere />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ backdropFilter: 'blur(14px)', background: 'rgba(6,5,7,0.45)', borderBottom: '1px solid var(--line)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.button
              onClick={onComplete}
              className="lk__navlink"
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.95 }}
              title="Back to website"
            >
              ← Back
            </motion.button>
            <Logo textColor="text-white" />
          </div>

          {currentStep > 0 && currentStep < 5 && (
            <span className="lk__eyebrow" style={{ fontSize: 11 }}>
              Step {currentStep} / 4
            </span>
          )}
        </div>

        {currentStep > 0 && currentStep < 5 && (
          <div className="auth__steps-bar" style={{ position: 'absolute' }}>
            <motion.div
              className="auth__steps-fill"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 4) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16 sm:pt-20 relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP 0: Choose User Type */}
          {currentStep === 0 && (
            <motion.div
              key="welcome-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8"
            >
              <div className="max-w-4xl w-full" style={{ position: 'relative', zIndex: 2 }}>
                <div className="text-center mb-8 sm:mb-12">
                  <span className="lk__eyebrow" style={{ justifyContent: 'center' }}>Create your account</span>
                  <h1 className="lk__heading" style={{ marginTop: 16 }}>
                    How do you want to <span className="lk__gradient">start?</span>
                  </h1>
                </div>

                <div className="auth__roles" style={{ maxWidth: 760, margin: '0 auto' }}>
                  <motion.button
                    onClick={() => selectUserType('freelancer')}
                    className="auth__role"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="auth__role-icon"><User size={26} /></span>
                    <h3>Become a freelancer</h3>
                    <p>Showcase your skills and get discovered fairly by clients looking for talent.</p>
                    <span className="auth__role-go">Get started <ArrowRight size={14} /></span>
                  </motion.button>

                  <motion.button
                    onClick={() => selectUserType('client')}
                    className="auth__role"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="auth__role-icon"><Briefcase size={26} /></span>
                    <h3>Hire a freelancer</h3>
                    <p>Find verified talent through fair discovery and build your dream team.</p>
                    <span className="auth__role-go">Get started <ArrowRight size={14} /></span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <motion.div
              key="basic-info-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-6 sm:py-8"
            >
              <div className="max-w-2xl w-full bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-10 shadow-2xl">
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                    Basic Information
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    Let's start with your basic details
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors bg-white"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors bg-white"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors bg-white"
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                      Create Password
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors bg-white"
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 sm:mt-8">
                  <button
                    onClick={prevStep}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl font-semibold text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!formData.fullName || !formData.email || !formData.phone || formData.password.length < 6}
                    className="flex-1 px-5 sm:px-6 py-2.5 sm:py-3 text-white rounded-xl font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 accent-bg"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Phone Verification */}
          {currentStep === 2 && (
            <motion.div
              key="verification-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-6 sm:py-8"
            >
              <div className="max-w-xl w-full text-center bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-10 shadow-2xl">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 sm:mb-6 rounded-full flex items-center justify-center accent-bg-10">
                  <Mail className="w-10 h-10 sm:w-12 sm:h-12 accent-text" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                  Verify Your Email
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                  {otpSending ? 'Sending a 6-digit code to ' : "We've sent a 6-digit code to "}
                  <span className="font-semibold">{formData.email}</span>
                </p>

                {otpDevCode && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                    Dev mode (no email provider configured): your code is <strong>{otpDevCode}</strong>
                  </div>
                )}

                <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={formData.verificationCode}
                    onChange={(e) => handleInputChange('verificationCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors text-center text-2xl sm:text-3xl tracking-[0.5em] font-bold text-gray-900 bg-white"
                    placeholder="000000"
                    maxLength={6}
                  />
                  {otpError && <p className="text-sm text-red-600 mt-2">{otpError}</p>}
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={otpSending}
                    className="text-sm sm:text-base mt-3 sm:mt-4 font-semibold hover:underline disabled:opacity-50 accent-text"
                  >
                    {otpSending ? 'Sending…' : 'Resend code'}
                  </button>
                </div>

                <div className="flex gap-3 mt-6 sm:mt-8">
                  <button
                    onClick={prevStep}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl font-semibold text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    Back
                  </button>
                  <button
                    onClick={verifyOtpCode}
                    disabled={formData.verificationCode.length !== 6 || otpVerifying}
                    className="flex-1 px-5 sm:px-6 py-2.5 sm:py-3 text-white rounded-xl font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 accent-bg"
                  >
                    {otpVerifying ? <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Verifying…</> : <>Verify <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" /></>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: ID Verification */}
          {currentStep === 3 && (
            <motion.div
              key="id-verification-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-6 sm:py-8"
            >
              <div className="max-w-3xl w-full bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-10 shadow-2xl">
                <div className="mb-6 sm:mb-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-full flex items-center justify-center accent-bg-10">
                    <Shield className="w-8 h-8 sm:w-10 sm:h-10 accent-text" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                    Identity Verification
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    Upload a valid government-issued ID for KYC compliance
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  {/* ID Type - Bottom Sheet for ALL devices */}
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                      ID Type
                    </label>
                    <button
                      onClick={() => setShowIdTypeSheet(true)}
                      className="w-full px-4 py-3 sm:py-4 text-sm sm:text-base text-gray-900 border-2 border-gray-200 rounded-xl hover:border-purple-600 active:border-purple-600 transition-colors bg-white text-left flex items-center justify-between active:scale-[0.98]"
                    >
                      <span className="font-medium">{idTypes.find(id => id.value === formData.idType)?.label}</span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </button>
                    <BottomSheet
                      isOpen={showIdTypeSheet}
                      onClose={() => setShowIdTypeSheet(false)}
                      title="Select ID Type"
                    >
                      <div className="p-4 min-h-[200px]">
                        {idTypes.map((id) => (
                          <button
                            key={id.value}
                            onClick={() => {
                              handleInputChange('idType', id.value);
                              setShowIdTypeSheet(false);
                            }}
                            className={`w-full px-6 py-5 text-left text-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-xl mb-3 ${
                              formData.idType === id.value ? 'bg-purple-100 text-purple-700 font-bold border-2 border-purple-600' : 'text-gray-900 border-2 border-transparent'
                            }`}
                          >
                            {id.label}
                          </button>
                        ))}
                      </div>
                    </BottomSheet>
                  </div>

                  {/* ID Number */}
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                      ID Number
                    </label>
                    <input
                      type="text"
                      value={formData.idNumber}
                      onChange={(e) => handleInputChange('idNumber', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors bg-white"
                      placeholder="Enter your ID number"
                    />
                  </div>

                  {/* File Uploads */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* ID Front */}
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                        ID Front
                      </label>
                      <label className="block cursor-pointer">
                        <div className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors ${uploadedFiles.idFront ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-600'}`}>
                          {uploadedFiles.idFront ? (
                            <div>
                              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 accent-text" />
                              <p className="text-sm sm:text-base font-semibold accent-text">
                                Uploaded
                              </p>
                            </div>
                          ) : (
                            <div>
                              <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-400" />
                              <p className="text-xs sm:text-sm text-gray-600">
                                Click to upload
                              </p>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('idFront', e.target.files[0])}
                        />
                      </label>
                    </div>

                    {/* ID Back */}
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                        ID Back
                      </label>
                      <label className="block cursor-pointer">
                        <div className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors ${uploadedFiles.idBack ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-600'}`}>
                          {uploadedFiles.idBack ? (
                            <div>
                              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 accent-text" />
                              <p className="text-sm sm:text-base font-semibold accent-text">
                                Uploaded
                              </p>
                            </div>
                          ) : (
                            <div>
                              <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-400" />
                              <p className="text-xs sm:text-sm text-gray-600">
                                Click to upload
                              </p>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('idBack', e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Selfie Verification */}
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                      Selfie with ID
                    </label>
                    <label className="block cursor-pointer">
                      <div className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-colors ${uploadedFiles.selfie ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-600'}`}>
                        {uploadedFiles.selfie ? (
                          <div>
                            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 accent-text" />
                            <p className="text-base sm:text-lg font-semibold accent-text">
                              Selfie Uploaded
                            </p>
                          </div>
                        ) : (
                          <div>
                            <Camera className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 text-gray-400" />
                            <p className="text-sm sm:text-base text-gray-600 mb-1">
                              Take a selfie holding your ID
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              Ensure your face and ID are clearly visible
                            </p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('selfie', e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 sm:mt-8">
                  <button
                    onClick={prevStep}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl font-semibold text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!formData.idNumber || !uploadedFiles.idFront || !uploadedFiles.idBack || !uploadedFiles.selfie}
                    className="flex-1 px-5 sm:px-6 py-2.5 sm:py-3 text-white rounded-xl font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 accent-bg"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Professional Information */}
          {currentStep === 4 && (
            <motion.div
              key="professional-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-6 sm:py-8"
            >
              <div className="max-w-3xl w-full bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-10 shadow-2xl">
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                    Professional Details
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    {userType === 'freelancer' 
                      ? 'Tell us about your skills and expertise'
                      : 'Tell us about your business needs'}
                  </p>
                </div>

                {userType === 'freelancer' ? (
                  <div className="space-y-4 sm:space-y-5">
                    {/* Profession - Bottom Sheet for ALL devices */}
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                        Primary Profession
                      </label>
                      <button
                        onClick={() => setShowProfessionSheet(true)}
                        className="w-full px-4 py-3 sm:py-4 text-sm sm:text-base text-gray-900 border-2 border-gray-200 rounded-xl hover:border-purple-600 active:border-purple-600 transition-colors bg-white text-left flex items-center justify-between active:scale-[0.98]"
                      >
                        <span className="font-medium">{formData.profession || 'Select profession'}</span>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </button>
                      <BottomSheet
                        isOpen={showProfessionSheet}
                        onClose={() => setShowProfessionSheet(false)}
                        title="Select Profession"
                      >
                        <div className="p-4">
                          <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              value={professionSearch}
                              onChange={(e) => setProfessionSearch(e.target.value)}
                              placeholder="Search or type your profession..."
                              className="w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none bg-white text-gray-900 text-base"
                            />
                          </div>
                          
                          {/* Custom Profession Option */}
                          {professionSearch && !professions.includes(professionSearch) && (
                            <div className="mb-3 px-2">
                              <button
                                onClick={() => {
                                  handleInputChange('profession', professionSearch);
                                  setShowProfessionSheet(false);
                                  setProfessionSearch('');
                                }}
                                className="w-full px-6 py-5 text-left text-lg font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 active:bg-purple-300 transition-colors rounded-xl border-2 border-purple-600"
                              >
                                ✨ Use "{professionSearch}"
                              </button>
                            </div>
                          )}
                          
                          <div className="max-h-96 overflow-y-auto px-2 scrollbar-hide">
                            {filteredProfessions.map((profession) => (
                              <button
                                key={profession}
                                onClick={() => {
                                  handleInputChange('profession', profession);
                                  setShowProfessionSheet(false);
                                  setProfessionSearch('');
                                }}
                                className={`w-full px-6 py-5 text-left text-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-xl mb-2 ${
                                  formData.profession === profession ? 'bg-purple-100 text-purple-700 font-bold border-2 border-purple-600' : 'text-gray-900 border-2 border-transparent'
                                }`}
                              >
                                {profession}
                              </button>
                            ))}
                          </div>
                        </div>
                      </BottomSheet>
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                        Skills {professions.includes(formData.profession) ? '(Select at least 3)' : '(Optional)'}
                      </label>
                      {formData.profession && (
                        <p className="text-xs sm:text-sm text-gray-500 mb-3">
                          Based on your profession: {formData.profession}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                        {formData.skills.map((skill) => (
                          <motion.span
                            key={skill}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold text-white flex items-center gap-2 accent-bg"
                          >
                            {skill}
                            <button
                              onClick={() => handleSkillRemove(skill)}
                              className="hover:bg-white/20 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                      {formData.profession && professionSkillsMap[formData.profession] && (
                        <div className="flex flex-wrap gap-2">
                          {professionSkillsMap[formData.profession]
                            .filter(skill => !formData.skills.includes(skill))
                            .map((skill) => (
                              <button
                                key={skill}
                                onClick={() => handleSkillAdd(skill)}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm text-gray-700 border-2 border-gray-300 hover:border-purple-600 hover:bg-purple-50 transition-colors"
                              >
                                + {skill}
                              </button>
                            ))}
                        </div>
                      )}
                      {!formData.profession && (
                        <p className="text-xs sm:text-sm text-gray-500 italic">
                          Please select a profession first to see relevant skills
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-5">
                    {/* Company Name */}
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors bg-white"
                        placeholder="Your company name"
                      />
                    </div>

                    {/* Industry - Bottom Sheet for ALL devices */}
                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                        Industry
                      </label>
                      <button
                        onClick={() => setShowIndustrySheet(true)}
                        className="w-full px-4 py-3 sm:py-4 text-sm sm:text-base text-gray-900 border-2 border-gray-200 rounded-xl hover:border-purple-600 active:border-purple-600 transition-colors bg-white text-left flex items-center justify-between active:scale-[0.98]"
                      >
                        <span className="font-medium">{industries.find(ind => ind.value === formData.industry)?.label || 'Select industry'}</span>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </button>
                      <BottomSheet
                        isOpen={showIndustrySheet}
                        onClose={() => setShowIndustrySheet(false)}
                        title="Select Industry"
                      >
                        <div className="p-4 min-h-[200px]">
                          <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              value={industrySearch}
                              onChange={(e) => setIndustrySearch(e.target.value)}
                              placeholder="Search or type your industry..."
                              className="w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none bg-white text-gray-900 text-base"
                            />
                          </div>
                          
                          {/* Custom Industry Option */}
                          {industrySearch && !industries.some(ind => ind.label.toLowerCase() === industrySearch.toLowerCase()) && (
                            <div className="mb-3 px-2">
                              <button
                                onClick={() => {
                                  handleInputChange('industry', industrySearch);
                                  setShowIndustrySheet(false);
                                  setIndustrySearch('');
                                }}
                                className="w-full px-6 py-5 text-left text-lg font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 active:bg-purple-300 transition-colors rounded-xl border-2 border-purple-600"
                              >
                                ✨ Use "{industrySearch}"
                              </button>
                            </div>
                          )}
                          
                          <div className="max-h-96 overflow-y-auto px-2 scrollbar-hide">
                            {filteredIndustries.map((industry) => (
                              <button
                                key={industry.value}
                                onClick={() => {
                                  handleInputChange('industry', industry.value);
                                  setShowIndustrySheet(false);
                                  setIndustrySearch('');
                                }}
                                className={`w-full px-6 py-5 text-left text-lg font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-xl mb-3 ${
                                  formData.industry === industry.value ? 'bg-purple-100 text-purple-700 font-bold border-2 border-purple-600' : 'text-gray-900 border-2 border-transparent'
                                }`}
                              >
                                {industry.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </BottomSheet>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center mt-4">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 mt-6 sm:mt-8">
                  <button
                    onClick={prevStep}
                    disabled={isSubmitting}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl font-semibold text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    Back
                  </button>
                  <button
                    onClick={handleStep4Next}
                    disabled={
                      isSubmitting ||
                      (userType === 'freelancer'
                        ? !formData.profession || (professions.includes(formData.profession) && formData.skills.length < 3)
                        : !formData.companyName || !formData.industry)
                    }
                    className="flex-1 px-5 sm:px-6 py-2.5 sm:py-3 text-white rounded-xl font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 accent-bg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Success */}
          {currentStep === 5 && (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-6 sm:py-8"
            >
              <div className="max-w-2xl w-full text-center bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-10 shadow-2xl">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                >
                  <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-5 sm:mb-8 rounded-full flex items-center justify-center accent-bg-10">
                    <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 accent-text" />
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
                    Welcome to Lowkey Gem! 🎉
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 mb-2 sm:mb-3">
                    Your account is now being verified
                  </p>
                  <p className="text-sm sm:text-base text-gray-600 mb-8 sm:mb-12">
                    We'll send you an email once your KYC verification is complete (usually within 24 hours)
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <button
                    onClick={onComplete}
                    className="px-8 sm:px-10 py-3 sm:py-4 text-white rounded-xl font-semibold text-base sm:text-lg hover:opacity-90 transition-opacity shadow-lg accent-bg"
                  >
                    {userType === 'freelancer' ? 'Explore Opportunities' : 'Browse Freelancers'}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
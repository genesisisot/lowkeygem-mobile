import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  Camera,
  Plus,
  MapPin,
  User,
  Briefcase,
  Tags,
  Search,
  ChevronDown,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { skillProfilesService } from '../services/profiles';
import { storageService } from '../services/storage';
import { useAuth } from '../hooks/useAuth';
import { CATEGORIES, CATEGORY_SKILLS as SUGGESTED_SKILLS } from '../lib/taxonomy';

interface AddSkillProfileProps {
  onClose: () => void;
  onProfileCreated: (profile: any) => void;
}

export function AddSkillProfile({ onClose, onProfileCreated }: AddSkillProfileProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    headline: '',
    category: '',
    bio: '',
    location: '',
    availability: 'Available Now',
    skills: [] as string[],
    portfolioImages: [] as string[],
    experience: [] as { title: string; company: string; duration: string }[],
  });
  const [newSkill, setNewSkill] = useState('');
  const [newExperience, setNewExperience] = useState({ title: '', company: '', duration: '' });

  // Category bottom sheet state
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // Success/Review state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleAddSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData({ ...formData, skills: [...formData.skills, skill] });
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const handleAddExperience = () => {
    if (newExperience.title && newExperience.company) {
      setFormData({
        ...formData,
        experience: [...formData.experience, { ...newExperience }]
      });
      setNewExperience({ title: '', company: '', duration: '' });
    }
  };

  const handleAddImage = () => {
    if (formData.portfolioImages.length < 6) {
      fileInputRef.current?.click();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const imageUrl = await storageService.uploadPortfolioImage(user.id, file);
      if (imageUrl) {
        setFormData({ ...formData, portfolioImages: [...formData.portfolioImages, imageUrl] });
      } else {
        alert('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = () => {
    // Show success modal first
    setShowSuccessModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!user?.id) {
      alert('You must be logged in to create a skill profile');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to Supabase
      const { data: savedProfile, error } = await skillProfilesService.create({
        freelancer_id: user.id,
        headline: formData.headline,
        category: formData.category,
        skills: formData.skills,
        bio: formData.bio,
        availability: formData.availability,
        portfolio_images: formData.portfolioImages,
        experience: formData.experience,
        status: 'active', // Default to active
      });

      if (error) {
        console.error('Error creating skill profile:', error);
        alert('Failed to create skill profile. Please try again.');
        return;
      }

      if (savedProfile) {
        // Transform to match the expected format in the parent component
        const transformedProfile = {
          ...savedProfile,
          portfolioImages: savedProfile.portfolio_images || [],
          createdDate: new Date(savedProfile.created_at),
          location: formData.location, // Location comes from form, not stored separately
        };
        onProfileCreated(transformedProfile);
      }
    } catch (err) {
      console.error('Error creating skill profile:', err);
      alert('Failed to create skill profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.headline && formData.category && formData.bio &&
                      formData.location && formData.skills.length >= 3 &&
                      formData.portfolioImages.length >= 1;

  const suggestedSkills = formData.category ? SUGGESTED_SKILLS[formData.category] || [] : [];

  // Filter categories based on search
  const filteredCategories = categorySearch
    ? CATEGORIES.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()))
    : CATEGORIES;

  return (
    <div className="bx" style={{ minHeight: '100%' }}>
      {/* sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bx-solid)', borderBottom: '1px solid var(--bx-line)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} className="bx-onb__x" style={{ width: 38, height: 38 }}><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <div style={{ fontWeight: 750, color: 'var(--bx-ink)', fontSize: 16 }}>Create skill profile</div>
          <div className="bx__sub" style={{ marginTop: 0 }}>Fill in the details so clients can find you</div>
        </div>
      </div>

      <div className="bx__wrap" style={{ paddingTop: 22, maxWidth: 1120 }}>
        <motion.div className="jb-form-grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Basics */}
          <div className="bx__tile">
            <div className="bx__t-head" style={{ marginBottom: 16 }}>
              <div className="bx__t-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User className="w-4 h-4" style={{ color: 'var(--bx-accent)' }} /> Basics</div>
            </div>
            <label className="bx-label">Professional headline *</label>
            <input className="jb-input" value={formData.headline} onChange={(e) => setFormData({ ...formData, headline: e.target.value })} placeholder="e.g. UI/UX Designer & Brand Strategist" />

            <label className="bx-label" style={{ marginTop: 16 }}>Category *</label>
            <div className="jb-filter">
              <button className={`jb-select ${formData.category ? '' : 'placeholder'}`} onClick={() => setShowCategorySheet((o) => !o)}>
                <span>{formData.category || 'Select or add a category'}</span>
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--bx-faint)' }} />
              </button>
              <AnimatePresence>
                {showCategorySheet && (
                  <>
                    <div onClick={() => { setShowCategorySheet(false); setCategorySearch(''); }} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <motion.div className="jb-menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
                      <div style={{ position: 'relative', padding: 4 }}>
                        <Search className="w-4 h-4" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--bx-faint)' }} />
                        <input className="jb-input" style={{ paddingLeft: 38 }} value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} placeholder="Search or type a new category…" />
                      </div>
                      {categorySearch && !CATEGORIES.some(c => c.toLowerCase() === categorySearch.toLowerCase()) && (
                        <button className="jb-menu__opt on" onClick={() => { setFormData({ ...formData, category: categorySearch, skills: [] }); setShowCategorySheet(false); setCategorySearch(''); }}>
                          + Add "{categorySearch}" as new category
                        </button>
                      )}
                      {filteredCategories.map((c) => (
                        <button key={c} className={`jb-menu__opt ${formData.category === c ? 'on' : ''}`} onClick={() => { setFormData({ ...formData, category: c, skills: [] }); setShowCategorySheet(false); setCategorySearch(''); }}>{c}</button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <label className="bx-label" style={{ marginTop: 16 }}>Bio *</label>
            <textarea className="jb-input" rows={5} style={{ resize: 'none' }} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Describe your experience, skills, and what makes you unique…" />
            <div className="bx-hint">{formData.bio.length} characters</div>
          </div>

          {/* Skills */}
          <div className="bx__tile">
            <div className="bx__t-head" style={{ marginBottom: 14 }}>
              <div className="bx__t-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Tags className="w-4 h-4" style={{ color: 'var(--bx-accent)' }} /> Skills you offer</div>
              <span className="bx__sub" style={{ marginTop: 0 }}>{formData.skills.length}/3 min</span>
            </div>

            {formData.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {formData.skills.map((s) => (
                  <button key={s} className="jb-skill on" onClick={() => handleRemoveSkill(s)}>{s} <X className="w-3 h-3" /></button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input className="jb-input" value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newSkill.trim()) { handleAddSkill(newSkill.trim()); setNewSkill(''); } } }}
                placeholder="Add a skill and press Enter" />
              <button onClick={() => { if (newSkill.trim()) { handleAddSkill(newSkill.trim()); setNewSkill(''); } }} disabled={!newSkill.trim()} className="dx__cta dx__cta--accent" style={{ padding: '10px 16px', opacity: newSkill.trim() ? 1 : 0.5 }}>Add</button>
            </div>

            <div className="bx__sub" style={{ marginBottom: 10 }}>
              {formData.category ? `Suggested for ${formData.category}` : 'Pick a category to see suggested skills'}
            </div>
            {suggestedSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {suggestedSkills.filter((s) => !formData.skills.includes(s)).map((s) => (
                  <button key={s} className="jb-skill" onClick={() => handleAddSkill(s)}><Plus className="w-3 h-3" /> {s}</button>
                ))}
              </div>
            )}
          </div>

          {/* About / availability */}
          <div className="bx__tile">
            <div className="bx__t-head" style={{ marginBottom: 16 }}>
              <div className="bx__t-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Briefcase className="w-4 h-4" style={{ color: 'var(--bx-accent)' }} /> Availability &amp; details</div>
            </div>

            <label className="bx-label">Availability *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Available Now', 'Available in 2 days', 'Available next week'].map((a) => (
                <button key={a} className={`jb-skill ${formData.availability === a ? 'on' : ''}`} onClick={() => setFormData({ ...formData, availability: a })}>{a}</button>
              ))}
            </div>

            <label className="bx-label" style={{ marginTop: 16 }}>Location *</label>
            <div style={{ position: 'relative' }}>
              <MapPin className="w-4 h-4" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--bx-faint)' }} />
              <input className="jb-input" style={{ paddingLeft: 40 }} value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Lagos, Nigeria" />
            </div>

            <label className="bx-label" style={{ marginTop: 16 }}>Experience (optional)</label>
            {formData.experience.map((exp, idx) => (
              <div key={idx} className="jb-foot" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', background: 'var(--bx-card-2)', border: '1px solid var(--bx-line)', borderRadius: 14, padding: '12px 14px', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--bx-ink)' }}>{exp.title}</div>
                  <div className="bx__sub" style={{ marginTop: 2 }}>{exp.company} · {exp.duration}</div>
                </div>
                <button onClick={() => setFormData({ ...formData, experience: formData.experience.filter((_, i) => i !== idx) })} className="bx-onb__x" style={{ width: 30, height: 30 }}><X className="w-4 h-4" /></button>
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
              <input className="jb-input" value={newExperience.title} onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })} placeholder="Job title" />
              <input className="jb-input" value={newExperience.company} onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })} placeholder="Company" />
              <input className="jb-input" value={newExperience.duration} onChange={(e) => setNewExperience({ ...newExperience, duration: e.target.value })} placeholder="Duration" />
            </div>
            <button onClick={handleAddExperience} className="jb-skill" style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}><Plus className="w-3.5 h-3.5" /> Add experience</button>
          </div>

          {/* Portfolio */}
          <div className="bx__tile">
            <div className="bx__t-head" style={{ marginBottom: 14 }}>
              <div className="bx__t-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Camera className="w-4 h-4" style={{ color: 'var(--bx-accent)' }} /> Portfolio</div>
              <span className="bx__sub" style={{ marginTop: 0 }}>{formData.portfolioImages.length} · 1 min</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {formData.portfolioImages.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group" style={{ border: '1px solid var(--bx-line)' }}>
                  <img src={img} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 accent-bg text-white text-xs px-2 py-1 rounded-full font-bold">Main</div>
                  )}
                  <motion.button
                    onClick={() => setFormData({ ...formData, portfolioImages: formData.portfolioImages.filter((_, i) => i !== index) })}
                    className="absolute top-2 right-2 p-1.5 sf-red-solid text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              ))}
              {formData.portfolioImages.length < 6 && (
                <motion.button
                  onClick={handleAddImage}
                  disabled={isUploadingImage}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ border: '2px dashed var(--bx-line)', background: 'var(--bx-card-2)', color: 'var(--bx-muted)' }}
                  whileHover={isUploadingImage ? {} : { scale: 1.02 }}
                  whileTap={isUploadingImage ? {} : { scale: 0.98 }}
                >
                  {isUploadingImage ? (
                    <><Loader2 className="w-8 h-8 animate-spin" /><span className="text-xs font-medium">Uploading…</span></>
                  ) : (
                    <><Camera className="w-8 h-8" /><span className="text-xs font-medium">Add Photo</span></>
                  )}
                </motion.button>
              )}
            </div>
            <div className="bx-hint" style={{ marginTop: 12 }}>The first image is your main profile picture clients see when swiping.</div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
        </motion.div>

        {/* Submit — scrolls with the page (clears the floating nav via wrap padding) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} className="jb-post"
            style={{ height: 54, width: '100%', maxWidth: 360, justifyContent: 'center', opacity: !isFormValid || isSubmitting ? 0.5 : 1, cursor: !isFormValid || isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating…</> : <><CheckCircle className="w-5 h-5" /> Submit for review</>}
          </button>
        </div>
      </div>

      {/* Success/Review Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl p-6 max-w-md w-full"
              style={{ background: 'var(--bx-solid)', border: '1px solid var(--bx-line)' }}
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 sf-amber rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 tx-amber" />
                </div>
                <h3 className="text-2xl font-bold tx-ink mb-2">Submitted for Review</h3>
                <p className="tx-soft">
                  Your skill profile has been submitted and will be reviewed by our team within 24-48 hours.
                </p>
              </div>

              <div className="sf-amber border bd-amber rounded-xl p-4 mb-6">
                <h4 className="font-semibold tx-amber mb-2">What happens next?</h4>
                <ul className="text-sm tx-amber space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="tx-amber font-bold">1.</span>
                    <span>Our team will verify your profile information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="tx-amber font-bold">2.</span>
                    <span>You'll receive a notification once approved</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="tx-amber font-bold">3.</span>
                    <span>Your profile will then be visible to clients</span>
                  </li>
                </ul>
              </div>

              <motion.button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="w-full py-3 accent-bg text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                whileHover={isSubmitting ? {} : { scale: 1.02 }}
                whileTap={isSubmitting ? {} : { scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Got it!'
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

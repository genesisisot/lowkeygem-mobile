import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Briefcase, DollarSign, Tags, CheckCircle, Loader2, X, ChevronDown, Plus, MapPin } from 'lucide-react';
import { jobsService } from '../services/jobs';
import { useAuth } from '../hooks/useAuth';
import { CATEGORIES as categories, CATEGORY_SKILLS as categorySkillsMap } from '../lib/taxonomy';

interface AddJobProps {
  onClose: () => void;
  onJobCreated: (job: any) => void;
}

const deadlineOptions = [
  { value: '3-days', label: '3 Days' },
  { value: '1-week', label: '1 Week' },
  { value: '2-weeks', label: '2 Weeks' },
  { value: '1-month', label: '1 Month' },
  { value: '2-months', label: '2 Months' },
  { value: 'flexible', label: 'Flexible' },
];

export function AddJob({ onClose, onJobCreated }: AddJobProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const [formData, setFormData] = useState({
    title: '', category: '', description: '', budget: '', deadline: '', location: '', skills: [] as string[],
  });

  const handleInputChange = (field: string, value: string) => {
    if (field === 'category') setFormData((p) => ({ ...p, category: value, skills: [] }));
    else setFormData((p) => ({ ...p, [field]: value }));
  };

  const availableSkills = formData.category ? categorySkillsMap[formData.category] || [] : [];
  const handleSkillAdd = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData((p) => ({ ...p, skills: [...p.skills, skill] }));
      setCustomSkill('');
    }
  };
  const handleSkillRemove = (skill: string) => setFormData((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));

  const getDeadlineDate = (opt: string): string => {
    const now = new Date();
    switch (opt) {
      case '3-days': now.setDate(now.getDate() + 3); break;
      case '1-week': now.setDate(now.getDate() + 7); break;
      case '2-weeks': now.setDate(now.getDate() + 14); break;
      case '1-month': now.setMonth(now.getMonth() + 1); break;
      case '2-months': now.setMonth(now.getMonth() + 2); break;
      case 'flexible': now.setMonth(now.getMonth() + 3); break;
      default: now.setMonth(now.getMonth() + 1);
    }
    return now.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (!user?.id) { alert('You must be logged in to post a job'); return; }
    setIsSubmitting(true);
    try {
      const jobData = {
        client_id: user.id,
        title: formData.title,
        category: formData.category,
        description: formData.description,
        budget: parseInt(formData.budget) || 0,
        deadline: getDeadlineDate(formData.deadline),
        required_skills: formData.skills,
        status: 'active' as const,
      };
      const { data: savedJob, error } = await jobsService.create(jobData);
      if (error) { alert(`Failed to post job: ${error.message || 'Unknown error'}`); return; }
      if (savedJob) { onJobCreated(savedJob); onClose(); }
    } catch (err: any) {
      alert(`Failed to post job: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title && formData.category && formData.description &&
    formData.budget && formData.deadline && formData.skills.length >= 3;

  return (
    <div className="bx" style={{ minHeight: '100%' }}>
      {/* sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bx-solid)', borderBottom: '1px solid var(--bx-line)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} className="bx-onb__x" style={{ width: 38, height: 38 }}><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <div style={{ fontWeight: 750, color: 'var(--bx-ink)', fontSize: 16 }}>Post a job</div>
          <div className="bx__sub" style={{ marginTop: 0 }}>Fill in the details to start matching</div>
        </div>
      </div>

      <div className="bx__wrap" style={{ paddingTop: 22, maxWidth: 1120 }}>
        <motion.div className="jb-form-grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Basics */}
          <div className="bx__tile span2">
            <div className="bx__t-head" style={{ marginBottom: 16 }}>
              <div className="bx__t-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Briefcase className="w-4 h-4" style={{ color: 'var(--bx-accent)' }} /> Basics</div>
            </div>
            <label className="bx-label">Job title *</label>
            <input className="jb-input" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="e.g. Mobile App UI/UX Designer" />

            <label className="bx-label" style={{ marginTop: 16 }}>Category *</label>
            <div className="jb-filter">
              <button className={`jb-select ${formData.category ? '' : 'placeholder'}`} onClick={() => setCatOpen((o) => !o)}>
                <span>{formData.category || 'Select a category'}</span>
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--bx-faint)' }} />
              </button>
              <AnimatePresence>
                {catOpen && (
                  <>
                    <div onClick={() => setCatOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <motion.div className="jb-menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
                      {categories.map((c) => (
                        <button key={c} className={`jb-menu__opt ${formData.category === c ? 'on' : ''}`} onClick={() => { handleInputChange('category', c); setCatOpen(false); }}>{c}</button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <label className="bx-label" style={{ marginTop: 16 }}>Description *</label>
            <textarea className="jb-input" rows={5} style={{ resize: 'none' }} value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Describe the project, deliverables, and what you're looking for…" />
            <div className="bx-hint">{formData.description.length} characters</div>
          </div>

          {/* Skills */}
          <div className="bx__tile">
            <div className="bx__t-head" style={{ marginBottom: 14 }}>
              <div className="bx__t-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Tags className="w-4 h-4" style={{ color: 'var(--bx-accent)' }} /> Required skills</div>
              <span className="bx__sub" style={{ marginTop: 0 }}>{formData.skills.length}/3 min</span>
            </div>

            {formData.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {formData.skills.map((s) => (
                  <button key={s} className="jb-skill on" onClick={() => handleSkillRemove(s)}>{s} <X className="w-3 h-3" /></button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input className="jb-input" value={customSkill} onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSkillAdd(customSkill); } }}
                placeholder="Add a skill and press Enter" />
              <button onClick={() => handleSkillAdd(customSkill)} disabled={!customSkill} className="dx__cta dx__cta--accent" style={{ padding: '10px 16px', opacity: customSkill ? 1 : 0.5 }}>Add</button>
            </div>

            <div className="bx__sub" style={{ marginBottom: 10 }}>
              {formData.category ? `Suggested for ${formData.category}` : 'Pick a category to see suggested skills'}
            </div>
            {availableSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {availableSkills.filter((s) => !formData.skills.includes(s)).map((s) => (
                  <button key={s} className="jb-skill" onClick={() => handleSkillAdd(s)}><Plus className="w-3 h-3" /> {s}</button>
                ))}
              </div>
            )}
          </div>

          {/* Budget & timeline */}
          <div className="bx__tile">
            <div className="bx__t-head" style={{ marginBottom: 16 }}>
              <div className="bx__t-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign className="w-4 h-4" style={{ color: 'var(--bx-accent)' }} /> Budget &amp; timeline</div>
            </div>
            <label className="bx-label">Budget (₦) *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'var(--bx-muted)', fontWeight: 700 }}>₦</span>
              <input className="jb-input" style={{ paddingLeft: 32 }} type="number" value={formData.budget} onChange={(e) => handleInputChange('budget', e.target.value)} placeholder="50000" />
            </div>

            <label className="bx-label" style={{ marginTop: 16 }}>Deadline *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {deadlineOptions.map((d) => (
                <button key={d.value} className={`jb-skill ${formData.deadline === d.value ? 'on' : ''}`} onClick={() => handleInputChange('deadline', d.value)}>{d.label}</button>
              ))}
            </div>

            <label className="bx-label" style={{ marginTop: 16 }}>Location (optional)</label>
            <div style={{ position: 'relative' }}>
              <MapPin className="w-4 h-4" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--bx-faint)' }} />
              <input className="jb-input" style={{ paddingLeft: 40 }} value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="e.g. Lagos, Nigeria or Remote" />
            </div>
          </div>
        </motion.div>

        {/* Submit — scrolls with the page (clears the floating nav via wrap padding) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} className="jb-post"
            style={{ height: 54, width: '100%', maxWidth: 360, justifyContent: 'center', opacity: !isFormValid || isSubmitting ? 0.5 : 1, cursor: !isFormValid || isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Posting…</> : <><CheckCircle className="w-5 h-5" /> Post job</>}
          </button>
        </div>
      </div>
    </div>
  );
}

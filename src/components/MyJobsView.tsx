import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Eye,
  Heart,
  MessageSquare,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Loader2,
  Search,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  category: string;
  budget: number;
  deadline: string;
  status: 'active' | 'filled' | 'paused';
  description: string;
  requiredSkills: string[];
  postedDate: Date;
  matches: number;
  proposals: number;
  views: number;
}

interface MyJobsViewProps {
  jobs: Job[];
  selectedJobId: string;
  onSelectJob: (jobId: string) => void;
  onPostNewJob: () => void;
  onUpdateJob?: (job: Job) => void;
  onDeleteJob?: (jobId: string) => void;
}

const FILTERS = ['all', 'active', 'paused', 'filled'] as const;
type Filter = (typeof FILTERS)[number];

export function MyJobsView({ jobs, selectedJobId, onSelectJob, onPostNewJob, onUpdateJob, onDeleteJob }: MyJobsViewProps) {
  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const [showDetail, setShowDetail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<Job | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteJob = async () => {
    if (!selectedJob || !onDeleteJob) return;
    setIsDeleting(true);
    try {
      await onDeleteJob(selectedJob.id);
      setShowDeleteModal(false);
      setShowDetail(false);
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const stripColor = (status: string) =>
    status === 'active' ? '#0f9d76' : status === 'paused' ? '#d98a00' : '#8a93a5';

  const getTimeAgo = (date: Date) => {
    const diffInDays = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diffInDays <= 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return `${Math.floor(diffInDays / 7)} weeks ago`;
  };

  const handleJobSelect = (jobId: string) => {
    onSelectJob(jobId);
    setIsEditing(false);
    setShowDetail(true);
  };
  const handleBackToList = () => { setShowDetail(false); setIsEditing(false); };
  const handleStartEdit = () => { if (selectedJob) { setEditedJob({ ...selectedJob }); setIsEditing(true); } };
  const handleSaveEdit = () => { if (editedJob && onUpdateJob) { onUpdateJob(editedJob); setIsEditing(false); } };
  const handleCancelEdit = () => { setEditedJob(null); setIsEditing(false); };
  const handleAddSkill = () => {
    if (newSkill.trim() && editedJob) {
      setEditedJob({ ...editedJob, requiredSkills: [...editedJob.requiredSkills, newSkill.trim()] });
      setNewSkill('');
    }
  };
  const handleRemoveSkill = (s: string) => {
    if (editedJob) setEditedJob({ ...editedJob, requiredSkills: editedJob.requiredSkills.filter((x) => x !== s) });
  };

  const currentJob = isEditing && editedJob ? editedJob : selectedJob;
  const q = query.trim().toLowerCase();
  const visible = jobs.filter((j) => {
    const statusOk = filter === 'all' || j.status === filter;
    const searchOk = !q || j.title.toLowerCase().includes(q) || j.category.toLowerCase().includes(q) || (j.description || '').toLowerCase().includes(q);
    return statusOk && searchOk;
  });
  const counts = {
    all: jobs.length,
    active: jobs.filter((j) => j.status === 'active').length,
    paused: jobs.filter((j) => j.status === 'paused').length,
    filled: jobs.filter((j) => j.status === 'filled').length,
  };
  const totalMatches = jobs.reduce((s, j) => s + (j.matches || 0), 0);
  const totalViews = jobs.reduce((s, j) => s + (j.views || 0), 0);
  const totalBudget = jobs.reduce((s, j) => s + (j.budget || 0), 0);

  return (
    <div className="bx" style={{ minHeight: '100%' }}>
      <div className="bx__wrap" style={{ paddingTop: 22, maxWidth: 1200 }}>
        {/* Header */}
        <motion.div className="bx__head" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <div className="bx__eyebrow">Client · Postings</div>
            <h1 className="bx__hi">My Jobs</h1>
            <div className="bx__sub">{jobs.length} job{jobs.length !== 1 ? 's' : ''} posted · {counts.active} active</div>
          </div>
        </motion.div>

        {/* Summary strip */}
        <motion.div className="jb-summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          {[
            { v: counts.active, l: 'Active', icon: Briefcase },
            { v: totalMatches, l: 'Matches', icon: Heart },
            { v: `₦${(totalBudget / 1000).toFixed(0)}k`, l: 'Budget posted', icon: null },
            { v: totalViews, l: 'Views', icon: Eye },
          ].map((s) => (
            <div key={s.l} className="jb-sum">
              <div className="jb-sum__v">{s.v}</div>
              <div className="jb-sum__l">{s.icon ? <s.icon className="w-3.5 h-3.5" /> : <span style={{ color: 'var(--bx-accent)', fontWeight: 800 }}>₦</span>} {s.l}</div>
            </div>
          ))}
        </motion.div>

        {/* Toolbar: search + filter + post */}
        <motion.div className="jb-toolbar" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="jb-search">
            <Search className="w-5 h-5" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your jobs…" />
          </div>
          <div className="jb-filter">
            <button className="jb-filterbtn" onClick={() => setFilterOpen((o) => !o)}>
              <SlidersHorizontal className="w-4 h-4" />
              <span className="cap">{filter === 'all' ? 'All' : filter}</span>
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--bx-faint)' }} />
            </button>
            <AnimatePresence>
              {filterOpen && (
                <>
                  <div onClick={() => setFilterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <motion.div className="jb-filter__menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                    {FILTERS.map((f) => (
                      <button key={f} className={`jb-filter__opt ${filter === f ? 'on' : ''}`} onClick={() => { setFilter(f); setFilterOpen(false); }}>
                        <span>{f === 'all' ? 'All jobs' : f}</span>
                        <span className="ct">{counts[f]}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button className="jb-post" onClick={onPostNewJob}>
            <Plus className="w-5 h-5" /> Post a job
          </button>
        </motion.div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="bx__tile" style={{ alignItems: 'center', textAlign: 'center', padding: 44 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, display: 'grid', placeItems: 'center', background: 'rgba(151,7,71,0.14)', color: 'var(--bx-accent)', margin: '0 auto 14px' }}>
              <Briefcase className="w-7 h-7" />
            </div>
            <div style={{ fontWeight: 750, fontSize: 17, color: 'var(--bx-ink)' }}>No {filter === 'all' ? '' : filter + ' '}jobs yet</div>
            <div className="bx__sub" style={{ marginBottom: 16 }}>Post a job to start matching with talent.</div>
            <button className="dx__cta dx__cta--accent" onClick={onPostNewJob} style={{ margin: '0 auto' }}>
              <Plus className="w-4 h-4" /> Post your first job
            </button>
          </div>
        ) : (
          <motion.div className="jb-list" initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}>
            {visible.map((job) => (
              <motion.button
                key={job.id}
                onClick={() => handleJobSelect(job.id)}
                className={`jb-card ${selectedJobId === job.id ? 'on' : ''}`}
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                whileTap={{ scale: 0.985 }}
              >
                <span className="jb-card__strip" style={{ background: stripColor(job.status) }} />
                <span className="jb-card__glow" />
                <div className="jb-top">
                  <span className={`jb-pill ${job.status}`}>{job.status}</span>
                  <span className="jb-chip">{job.category}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--bx-faint)', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {getTimeAgo(job.postedDate)} <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
                <div className="jb-title">{job.title}</div>
                <div className="jb-desc">{job.description}</div>
                <div className="jb-foot">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                    <span className="jb-budget">₦{job.budget.toLocaleString()}<small>budget</small></span>
                    <span className="jb-deadline"><Clock className="w-3.5 h-3.5" /> {job.deadline}</span>
                  </div>
                  <div className="jb-foot__stats">
                    <span className="jb-stat"><Heart className="w-4 h-4" style={{ color: 'var(--bx-accent)' }} /> {job.matches}</span>
                    <span className="jb-stat"><MessageSquare className="w-4 h-4" /> {job.proposals}</span>
                    <span className="jb-stat"><Eye className="w-4 h-4" /> {job.views}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Detail overlay */}
      <AnimatePresence>
        {showDetail && currentJob && (
          <motion.div
            className="bx"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            style={{ position: 'fixed', inset: 0, zIndex: 60, overflowY: 'auto', background: 'var(--bx-bg)' }}
          >
            {/* sticky header */}
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bx-solid)', borderBottom: '1px solid var(--bx-line)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <button onClick={handleBackToList} className="bx-onb__x" style={{ width: 36, height: 36 }}>
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span style={{ fontWeight: 750, color: 'var(--bx-ink)' }}>Job details</span>
              </div>
              {!isEditing ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowDeleteModal(true)} className="bx-onb__x" style={{ width: 36, height: 36, color: 'var(--bx-accent-3)' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={handleStartEdit} className="dx__cta dx__cta--accent" style={{ padding: '9px 16px' }}>Edit</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleCancelEdit} className="dx__cta" style={{ padding: '9px 14px', background: 'var(--bx-card-2)', color: 'var(--bx-ink)', boxShadow: 'none', border: '1px solid var(--bx-line)' }}>Cancel</button>
                  <button onClick={handleSaveEdit} className="dx__cta dx__cta--accent" style={{ padding: '9px 16px' }}>Save</button>
                </div>
              )}
            </div>

            <div className="bx__wrap" style={{ paddingTop: 20, maxWidth: 1120 }}>
              {/* title + meta */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span className={`jb-pill ${currentJob.status}`}>{currentJob.status}</span>
                  <span className="jb-chip">{currentJob.category}</span>
                  <span className="jb-chip" style={{ background: 'transparent', border: 'none' }}><Clock className="w-3.5 h-3.5" style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />Posted {getTimeAgo(currentJob.postedDate)}</span>
                </div>
                {isEditing ? (
                  <input className="jb-input" style={{ fontSize: 24, fontWeight: 800 }} value={editedJob?.title || ''}
                    onChange={(e) => setEditedJob((p) => p ? { ...p, title: e.target.value } : null)} placeholder="Job title" />
                ) : (
                  <h1 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 820, letterSpacing: '-0.03em', color: 'var(--bx-ink)', lineHeight: 1.05 }}>{currentJob.title}</h1>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                  <span className="jb-chip" style={{ fontSize: 14, padding: '8px 14px', color: 'var(--bx-accent)', background: 'rgba(151,7,71,0.12)', borderColor: 'transparent', fontWeight: 800 }}>
                    {isEditing ? (
                      <>₦<input type="number" value={editedJob?.budget || ''} onChange={(e) => setEditedJob((p) => p ? { ...p, budget: parseInt(e.target.value) || 0 } : null)} style={{ width: 110, background: 'transparent', border: 'none', outline: 'none', color: 'inherit', fontWeight: 800 }} /></>
                    ) : <>₦{currentJob.budget.toLocaleString()}</>}
                  </span>
                  <span className="jb-chip" style={{ fontSize: 14, padding: '8px 14px' }}><Clock className="w-4 h-4" style={{ display: 'inline', verticalAlign: '-3px', marginRight: 5 }} />{currentJob.deadline}</span>
                </div>
              </div>

              {/* stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
                {[
                  { label: 'Matches', value: currentJob.matches, icon: Heart, accent: true },
                  { label: 'Proposals', value: currentJob.proposals, icon: MessageSquare, accent: false },
                  { label: 'Views', value: currentJob.views, icon: Eye, accent: false },
                ].map((s) => (
                  <div key={s.label} className="jb-statcard">
                    <div className="jb-statcard__ic" style={{ background: s.accent ? 'rgba(151,7,71,0.14)' : 'var(--bx-card-2)', color: s.accent ? 'var(--bx-accent)' : 'var(--bx-muted)' }}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div className="jb-statcard__v">{s.value}</div>
                    <div className="jb-statcard__l">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* description */}
              <div className="bx__tile" style={{ marginBottom: 16 }}>
                <div className="bx__t-title" style={{ marginBottom: 10 }}>Job description</div>
                {isEditing ? (
                  <textarea className="jb-input" rows={4} style={{ resize: 'none' }} value={editedJob?.description || ''}
                    onChange={(e) => setEditedJob((p) => p ? { ...p, description: e.target.value } : null)} placeholder="Describe the role…" />
                ) : (
                  <p style={{ color: 'var(--bx-ink-soft)', lineHeight: 1.65, fontSize: 14.5 }}>{currentJob.description}</p>
                )}
              </div>

              {/* skills */}
              <div className="bx__tile" style={{ marginBottom: 16 }}>
                <div className="bx__t-title" style={{ marginBottom: 12 }}>Required skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: isEditing ? 12 : 0 }}>
                  {(isEditing ? editedJob?.requiredSkills : currentJob.requiredSkills)?.map((skill, i) => (
                    <span key={i} className="jb-chip" style={{ color: 'var(--bx-accent)', background: 'rgba(151,7,71,0.12)', borderColor: 'transparent', fontSize: 13, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {skill}
                      {isEditing && <button onClick={() => handleRemoveSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}><X className="w-3 h-3" /></button>}
                    </span>
                  ))}
                  {(!currentJob.requiredSkills || currentJob.requiredSkills.length === 0) && !isEditing && (
                    <span className="bx__sub">No specific skills listed.</span>
                  )}
                </div>
                {isEditing && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="jb-input" value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()} placeholder="Add a skill…" />
                    <button onClick={handleAddSkill} className="dx__cta dx__cta--accent" style={{ padding: '10px 16px' }}>Add</button>
                  </div>
                )}
              </div>

              {/* status toggle (edit) */}
              {isEditing && (
                <div className="bx__tile" style={{ marginBottom: 16 }}>
                  <div className="bx__t-title" style={{ marginBottom: 12 }}>Status</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['active', 'paused', 'filled'] as const).map((st) => (
                      <button key={st} onClick={() => setEditedJob((p) => p ? { ...p, status: st } : null)}
                        className={`jb-pill ${st}`} style={{ flex: 1, padding: '12px', fontSize: 13, cursor: 'pointer', border: editedJob?.status === st ? '2px solid currentColor' : '2px solid transparent', textTransform: 'capitalize' }}>
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* actions */}
              {!isEditing && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, paddingBottom: 110 }}>
                  <button className="dx__cta dx__cta--accent" style={{ justifyContent: 'center', padding: '14px' }}>
                    <Heart className="w-5 h-5" /> View matches
                  </button>
                  <button onClick={handleStartEdit} className="dx__cta" style={{ justifyContent: 'center', padding: '14px', background: 'var(--bx-card)', color: 'var(--bx-ink)', border: '1px solid var(--bx-line)', boxShadow: 'var(--bx-shadow)' }}>
                    Edit job <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="bx"
              style={{ background: 'var(--bx-solid)', borderRadius: 22, padding: 26, maxWidth: 380, width: '100%', border: '1px solid var(--bx-line)', boxShadow: 'var(--bx-shadow-lg)' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 60, height: 60, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'rgba(225,29,107,0.14)', color: 'var(--bx-accent-3)', margin: '0 auto 14px' }}>
                  <Trash2 className="w-7 h-7" />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 19, color: 'var(--bx-ink)' }}>Delete job?</h3>
                <p className="bx__sub">This permanently deletes “{selectedJob?.title}”. This can’t be undone.</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="dx__cta"
                  style={{ flex: 1, justifyContent: 'center', background: 'var(--bx-card-2)', color: 'var(--bx-ink)', border: '1px solid var(--bx-line)', boxShadow: 'none' }}>Cancel</button>
                <button onClick={handleDeleteJob} disabled={isDeleting} className="dx__cta"
                  style={{ flex: 1, justifyContent: 'center', background: 'var(--bx-accent-3)', color: '#fff' }}>
                  {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Eye,
  Heart,
  MessageSquare,
  Plus,
  Check,
  Clock,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  SlidersHorizontal,
  Sparkles,
  Search,
  Star,
  User,
  Camera,
  X,
  Trash2,
  Loader2
} from 'lucide-react';
import { storageService } from '../services/storage';
import { skillProfilesService } from '../services/profiles';
import { CATEGORIES } from '../lib/taxonomy';

interface SkillProfile {
  id: string;
  headline: string;
  category: string;
  skills: string[];
  bio: string;
  location: string;
  availability: string;
  age: number;
  portfolioImages: string[];
  experience: { title: string; company: string; duration: string }[];
  status: 'active' | 'paused' | 'pending_review';
  createdDate: Date;
  // Stats
  views: number;
  interests: number;
  matches: number;
}

interface MySkillsViewProps {
  skillProfiles: SkillProfile[];
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onAddNewProfile: () => void;
  onUpdateProfile: (profile: SkillProfile) => void;
  onDeleteProfile?: (profileId: string) => void;
  userId?: string;
}

export function MySkillsView({
  skillProfiles,
  selectedProfileId,
  onSelectProfile,
  onAddNewProfile,
  onUpdateProfile,
  onDeleteProfile,
  userId
}: MySkillsViewProps) {
  const selectedProfile = skillProfiles.find(p => p.id === selectedProfileId);
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<SkillProfile | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'pending_review'>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  // Experience modal state
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [newExperience, setNewExperience] = useState({ title: '', company: '', duration: '' });

  // Portfolio image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // File input ref for image upload
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDeleteProfile = async () => {
    if (!selectedProfile || !onDeleteProfile) return;
    setIsDeleting(true);
    try {
      await onDeleteProfile(selectedProfile.id);
      setShowDeleteModal(false);
      setShowDetailOnMobile(false);
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Failed to delete profile. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddExperience = () => {
    if (newExperience.title.trim() && newExperience.company.trim() && editedProfile) {
      setEditedProfile({
        ...editedProfile,
        experience: [...editedProfile.experience, { ...newExperience }]
      });
      setNewExperience({ title: '', company: '', duration: '' });
      setShowExperienceModal(false);
    }
  };

  const handleRemoveExperience = (index: number) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        experience: editedProfile.experience.filter((_, i) => i !== index)
      });
    }
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editedProfile) return;

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
      let imageUrl: string;

      // Upload to Supabase Storage if userId is available
      if (userId) {
        const uploadedUrl = await storageService.uploadPortfolioImage(userId, file);
        if (!uploadedUrl) {
          throw new Error('Failed to upload image');
        }
        imageUrl = uploadedUrl;
      } else {
        // Fallback to local preview URL if no userId
        imageUrl = URL.createObjectURL(file);
      }

      setEditedProfile({
        ...editedProfile,
        portfolioImages: [...editedProfile.portfolioImages, imageUrl]
      });
      setShowImageModal(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePortfolioImage = (index: number) => {
    if (editedProfile && editedProfile.portfolioImages.length > 1) {
      setEditedProfile({
        ...editedProfile,
        portfolioImages: editedProfile.portfolioImages.filter((_, i) => i !== index)
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'sf-green tx-green';
      case 'paused': return 'sf-amber tx-amber';
      case 'pending_review': return 'sf-amber tx-amber';
      default: return 'sf-card2 tx-soft';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'paused': return 'Paused';
      case 'pending_review': return 'Under Review';
      default: return status;
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return `${Math.floor(diffInDays / 7)} weeks ago`;
  };

  const handleProfileSelect = (profileId: string) => {
    onSelectProfile(profileId);
    setShowDetailOnMobile(true);
    setIsEditing(false);
  };

  const handleBackToList = () => {
    setShowDetailOnMobile(false);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    if (selectedProfile) {
      setEditedProfile({ ...selectedProfile });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editedProfile) return;

    setIsSaving(true);
    try {
      // Persist to Supabase
      const { data, error } = await skillProfilesService.update(editedProfile.id, {
        headline: editedProfile.headline,
        category: editedProfile.category,
        skills: editedProfile.skills,
        bio: editedProfile.bio,
        availability: editedProfile.availability,
        portfolio_images: editedProfile.portfolioImages,
        experience: editedProfile.experience,
        status: editedProfile.status,
      });

      if (error) {
        console.error('Error saving skill profile:', error);
        alert('Failed to save changes. Please try again.');
        return;
      }

      // Update local state
      onUpdateProfile(editedProfile);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving skill profile:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(null);
    setIsEditing(false);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && editedProfile) {
      setEditedProfile({
        ...editedProfile,
        skills: [...editedProfile.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        skills: editedProfile.skills.filter(s => s !== skillToRemove)
      });
    }
  };

  const currentProfile = isEditing && editedProfile ? editedProfile : selectedProfile;

  const pillClass = (status: string) => (status === 'active' ? 'active' : status === 'filled' ? 'filled' : 'paused');
  const stripColor = (status: string) => (status === 'active' ? '#0f9d76' : status === 'filled' ? '#8a93a5' : '#d98a00');
  const q = query.trim().toLowerCase();
  const FILTERS = ['all', 'active', 'paused', 'pending_review'] as const;
  const filterLabel = (f: string) => (f === 'all' ? 'All profiles' : f === 'pending_review' ? 'Under Review' : f === 'active' ? 'Active' : 'Paused');
  const counts = {
    all: skillProfiles.length,
    active: skillProfiles.filter((p) => p.status === 'active').length,
    paused: skillProfiles.filter((p) => p.status === 'paused').length,
    pending_review: skillProfiles.filter((p) => p.status === 'pending_review').length,
  };
  const visible = skillProfiles.filter((p) => {
    const statusOk = filter === 'all' || p.status === filter;
    const searchOk = !q || p.headline.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) ||
      (p.skills || []).some((s) => s.toLowerCase().includes(q));
    return statusOk && searchOk;
  });
  const totals = {
    active: skillProfiles.filter(p => p.status === 'active').length,
    interests: skillProfiles.reduce((s, p) => s + (p.interests || 0), 0),
    matches: skillProfiles.reduce((s, p) => s + (p.matches || 0), 0),
    views: skillProfiles.reduce((s, p) => s + (p.views || 0), 0),
  };

  return (
    <div className="bx" style={{ minHeight: '100%' }}>
      <div className="bx__wrap" style={{ paddingTop: 22, maxWidth: 1200 }}>
        {/* Header */}
        <motion.div className="bx__head" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <div className="bx__eyebrow">Freelancer · Skill Profiles</div>
            <h1 className="bx__hi">My Skills</h1>
            <div className="bx__sub">{skillProfiles.length} skill profile{skillProfiles.length !== 1 ? 's' : ''} · swap to attract different clients</div>
          </div>
        </motion.div>

        {/* Summary strip */}
        <motion.div className="jb-summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          {[
            { v: totals.active, l: 'Active', icon: Sparkles },
            { v: totals.interests, l: 'Interests', icon: Heart },
            { v: totals.matches, l: 'Matches', icon: MessageSquare },
            { v: totals.views, l: 'Views', icon: Eye },
          ].map((s) => (
            <div key={s.l} className="jb-sum">
              <div className="jb-sum__v">{s.v}</div>
              <div className="jb-sum__l"><s.icon className="w-3.5 h-3.5" /> {s.l}</div>
            </div>
          ))}
        </motion.div>

        {/* Toolbar: search + filter + new profile (mirrors client My Jobs) */}
        <motion.div className="jb-toolbar" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="jb-search">
            <Search className="w-5 h-5" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your skill profiles…" />
          </div>
          <div className="jb-filter">
            <button className="jb-filterbtn" onClick={() => setFilterOpen((o) => !o)}>
              <SlidersHorizontal className="w-4 h-4" />
              <span className="cap">{filter === 'all' ? 'All' : filterLabel(filter)}</span>
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--bx-faint)' }} />
            </button>
            <AnimatePresence>
              {filterOpen && (
                <>
                  <div onClick={() => setFilterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <motion.div className="jb-filter__menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                    {FILTERS.map((f) => (
                      <button key={f} className={`jb-filter__opt ${filter === f ? 'on' : ''}`} onClick={() => { setFilter(f); setFilterOpen(false); }}>
                        <span>{filterLabel(f)}</span>
                        <span className="ct">{counts[f]}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button className="jb-post" onClick={onAddNewProfile}>
            <Plus className="w-5 h-5" /> New skill profile
          </button>
        </motion.div>

        {/* List */}
        {skillProfiles.length === 0 ? (
          <div className="bx__tile" style={{ alignItems: 'center', textAlign: 'center', padding: 44 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, display: 'grid', placeItems: 'center', background: 'rgba(var(--bx-accent-rgb),0.14)', color: 'var(--bx-accent)', margin: '0 auto 14px' }}>
              <Sparkles className="w-7 h-7" />
            </div>
            <div style={{ fontWeight: 750, fontSize: 17, color: 'var(--bx-ink)' }}>No skill profiles yet</div>
            <div className="bx__sub" style={{ marginBottom: 16 }}>Create a profile so clients can discover you.</div>
            <button className="dx__cta dx__cta--accent" onClick={onAddNewProfile} style={{ margin: '0 auto' }}>
              <Plus className="w-4 h-4" /> Create your first profile
            </button>
          </div>
        ) : (
          <motion.div className="jb-list" initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}>
            {visible.length === 0 && (
              <div className="bx__empty" style={{ gridColumn: '1 / -1' }}>No profiles match “{query}”.</div>
            )}
            {visible.map((profile) => (
              <motion.button
                key={profile.id}
                onClick={() => handleProfileSelect(profile.id)}
                className={`jb-card ${selectedProfileId === profile.id ? 'on' : ''}`}
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                whileTap={{ scale: 0.985 }}
              >
                <span className="jb-card__strip" style={{ background: stripColor(profile.status) }} />
                <span className="jb-card__glow" />
                <div className="jb-top">
                  <span className={`jb-pill ${pillClass(profile.status)}`}>{getStatusLabel(profile.status)}</span>
                  <span className="jb-chip">{profile.category}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--bx-faint)', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
                <div className="jb-title">{profile.headline}</div>
                <div className="jb-desc">{profile.skills.slice(0, 5).join(' · ')}</div>
                <div className="jb-foot">
                  <div className="jb-foot__stats">
                    <span className="jb-stat"><Heart className="w-4 h-4" style={{ color: 'var(--bx-accent)' }} /> {profile.interests}</span>
                    <span className="jb-stat"><MessageSquare className="w-4 h-4" /> {profile.matches}</span>
                    <span className="jb-stat"><Eye className="w-4 h-4" /> {profile.views}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Profile Details - full-screen sliding overlay (matches My Jobs) */}
      <AnimatePresence>
        {showDetailOnMobile && currentProfile && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="bx"
            style={{ position: 'fixed', inset: 0, zIndex: 60, overflowY: 'auto', background: 'var(--bx-bg)' }}
          >
            {/* Mobile Header with Back Button */}
            <div className="lg:hidden sticky top-0 z-10 sf-card border-b bd-line px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={handleBackToList}
                  className="p-2 hover-card2 rounded-full transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-6 h-6 tx-ink" />
                </motion.button>
                <h3 className="font-bold tx-ink truncate">Skill Profile</h3>
              </div>
              {!isEditing ? (
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 border bd-red tx-red rounded-xl"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    onClick={handleStartEdit}
                    className="px-4 py-2 accent-bg text-white rounded-xl font-bold text-sm"
                    whileTap={{ scale: 0.95 }}
                  >
                    Edit
                  </motion.button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-3 py-2 border bd-line tx-soft rounded-xl font-bold text-sm disabled:opacity-50"
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-3 py-2 accent-bg text-white rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </motion.button>
                </div>
              )}
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex sticky top-0 z-10 sf-card border-b bd-line px-6 py-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={handleBackToList}
                  className="p-2 hover-card2 rounded-full transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-6 h-6 tx-ink" />
                </motion.button>
                <h3 className="font-bold text-xl tx-ink">Skill Profile Details</h3>
              </div>
              {!isEditing ? (
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 border bd-red tx-red rounded-xl font-bold text-sm flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </motion.button>
                  <motion.button
                    onClick={handleStartEdit}
                    className="px-4 py-2 accent-bg text-white rounded-xl font-bold text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Edit Profile
                  </motion.button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-4 py-2 border bd-line tx-soft rounded-xl font-bold text-sm disabled:opacity-50"
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-4 py-2 accent-bg text-white rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </motion.button>
                </div>
              )}
            </div>

            {/* Profile Details Content */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8" style={{ paddingBottom: '120px' }}>
              <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 sm:mb-6"
                >
                  <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile?.headline || ''}
                          onChange={(e) => setEditedProfile(prev => prev ? { ...prev, headline: e.target.value } : null)}
                          className="text-xl sm:text-2xl lg:text-3xl font-bold tx-ink mb-2 w-full px-3 py-2 border bd-line rounded-xl accent-focus-ring"
                          placeholder="Your headline"
                        />
                      ) : (
                        <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold tx-ink mb-2 leading-tight">
                          {currentProfile.headline}
                        </h1>
                      )}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm tx-soft">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {isEditing ? (
                            <select
                              value={editedProfile?.category || ''}
                              onChange={(e) => setEditedProfile(prev => prev ? { ...prev, category: e.target.value } : null)}
                              className="px-2 py-1 border bd-line rounded-lg text-sm accent-focus-ring"
                            >
                              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          ) : (
                            <span>{currentProfile.category}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Created {getTimeAgo(currentProfile.createdDate)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold flex-shrink-0 ${getStatusColor(currentProfile.status)}`}>
                      {getStatusLabel(currentProfile.status)}
                    </span>
                  </div>

                  {/* Location & Availability */}
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sf-card2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 tx-soft" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile?.location || ''}
                          onChange={(e) => setEditedProfile(prev => prev ? { ...prev, location: e.target.value } : null)}
                          className="bg-transparent font-medium tx-soft text-sm sm:text-base w-32 focus:outline-none"
                          placeholder="Location"
                        />
                      ) : (
                        <span className="font-medium tx-soft text-sm sm:text-base">{currentProfile.location}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sf-green px-3 sm:px-4 py-2 sm:py-2.5 rounded-full">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 tx-green" />
                      {isEditing ? (
                        <select
                          value={editedProfile?.availability || ''}
                          onChange={(e) => setEditedProfile(prev => prev ? { ...prev, availability: e.target.value } : null)}
                          className="bg-transparent font-medium tx-green text-sm sm:text-base focus:outline-none"
                        >
                          <option value="Available Now">Available Now</option>
                          <option value="Available in 2 days">Available in 2 days</option>
                          <option value="Available next week">Available next week</option>
                          <option value="Not available">Not available</option>
                        </select>
                      ) : (
                        <span className="font-medium tx-green text-sm sm:text-base">{currentProfile.availability}</span>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-5 sm:mb-6"
                >
                  {[
                    { label: 'Interests', value: currentProfile.interests, icon: Heart, color: 'var(--bx-accent)' },
                    { label: 'Matches', value: currentProfile.matches, icon: MessageSquare, color: 'gray' },
                    { label: 'Views', value: currentProfile.views, icon: Eye, color: 'gray' },
                  ].map((stat) => (
                    <div key={stat.label} className="sf-card rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border bd-line">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg ${stat.color === 'var(--bx-accent)' ? 'accent-bg-10' : 'sf-card2'} flex items-center justify-center mb-2`}>
                        <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${stat.color === 'var(--bx-accent)' ? 'accent-text' : 'tx-soft'}`} />
                      </div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold tx-ink mb-0.5">{stat.value}</div>
                      <div className="text-xs sm:text-sm tx-soft">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>

                {/* Portfolio Images */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="sf-card rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border bd-line mb-4 sm:mb-5 lg:mb-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-bold tx-ink">Portfolio Images</h3>
                    {isEditing && (
                      <motion.button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 accent-bg-10 accent-text rounded-full"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Plus className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>
                  <p className="text-sm tx-soft mb-4">These images appear on your card when clients swipe.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {currentProfile.portfolioImages.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img
                          src={img}
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === 0 && (
                          <div className="absolute top-2 left-2 accent-bg text-white text-xs px-2 py-1 rounded-full font-bold">
                            Main
                          </div>
                        )}
                        {isEditing && currentProfile.portfolioImages.length > 1 && (
                          <motion.button
                            onClick={() => handleRemovePortfolioImage(index)}
                            className="absolute top-2 right-2 p-1.5 sf-red-solid text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            whileTap={{ scale: 0.9 }}
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    ))}
                    {isEditing && currentProfile.portfolioImages.length < 6 && (
                      <motion.button
                        onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                          isUploadingImage
                            ? 'bd-line tx-faint cursor-not-allowed'
                            : 'bd-line tx-muted accent-hover-border accent-hover-text'
                        }`}
                        whileHover={isUploadingImage ? {} : { scale: 1.02 }}
                        whileTap={isUploadingImage ? {} : { scale: 0.98 }}
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-xs font-medium">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-8 h-8" />
                            <span className="text-xs font-medium">Add</span>
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>

                {/* Bio */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="sf-card rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border bd-line mb-4 sm:mb-5 lg:mb-6"
                >
                  <h3 className="text-base sm:text-lg font-bold tx-ink mb-2 sm:mb-3">Bio</h3>
                  {isEditing ? (
                    <textarea
                      value={editedProfile?.bio || ''}
                      onChange={(e) => setEditedProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                      rows={4}
                      className="w-full px-4 py-3 border bd-line rounded-xl accent-focus-ring resize-none"
                      placeholder="Describe yourself and what you offer..."
                    />
                  ) : (
                    <p className="text-sm sm:text-base tx-soft leading-relaxed">{currentProfile.bio}</p>
                  )}
                </motion.div>

                {/* Skills */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="sf-card rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border bd-line mb-4 sm:mb-5 lg:mb-6"
                >
                  <h3 className="text-base sm:text-lg font-bold tx-ink mb-2 sm:mb-3">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(isEditing ? editedProfile?.skills : currentProfile.skills)?.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 accent-bg-10 accent-text rounded-full text-xs sm:text-sm font-medium flex items-center gap-2"
                      >
                        {skill}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="hover-red"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                        placeholder="Add a skill..."
                        className="flex-1 px-4 py-2 border bd-line rounded-xl accent-focus-ring text-sm"
                      />
                      <motion.button
                        onClick={handleAddSkill}
                        className="px-4 py-2 accent-bg text-white rounded-xl font-bold text-sm"
                        whileTap={{ scale: 0.95 }}
                      >
                        Add
                      </motion.button>
                    </div>
                  )}
                </motion.div>

                {/* Experience */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="sf-card rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border bd-line mb-4 sm:mb-5 lg:mb-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-bold tx-ink">Experience</h3>
                    {isEditing && (
                      <motion.button
                        onClick={() => setShowExperienceModal(true)}
                        className="p-2 accent-bg-10 accent-text rounded-full"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Plus className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {currentProfile.experience.map((exp, index) => (
                      <div key={index} className="p-4 sf-card2 rounded-xl flex items-start justify-between group">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 accent-bg/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-5 h-5 accent-text" />
                          </div>
                          <div>
                            <div className="font-bold tx-ink">{exp.title}</div>
                            <div className="text-sm tx-soft">{exp.company}</div>
                            <div className="text-xs tx-muted mt-1">{exp.duration}</div>
                          </div>
                        </div>
                        {isEditing && (
                          <motion.button
                            onClick={() => handleRemoveExperience(index)}
                            className="p-2 tx-faint hover-red opacity-0 group-hover:opacity-100 transition-all"
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Status Toggle */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="sf-card rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border bd-line pb-8"
                  >
                    <h3 className="text-base sm:text-lg font-bold tx-ink mb-3">Profile Status</h3>
                    <div className="flex gap-3">
                      <motion.button
                        onClick={() => setEditedProfile(prev => prev ? { ...prev, status: 'active' } : null)}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                          editedProfile?.status === 'active'
                            ? 'sf-green tx-green border-2 bd-green'
                            : 'sf-card2 tx-soft border-2 border-transparent'
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        Active
                      </motion.button>
                      <motion.button
                        onClick={() => setEditedProfile(prev => prev ? { ...prev, status: 'paused' } : null)}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                          editedProfile?.status === 'paused'
                            ? 'sf-amber tx-amber border-2 bd-amber'
                            : 'sf-card2 tx-soft border-2 border-transparent'
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        Paused
                      </motion.button>
                    </div>
                    <p className="text-xs tx-muted mt-2">
                      Pausing hides this profile from clients. Only one profile can be active at a time.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Empty State */}
      {!selectedProfile && (
        <div className="hidden lg:flex flex-1 items-center justify-center p-6 text-center">
          <div>
            <div className="w-20 h-20 sf-card2 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-10 h-10 tx-faint" />
            </div>
            <h3 className="text-xl font-bold tx-ink mb-2">Select a Skill Profile</h3>
            <p className="tx-soft text-sm">Choose a profile from the list to view and edit</p>
          </div>
        </div>
      )}

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Experience Modal */}
      <AnimatePresence>
        {showExperienceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowExperienceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="sf-card rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold tx-ink">Add Experience</h3>
                <button
                  onClick={() => setShowExperienceModal(false)}
                  className="p-2 hover-card2 rounded-full"
                >
                  <X className="w-5 h-5 tx-soft" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium tx-soft mb-1">Job Title</label>
                  <input
                    type="text"
                    value={newExperience.title}
                    onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                    placeholder="e.g., Senior UI Designer"
                    className="w-full px-4 py-3 border bd-line rounded-xl accent-focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium tx-soft mb-1">Company</label>
                  <input
                    type="text"
                    value={newExperience.company}
                    onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                    placeholder="e.g., Design Agency Ltd"
                    className="w-full px-4 py-3 border bd-line rounded-xl accent-focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium tx-soft mb-1">Duration</label>
                  <input
                    type="text"
                    value={newExperience.duration}
                    onChange={(e) => setNewExperience({ ...newExperience, duration: e.target.value })}
                    placeholder="e.g., 2021 - Present"
                    className="w-full px-4 py-3 border bd-line rounded-xl accent-focus-ring"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={() => setShowExperienceModal(false)}
                  className="flex-1 py-3 border bd-line tx-soft rounded-xl font-bold"
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleAddExperience}
                  disabled={!newExperience.title.trim() || !newExperience.company.trim()}
                  className="flex-1 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed accent-bg text-white"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Add Experience
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="sf-card rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 sf-red rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 tx-red" />
                </div>
                <h3 className="text-xl font-bold tx-ink mb-2">Delete Skill Profile?</h3>
                <p className="tx-soft text-sm">
                  This will permanently delete "{selectedProfile?.headline}". This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 border bd-line tx-soft rounded-xl font-bold disabled:opacity-50"
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleDeleteProfile}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

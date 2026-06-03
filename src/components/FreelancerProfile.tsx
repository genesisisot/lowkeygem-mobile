import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Save,
  User,
  Edit2,
  Camera,
  X,
  MapPin,
  Loader2,
  Upload
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { storageService } from '../services/storage';

interface FreelancerProfileProps {
  onBack: () => void;
  onProfileUpdated?: () => void;
}

export function FreelancerProfile({ onBack, onProfileUpdated }: FreelancerProfileProps) {
  const { user, profile: authProfile, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    profileImage: '',
  });

  const [tempFormData, setTempFormData] = useState(formData);

  // Initialize form data from auth profile
  useEffect(() => {
    if (authProfile) {
      const initialData = {
        name: authProfile.full_name || '',
        bio: authProfile.bio || '',
        location: authProfile.location || '',
        profileImage: authProfile.avatar_url || '',
      };
      setFormData(initialData);
      setTempFormData(initialData);
    }
  }, [authProfile]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

      if (user?.id) {
        const uploadedUrl = await storageService.uploadAvatar(user.id, file);
        if (!uploadedUrl) {
          throw new Error('Failed to upload image');
        }
        imageUrl = uploadedUrl;
      } else {
        // Fallback to local preview if no user
        imageUrl = URL.createObjectURL(file);
      }

      setTempFormData({ ...tempFormData, profileImage: imageUrl });
      setShowImagePicker(false);
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

  const handleRemoveImage = () => {
    setTempFormData({ ...tempFormData, profileImage: '' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await updateProfile({
        full_name: tempFormData.name,
        bio: tempFormData.bio,
        location: tempFormData.location,
        avatar_url: tempFormData.profileImage || null,
      });

      if (!error) {
        setFormData(tempFormData);
        setIsEditing(false);
        // Notify parent that profile was updated
        onProfileUpdated?.();
      } else {
        console.error('Error saving profile:', error);
        const errorMessage = error?.message || 'Unknown error occurred';
        alert(`Failed to save profile: ${errorMessage}\n\nPlease check your internet connection and try again.`);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      alert(`Failed to save profile: ${errorMessage}\n\nPlease check your internet connection and try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempFormData(formData);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="bx" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Loader2 className="w-8 h-8" style={{ animation: 'spin 1s linear infinite', color: 'var(--bx-accent)' }} />
      </div>
    );
  }

  const renderEditButtons = () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <motion.button
        onClick={handleCancel}
        disabled={isSaving}
        whileTap={{ scale: 0.95 }}
        style={{
          padding: '9px 14px', borderRadius: 13, border: '1px solid var(--bx-line)',
          background: 'var(--bx-card-2)', color: 'var(--bx-ink)',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          opacity: isSaving ? 0.5 : 1,
        }}
      >
        Cancel
      </motion.button>
      <motion.button
        onClick={handleSave}
        disabled={isSaving}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        style={{
          padding: '9px 16px', borderRadius: 13, border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: 13, color: '#fff',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(120deg, var(--bx-accent), var(--bx-accent-2))',
          boxShadow: 'var(--bx-glow)',
          opacity: isSaving ? 0.5 : 1,
        }}
      >
        {isSaving ? (
          <><Loader2 className="w-4 h-4" style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
        ) : (
          <><Save className="w-4 h-4" /> Save</>
        )}
      </motion.button>
    </div>
  );

  return (
    <div className="bx" style={{ minHeight: '100%' }}>
      <div className="bx__wrap" style={{ paddingTop: 22, maxWidth: 1200 }}>
        <motion.div className="bx__head" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <div className="bx__eyebrow">Freelancer · Profile</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.button
                onClick={onBack}
                whileTap={{ scale: 0.9 }}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: 'grid', placeItems: 'center', flex: 'none',
                  border: '1px solid var(--bx-line)',
                  background: 'var(--bx-card-2)', color: 'var(--bx-ink)',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <h1 className="bx__hi" style={{ fontSize: 'clamp(24px,3.6vw,34px)' }}>My Profile</h1>
            </div>
            <div className="bx__sub">Manage your public profile information</div>
          </div>
          {!isEditing ? (
            <motion.button
              onClick={() => setIsEditing(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '9px 16px', borderRadius: 13, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 13, color: '#fff',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(120deg, var(--bx-accent), var(--bx-accent-2))',
                boxShadow: 'var(--bx-glow)',
              }}
            >
              <Edit2 className="w-4 h-4" /> Edit
            </motion.button>
          ) : renderEditButtons()}
        </motion.div>

        {/* Avatar */}
        <motion.div
          className="bx__tile"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 16 }}
        >
          <div style={{ position: 'relative', flex: 'none' }}>
            <div
              style={{
                width: 96, height: 96, borderRadius: '50%',
                background: 'var(--bx-grad)',
                display: 'grid', placeItems: 'center',
                overflow: 'hidden', boxShadow: 'var(--bx-glow)',
              }}
            >
              {(isEditing ? tempFormData.profileImage : formData.profileImage) ? (
                <img
                  src={isEditing ? tempFormData.profileImage : formData.profileImage}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User className="w-10 h-10" style={{ color: '#fff' }} />
              )}
            </div>
            {isEditing && (
              <motion.button
                onClick={() => setShowImagePicker(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'linear-gradient(120deg, var(--bx-accent), var(--bx-accent-2))',
                  display: 'grid', placeItems: 'center',
                  border: '3px solid var(--bx-card)',
                  color: '#fff', cursor: 'pointer', boxShadow: 'var(--bx-shadow)',
                }}
              >
                <Camera className="w-4 h-4" />
              </motion.button>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 750, fontSize: 19, color: 'var(--bx-ink)' }}>
              {(isEditing ? tempFormData.name : formData.name) || 'Your Name'}
            </div>
            <div className="bx__sub" style={{ marginTop: 2 }}>Freelancer Account</div>
          </div>
        </motion.div>

        {/* Display Name */}
        <motion.div
          className="bx__tile"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{ marginBottom: 16 }}
        >
          <div className="bx__t-title" style={{ marginBottom: 12 }}>Display Name</div>
          {isEditing ? (
            <input
              type="text"
              value={tempFormData.name}
              onChange={(e) => setTempFormData({ ...tempFormData, name: e.target.value })}
              className="jb-input"
              placeholder="Enter your name"
            />
          ) : (
            <p style={{ color: 'var(--bx-ink)' }}>{formData.name || 'Not set'}</p>
          )}
        </motion.div>

        {/* Location */}
        <motion.div
          className="bx__tile"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.11 }}
          style={{ marginBottom: 16 }}
        >
          <div className="bx__t-title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin className="w-4 h-4" style={{ color: 'var(--bx-muted)' }} />
            Location
          </div>
          {isEditing ? (
            <input
              type="text"
              value={tempFormData.location}
              onChange={(e) => setTempFormData({ ...tempFormData, location: e.target.value })}
              className="jb-input"
              placeholder="e.g., Lagos, Nigeria"
            />
          ) : (
            <p style={{ color: 'var(--bx-ink)' }}>{formData.location || 'Not set'}</p>
          )}
        </motion.div>

        {/* Bio */}
        <motion.div
          className="bx__tile"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          style={{ marginBottom: 16 }}
        >
          <div className="bx__t-title" style={{ marginBottom: 12 }}>About Me</div>
          {isEditing ? (
            <textarea
              value={tempFormData.bio}
              onChange={(e) => setTempFormData({ ...tempFormData, bio: e.target.value })}
              placeholder="Tell clients about yourself..."
              rows={6}
              className="jb-input"
              style={{ resize: 'none' }}
            />
          ) : (
            <p style={{ color: 'var(--bx-ink-soft)', lineHeight: 1.65, fontSize: 14.5 }}>
              {formData.bio || 'No bio yet. Add one to tell clients about yourself.'}
            </p>
          )}
          <div className="bx__sub" style={{ marginTop: 8 }}>
            This is your personal bio. To update your skills, portfolio, and what clients see on your card, go to "My Skills".
          </div>
        </motion.div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      {/* Image Picker Modal */}
      <AnimatePresence>
        {showImagePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isUploadingImage && setShowImagePicker(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 70,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 16, backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bx"
              style={{
                background: 'var(--bx-solid)', borderRadius: 22, padding: 26,
                maxWidth: 380, width: '100%',
                border: '1px solid var(--bx-line)',
                boxShadow: 'var(--bx-shadow-lg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 800, fontSize: 19, color: 'var(--bx-ink)' }}>Profile Photo</h3>
                <button
                  onClick={() => !isUploadingImage && setShowImagePicker(false)}
                  disabled={isUploadingImage}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    display: 'grid', placeItems: 'center',
                    border: '1px solid var(--bx-line)',
                    background: 'var(--bx-card-2)', color: 'var(--bx-muted)',
                    cursor: 'pointer', opacity: isUploadingImage ? 0.5 : 1,
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                <div
                  style={{
                    width: 120, height: 120, borderRadius: '50%',
                    background: 'var(--bx-grad)',
                    display: 'grid', placeItems: 'center',
                    overflow: 'hidden', marginBottom: 16,
                    boxShadow: 'var(--bx-glow)',
                  }}
                >
                  {tempFormData.profileImage ? (
                    <img
                      src={tempFormData.profileImage}
                      alt="Profile preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User className="w-14 h-14" style={{ color: '#fff' }} />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  whileHover={isUploadingImage ? {} : { scale: 1.02 }}
                  whileTap={isUploadingImage ? {} : { scale: 0.98 }}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 13,
                    border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'linear-gradient(120deg, var(--bx-accent), var(--bx-accent-2))',
                    boxShadow: 'var(--bx-glow)',
                    opacity: isUploadingImage ? 0.6 : 1,
                  }}
                >
                  {isUploadingImage ? (
                    <><Loader2 className="w-5 h-5" style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</>
                  ) : (
                    <><Upload className="w-5 h-5" /> {tempFormData.profileImage ? 'Change Photo' : 'Upload Photo'}</>
                  )}
                </motion.button>

                {tempFormData.profileImage && !isUploadingImage && (
                  <motion.button
                    onClick={handleRemoveImage}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%', padding: '13px 0', borderRadius: 13,
                      border: '1px solid var(--bx-line)',
                      background: 'var(--bx-card-2)', color: 'var(--bx-accent-3)',
                      cursor: 'pointer', fontWeight: 700, fontSize: 14,
                    }}
                  >
                    Remove Photo
                  </motion.button>
                )}

                <motion.button
                  onClick={() => setShowImagePicker(false)}
                  disabled={isUploadingImage}
                  whileTap={isUploadingImage ? {} : { scale: 0.98 }}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 13,
                    border: '1px solid var(--bx-line)',
                    background: 'var(--bx-card-2)', color: 'var(--bx-ink)',
                    cursor: 'pointer', fontWeight: 700, fontSize: 14,
                    opacity: isUploadingImage ? 0.5 : 1,
                  }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

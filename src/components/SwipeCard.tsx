import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { Heart, MapPin, Check, DollarSign, Clock, Briefcase, Star, X, Info, Bookmark, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeCardProps {
  data: any;
  onSwipe: (direction: 'left' | 'right') => void;
  onCardClick?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  type: 'freelancer' | 'job';
  nextPhotos?: string[];
}

export function SwipeCard({ data, onSwipe, onCardClick, onSave, isSaved, type, nextPhotos }: SwipeCardProps) {
  const [exitX, setExitX] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  // Drag-reactive decision stamps (fade in as you drag toward a choice)
  const likeOpacity = useTransform(x, [30, 130], [0, 1]);
  const nopeOpacity = useTransform(x, [-130, -30], [1, 0]);
  // Drag-reactive edge glow: red when swiping left (nope), green when right (like)
  const boxShadow = useTransform(
    x,
    [-150, -40, 0, 40, 150],
    [
      '0 0 0 3px rgba(239,68,68,0.85), 0 40px 90px -30px rgba(0,0,0,0.78)',
      '0 40px 90px -30px rgba(0,0,0,0.78)',
      '0 40px 90px -30px rgba(0,0,0,0.78)',
      '0 40px 90px -30px rgba(0,0,0,0.78)',
      '0 0 0 3px rgba(34,197,94,0.85), 0 40px 90px -30px rgba(0,0,0,0.78)',
    ],
  );

  const handleDragEnd = (_event: any, info: PanInfo) => {
    // Commit on either a long drag OR a fast flick (velocity), like real swipe apps.
    const committed = Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500;
    if (committed) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      setSwipeDirection(direction);
      setExitX(info.offset.x > 0 ? 480 : -480);

      setTimeout(() => {
        onSwipe(direction);
      }, 450);
    } else {
      x.set(0);
    }
  };

  // Reusable drag stamps, rendered inside the draggable layer so they track the card.
  const DragStamps = () => (
    <>
      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute top-6 left-6 z-40 -rotate-12 select-none"
      >
        <span className="px-4 py-2 rounded-xl border-4 border-green-400 text-green-400 font-extrabold text-2xl sm:text-3xl tracking-wider uppercase backdrop-blur-sm">
          Like
        </span>
      </motion.div>
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="pointer-events-none absolute top-6 right-6 z-40 rotate-12 select-none"
      >
        <span className="px-4 py-2 rounded-xl border-4 border-red-500 text-red-500 font-extrabold text-2xl sm:text-3xl tracking-wider uppercase backdrop-blur-sm">
          Nope
        </span>
      </motion.div>
    </>
  );

  const handleSwipeButton = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    setExitX(direction === 'right' ? 400 : -400);

    setTimeout(() => {
      onSwipe(direction);
    }, 500);
  };

  // Keyboard navigation for fullscreen viewer
  useEffect(() => {
    if (fullscreenImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenImageIndex(null);
      } else if (e.key === 'ArrowLeft') {
        if (type === 'freelancer') {
          const buildPortfolioImages = () => {
            const images: string[] = [];
            if (data.avatar) images.push(data.avatar);
            if (data.portfolioImage) images.push(data.portfolioImage);
            if (data.portfolioImages && data.portfolioImages.length > 0) {
              images.push(...data.portfolioImages);
            }
            return images;
          };
          const portfolioImages = buildPortfolioImages();
          setFullscreenImageIndex((fullscreenImageIndex - 1 + portfolioImages.length) % portfolioImages.length);
        }
      } else if (e.key === 'ArrowRight') {
        if (type === 'freelancer') {
          const buildPortfolioImages = () => {
            const images: string[] = [];
            if (data.avatar) images.push(data.avatar);
            if (data.portfolioImage) images.push(data.portfolioImage);
            if (data.portfolioImages && data.portfolioImages.length > 0) {
              images.push(...data.portfolioImages);
            }
            return images;
          };
          const portfolioImages = buildPortfolioImages();
          setFullscreenImageIndex((fullscreenImageIndex + 1) % portfolioImages.length);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImageIndex, data, type]);

  if (type === 'freelancer') {
    // Build photo array (avatar + portfolio shots) for carousel + fullscreen
    const buildPortfolioImages = () => {
      const images: string[] = [];
      if (data.avatar) images.push(data.avatar);
      if (data.portfolioImage) images.push(data.portfolioImage);
      if (data.portfolioImages && data.portfolioImages.length > 0) {
        images.push(...data.portfolioImages);
      }
      return images;
    };

    const portfolioImages = buildPortfolioImages();
    const safeIdx = portfolioImages.length ? Math.min(photoIndex, portfolioImages.length - 1) : 0;
    const heroPhoto = portfolioImages[safeIdx];
    const navPhoto = (dir: number) => {
      if (portfolioImages.length < 2) return;
      setPhotoIndex((safeIdx + dir + portfolioImages.length) % portfolioImages.length);
    };
    const firstName = (data.name || 'Talent').split(' ')[0];
    const skills: string[] = data.skills || [];

    const renderPhoto = (src?: string) =>
      src ? <img src={src} alt={data.name} /> : <div className="bcard__photo-fb"><User className="w-24 h-24" /></div>;

    return (
      <>
        {/* Fullscreen Image Viewer */}
        {fullscreenImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
            onClick={() => setFullscreenImageIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setFullscreenImageIndex(null)}
                className="absolute top-4 right-4 z-10 p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6 text-white" strokeWidth={2.5} />
              </button>
              {portfolioImages.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                  {fullscreenImageIndex + 1} / {portfolioImages.length}
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); if (portfolioImages.length > 1) setFullscreenImageIndex((fullscreenImageIndex - 1 + portfolioImages.length) % portfolioImages.length); }}
                className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors ${portfolioImages.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={portfolioImages.length <= 1}
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (portfolioImages.length > 1) setFullscreenImageIndex((fullscreenImageIndex + 1) % portfolioImages.length); }}
                className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors ${portfolioImages.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={portfolioImages.length <= 1}
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
              </button>
              <img
                src={portfolioImages[fullscreenImageIndex]}
                alt={`Portfolio ${fullscreenImageIndex + 1}`}
                className="max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain"
              />
            </motion.div>
          </motion.div>
        )}

        <div className={`deck ${fullscreenImageIndex !== null ? 'hidden' : ''}`}>
          <div className="deck__stage">
            <div className="deck__hold">
              {/* peeking cards behind (next talent) */}
              {nextPhotos && nextPhotos[1] && (
                <div className="bcard bcard--g2"><div className="bcard__photo">{renderPhoto(nextPhotos[1])}</div></div>
              )}
              {nextPhotos && nextPhotos[0] && (
                <div className="bcard bcard--g1"><div className="bcard__photo">{renderPhoto(nextPhotos[0])}</div></div>
              )}

              {/* live, draggable card */}
              <motion.div
                className="bcard bcard--live"
                style={{ x, rotate, opacity, boxShadow }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                animate={exitX !== 0 ? { x: exitX } : { x: 0 }}
                transition={exitX !== 0 ? { duration: 0.45, ease: [0.16, 1, 0.3, 1] } : { type: 'spring', stiffness: 320, damping: 30 }}
              >
                {/* decision stamps */}
                <motion.span className="bstamp bstamp--like" style={{ opacity: likeOpacity }}>Like</motion.span>
                <motion.span className="bstamp bstamp--nope" style={{ opacity: nopeOpacity }}>Nope</motion.span>

                {/* commit flash */}
                {swipeDirection && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bcommit"
                    style={{ background: swipeDirection === 'right' ? 'rgba(15,157,118,0.24)' : 'rgba(239,68,68,0.24)' }}
                  >
                    <motion.div
                      className="bcommit__badge"
                      initial={{ scale: 0, rotate: swipeDirection === 'right' ? -160 : 160 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      style={{ background: swipeDirection === 'right' ? '#0f9d76' : '#ef4444' }}
                    >
                      {swipeDirection === 'right' ? <Check className="w-14 h-14 text-white" strokeWidth={4} /> : <X className="w-14 h-14 text-white" strokeWidth={4} />}
                    </motion.div>
                  </motion.div>
                )}

                {/* photo */}
                <div className="bcard__photo">
                  {heroPhoto ? (
                    <img
                      src={heroPhoto}
                      alt={data.name}
                      onClick={(e) => { e.stopPropagation(); setFullscreenImageIndex(safeIdx); }}
                    />
                  ) : (
                    <div className="bcard__photo-fb"><User className="w-24 h-24" /></div>
                  )}
                </div>
                <div className="bcard__scrim" />

                {/* story progress bars */}
                {portfolioImages.length > 1 && (
                  <div className="bcard__bars">
                    {portfolioImages.map((_, i) => (
                      <div key={i} className={`bcard__bar ${i <= safeIdx ? 'on' : ''}`}><i /></div>
                    ))}
                  </div>
                )}

                {/* tap zones to flip photos */}
                {portfolioImages.length > 1 && (
                  <>
                    <div className="bcard__tap bcard__tap--l" onClick={(e) => { e.stopPropagation(); navPhoto(-1); }} />
                    <div className="bcard__tap bcard__tap--r" onClick={(e) => { e.stopPropagation(); navPhoto(1); }} />
                  </>
                )}

                {/* save */}
                <button
                  className={`bcard__save ${isSaved ? 'on' : ''}`}
                  onClick={(e) => { e.stopPropagation(); if (onSave) onSave(); }}
                  aria-label={isSaved ? 'Saved' : 'Save'}
                >
                  <Bookmark className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} />
                </button>

                {/* info overlay — tap to open full profile */}
                <div className="bcard__info" onClick={(e) => { e.stopPropagation(); if (onCardClick) onCardClick(); }}>
                  <div className="bcard__name">
                    {firstName}
                    {data.verified && <span className="bvbadge"><Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /></span>}
                  </div>
                  {data.headline && <div className="bcard__role">{data.headline}</div>}
                  <div className="bcard__meta">
                    {data.location && <span><MapPin className="w-4 h-4" />{data.location}</span>}
                    {data.availability && <span className="bcard__avail"><Clock className="w-4 h-4" />{data.availability}</span>}
                    <span><Briefcase className="w-4 h-4" />{data.completedJobs || 0} jobs</span>
                  </div>
                  {skills.length > 0 && (
                    <div className="bcard__pills">
                      {skills.slice(0, 4).map((s, i) => <span key={i} className="bcard__pill">{s}</span>)}
                      {skills.length > 4 && <span className="bcard__pill">+{skills.length - 4}</span>}
                    </div>
                  )}
                  <div className="bcard__more"><Info className="w-4 h-4" /> Tap for full profile</div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* floating action buttons */}
          <div className="bactions">
            <button className="bact bact--sm bact--pass" onClick={(e) => { e.stopPropagation(); handleSwipeButton('left'); }} aria-label="Pass">
              <X className="w-7 h-7" strokeWidth={2.5} />
            </button>
            <button className="bact bact--lg bact--like" onClick={(e) => { e.stopPropagation(); handleSwipeButton('right'); }} aria-label="Interested">
              <Heart className="w-8 h-8" fill="currentColor" strokeWidth={2} />
            </button>
            <button className="bact bact--sm bact--info" onClick={(e) => { e.stopPropagation(); if (onCardClick) onCardClick(); }} aria-label="View profile">
              <Info className="w-7 h-7" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </>
    );
  }

  // Job Card
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-y-auto">
      {/* Card Area */}
      <div className="flex-1 min-h-0 relative flex-shrink-0">
        <motion.div
          style={{ x, rotate, opacity, boxShadow }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          animate={exitX !== 0 ? { x: exitX } : { x: 0 }}
          transition={exitX !== 0 ? { duration: 0.45, ease: [0.16, 1, 0.3, 1] } : { type: 'spring', stiffness: 320, damping: 30 }}
          className="w-full h-full cursor-grab active:cursor-grabbing relative"
        >
          <DragStamps />
          <div className="w-full h-full bg-white overflow-hidden flex flex-col relative rounded-b-3xl">
            {/* Animated Swipe Feedback Overlays */}
            {swipeDirection === 'right' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center z-30 bg-green-500/20 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-32 h-32 sm:w-40 sm:h-40 bg-green-500 rounded-full flex items-center justify-center shadow-2xl"
                >
                  <Check className="w-20 h-20 sm:w-24 sm:h-24 text-white" strokeWidth={4} />
                </motion.div>
              </motion.div>
            )}

            {swipeDirection === 'left' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center z-30 bg-red-500/20 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-32 h-32 sm:w-40 sm:h-40 bg-red-500 rounded-full flex items-center justify-center shadow-2xl"
                >
                  <X className="w-20 h-20 sm:w-24 sm:h-24 text-white" strokeWidth={4} />
                </motion.div>
              </motion.div>
            )}

            {/* Gradient Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-purple-50 opacity-60" />

            {/* Content Wrapper */}
            <div className="relative flex flex-col h-full">
              {/* Top Section */}
              <div className="p-4 sm:p-6 lg:p-8 pb-0">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="inline-flex items-center gap-2 bg-purple-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" />
                    <span className="text-sm sm:text-base font-bold text-purple-700">{data.category}</span>
                  </div>
                  {data.verified && (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Job Title */}
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                  {data.title}
                </h2>

                {/* Budget & Deadline Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-4 bg-gradient-to-r from-purple-600 to-purple-700 px-5 sm:px-6 py-4 sm:py-5 rounded-2xl shadow-lg">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm text-purple-100 font-medium">Budget</span>
                      <span className="text-white font-bold text-xl sm:text-2xl">
                        ₦{(data.budget / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-gray-900 px-5 sm:px-6 py-4 sm:py-5 rounded-2xl shadow-lg">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-xl flex items-center justify-center">
                      <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm text-gray-400 font-medium">Deadline</span>
                      <span className="text-white font-bold text-xl sm:text-2xl">
                        {data.deadline}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-2 min-h-0">
                {/* Client Info Card */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-md">
                      {data.clientAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-base sm:text-lg truncate">{data.clientName}</h4>
                        {data.verified && (
                          <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {data.clientLocation && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            <span>{data.clientLocation}</span>
                          </div>
                        )}
                        {data.clientRating && (
                          <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{data.clientRating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-sm sm:text-base font-bold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">Description</h4>
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                    {data.description}
                  </p>
                </div>

                {/* Required Skills */}
                {data.requiredSkills && data.requiredSkills.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <h4 className="text-sm sm:text-base font-bold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">Required Skills</h4>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {data.requiredSkills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-100 text-purple-700 rounded-full text-sm sm:text-base font-semibold border border-purple-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posted Date */}
                <div className="flex items-center gap-2 text-sm sm:text-base text-gray-500 pb-4">
                  <Clock className="w-4 h-4" />
                  <span>
                    Posted {(() => {
                      const now = new Date();
                      const diffInMs = now.getTime() - new Date(data.postedDate).getTime();
                      const diffInDays = Math.floor(diffInMs / 86400000);
                      if (diffInDays === 0) return 'Today';
                      if (diffInDays === 1) return 'Yesterday';
                      return `${diffInDays} days ago`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 pt-3 pb-20 sm:px-6 sm:pt-4">
        <div className="flex gap-3 sm:gap-4 max-w-lg mx-auto">
          {/* Skip Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSwipeButton('left');
            }}
            className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-gray-900 shadow-lg active:scale-95 transition-transform"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
          </button>

          {/* Apply Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSwipeButton('right');
            }}
            className="flex-1 h-12 sm:h-14 flex items-center justify-center gap-2 sm:gap-3 rounded-full text-white font-bold shadow-xl text-base sm:text-lg px-4 active:scale-95 transition-transform accent-bg"
          >
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-white" strokeWidth={2.5} />
            <span>Accept</span>
          </button>

          {/* View Details Button */}
          {onCardClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCardClick();
              }}
              className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-gray-900 shadow-lg active:scale-95 transition-transform"
            >
              <Info className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

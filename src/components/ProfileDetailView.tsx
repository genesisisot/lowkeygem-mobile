import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Heart, 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Award,
  Calendar,
  SkipForward,
  ArrowLeft
} from 'lucide-react';

interface ProfileDetailViewProps {
  data: any;
  type: 'freelancer' | 'job';
  onClose: () => void;
  onSwipe: (direction: 'left' | 'right') => void;
}

export function ProfileDetailView({ data, type, onClose, onSwipe }: ProfileDetailViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);

  const handleSwipeButton = (direction: 'left' | 'right') => {
    onSwipe(direction);
    onClose();
  };

  // Build portfolio images helper (used in keyboard navigation)
  const buildPortfolioImages = () => {
    const images: string[] = [];
    if (type === 'freelancer') {
      if (data.avatar) images.push(data.avatar);
      if (data.portfolioImages && data.portfolioImages.length > 0) {
        images.push(...data.portfolioImages);
      }
    }
    return images;
  };

  const portfolioImagesForNav = buildPortfolioImages();

  // Keyboard navigation for fullscreen viewer
  useEffect(() => {
    if (fullscreenImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenImageIndex(null);
      } else if (e.key === 'ArrowLeft' && portfolioImagesForNav.length > 1) {
        setFullscreenImageIndex((fullscreenImageIndex - 1 + portfolioImagesForNav.length) % portfolioImagesForNav.length);
      } else if (e.key === 'ArrowRight' && portfolioImagesForNav.length > 1) {
        setFullscreenImageIndex((fullscreenImageIndex + 1) % portfolioImagesForNav.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImageIndex, portfolioImagesForNav]);

  if (type === 'freelancer') {
    // Build portfolio images array: avatar first (if exists), then portfolio images
    const buildPortfolioImages = () => {
      const images: string[] = [];

      // Add avatar/profile picture first if it exists
      if (data.avatar) {
        images.push(data.avatar);
      }

      // Add portfolio images
      if (data.portfolioImages && data.portfolioImages.length > 0) {
        images.push(...data.portfolioImages);
      }

      // If no images at all, return empty array (will show placeholder)
      return images;
    };

    const portfolioImages = buildPortfolioImages();

    return (
      <>
        {/* Fullscreen Image Viewer */}
        {fullscreenImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            onClick={() => setFullscreenImageIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setFullscreenImageIndex(null)}
                className="absolute top-4 right-4 z-10 p-3 sf-card/10 backdrop-blur-md rounded-full hover:sf-card/20 transition-colors"
              >
                <X className="w-6 h-6 text-white" strokeWidth={2.5} />
              </button>

              {/* Image Counter */}
              {portfolioImages.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                  {fullscreenImageIndex + 1} / {portfolioImages.length}
                </div>
              )}

              {/* Navigation Arrows */}
              {portfolioImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenImageIndex((fullscreenImageIndex - 1 + portfolioImages.length) % portfolioImages.length);
                    }}
                    className="absolute left-4 p-4 sf-card/10 backdrop-blur-md rounded-full hover:sf-card/20 transition-colors"
                  >
                    <ChevronLeft className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenImageIndex((fullscreenImageIndex + 1) % portfolioImages.length);
                    }}
                    className="absolute right-4 p-4 sf-card/10 backdrop-blur-md rounded-full hover:sf-card/20 transition-colors"
                  >
                    <ChevronRight className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </button>
                </>
              )}

              {/* Fullscreen Image */}
              <img
                src={portfolioImages[fullscreenImageIndex]}
                alt={`Portfolio ${fullscreenImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="sf-card rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 sf-card/95 backdrop-blur-sm border-b bd-line px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                onClick={onClose}
                className="p-2 hover-card2 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 tx-soft" />
              </motion.button>
              <h2 className="text-xl sm:text-2xl font-bold tx-ink">Profile Details</h2>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 hover-card2 rounded-full transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 tx-soft" />
            </motion.button>
          </div>

          {/* Desktop: Side-by-side layout | Mobile: Stacked layout */}
          <div className="flex flex-col lg:flex-row-reverse">
            {/* Portfolio Gallery - Right side on desktop */}
            <div className="lg:w-1/2 lg:sticky lg:top-[73px] lg:h-[calc(90vh-73px)] relative bg-gradient-to-br from-purple-100 to-purple-50">
              <div className="aspect-video sm:aspect-[16/10] lg:aspect-auto lg:h-full relative overflow-hidden">
                {portfolioImages.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImageIndex}
                      src={portfolioImages[currentImageIndex]}
                      alt={`Portfolio ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.3 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenImageIndex(currentImageIndex);
                      }}
                    />
                  </AnimatePresence>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--bx-accent)] to-purple-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 mx-auto mb-3 rounded-full sf-card/20 flex items-center justify-center">
                        <Award className="w-10 h-10" />
                      </div>
                      <p className="text-lg font-medium">No portfolio images yet</p>
                    </div>
                  </div>
                )}

                {/* Navigation Arrows */}
                {portfolioImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((currentImageIndex - 1 + portfolioImages.length) % portfolioImages.length)}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 sf-card/90 backdrop-blur-sm rounded-full hover:sf-card transition-colors shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 tx-ink" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((currentImageIndex + 1) % portfolioImages.length)}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 sf-card/90 backdrop-blur-sm rounded-full hover:sf-card transition-colors shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 tx-ink" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {portfolioImages.length > 0 && (
                  <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium">
                    {currentImageIndex + 1} / {portfolioImages.length}
                  </div>
                )}

                {/* Verified Badge */}
                {data.verified && (
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 sf-purple text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    Verified
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {portfolioImages.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-4 pb-4 pt-8 flex gap-2 overflow-x-auto">
                  {portfolioImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setFullscreenImageIndex(index);
                      }}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index
                          ? 'bd-purple scale-105'
                          : 'border-white/50 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Info - Left side on desktop */}
            <div className="lg:w-1/2 p-4 sm:p-6">
              {/* Name & Headline */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tx-ink mb-2">
                  {data.name}
                </h3>
                <p className="text-base sm:text-lg lg:text-xl tx-purple font-semibold mb-3">
                  {data.headline}
                </p>

                {/* Location & Availability */}
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {data.location && (
                    <div className="flex items-center gap-2 text-sm sm:text-base tx-soft">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{data.location}</span>
                    </div>
                  )}
                  {data.availability && (
                    <div className="flex items-center gap-2 text-sm sm:text-base tx-green font-medium">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{data.availability}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 p-4 sf-card2 rounded-xl">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold tx-purple mb-1">
                    {data.completedJobs || 0}
                  </div>
                  <div className="text-xs sm:text-sm tx-soft">Jobs Done</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold tx-purple mb-1">
                    {data.responseTime || '2h'}
                  </div>
                  <div className="text-xs sm:text-sm tx-soft">Response</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold tx-purple mb-1">
                    {data.successRate || '98%'}
                  </div>
                  <div className="text-xs sm:text-sm tx-soft">Success</div>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h4 className="text-base sm:text-lg font-bold tx-ink mb-3">Skills & Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {data.skills?.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 sf-purple tx-purple rounded-full text-xs sm:text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Portfolio Images */}
              {(() => {
                // Build portfolio images array for display
                const displayPortfolioImages = [];

                // Check for portfolioImage (singular, main image)
                if (data.portfolioImage) displayPortfolioImages.push(data.portfolioImage);

                // Check for portfolioImages (camelCase)
                if (data.portfolioImages && data.portfolioImages.length > 0) {
                  displayPortfolioImages.push(...data.portfolioImages);
                }

                // Check for portfolio_images (snake_case from database)
                if (data.portfolio_images && data.portfolio_images.length > 0) {
                  displayPortfolioImages.push(...data.portfolio_images);
                }

                return displayPortfolioImages.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-base sm:text-lg font-bold tx-ink mb-3">Portfolio</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {displayPortfolioImages.map((img: string, index: number) => (
                        <div
                          key={index}
                          className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border-2 bd-purple"
                          onClick={() => {
                            const imgIndex = portfolioImages.findIndex(i => i === img);
                            setFullscreenImageIndex(imgIndex !== -1 ? imgIndex : index);
                          }}
                        >
                          <img
                            src={img}
                            alt={`Portfolio ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Bio */}
              {data.bio && (
                <div className="mb-20 lg:mb-6">
                  <h4 className="text-base sm:text-lg font-bold tx-ink mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 tx-purple" />
                    About Me
                  </h4>
                  <p className="text-sm sm:text-base tx-soft leading-relaxed">
                    {data.bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Sticky */}
          <div className="fixed bottom-0 left-0 right-0 lg:left-auto lg:right-auto lg:w-1/2 lg:max-w-3xl flex gap-3 sm:gap-4 sf-card border-t bd-line p-4 sm:p-6 shadow-lg">
            <motion.button
              onClick={() => handleSwipeButton('left')}
              className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-xl border-2 bd-line tx-soft font-bold text-sm sm:text-base hover-card2 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
              Skip
            </motion.button>
            <motion.button
              onClick={() => handleSwipeButton('right')}
              className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-xl text-white font-bold text-sm sm:text-base shadow-lg hover:opacity-90 transition-opacity accent-bg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
              I'm Interested
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
      </>
    );
  }

  // Job Detail View
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="sf-card rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header with Job Title */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-purple-600 to-purple-700 px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {data.title}
              </h2>
              <div className="flex items-center gap-2 text-purple-100 mb-4">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{data.category}</span>
              </div>
              
              {/* Budget & Deadline */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 sf-card/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="text-white font-bold text-sm sm:text-base">
                    ₦{data.budget?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 sf-card/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="text-white font-medium text-sm sm:text-base">
                    {data.deadline}
                  </span>
                </div>
                {data.verified && (
                  <div className="flex items-center gap-1.5 sf-green-solid/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    <span className="text-white font-medium text-sm sm:text-base">Verified</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Client Avatar - No Rating */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-lg border-4 border-white/20">
                {data.clientAvatar || '👤'}
              </div>
            </div>
          </div>

          {/* Back Button */}
          <motion.button
            onClick={onClose}
            className="absolute top-3 sm:top-4 left-3 sm:left-4 p-2 hover:sf-card/10 rounded-full transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </motion.button>

          {/* Close Button */}
          <motion.button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 hover:sf-card/10 rounded-full transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Client Information - Prominent Section */}
          <div className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-purple-50 to-white rounded-2xl border bd-purple">
            <h4 className="text-lg sm:text-xl font-bold tx-ink mb-4 flex items-center gap-2">
              <div className="w-8 h-8 sf-purple rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              About the Client
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-2xl shadow-md">
                    {data.clientAvatar}
                  </div>
                  <div>
                    <div className="font-bold tx-ink text-base sm:text-lg flex items-center gap-2">
                      {data.clientName}
                      {data.verified && (
                        <div className="w-5 h-5 sf-purple rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    {data.clientLocation && (
                      <div className="flex items-center gap-1 text-sm tx-soft mt-0.5">
                        <MapPin className="w-4 h-4" />
                        <span>{data.clientLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
                {data.clientRating && (
                  <div className="flex items-center gap-1.5 sf-amber px-3 sm:px-4 py-2 rounded-full border bd-amber">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-sm sm:text-base tx-ink">{data.clientRating}</span>
                  </div>
                )}
              </div>
              {data.clientInfo && (
                <p className="text-sm sm:text-base tx-soft leading-relaxed pl-15">
                  {data.clientInfo}
                </p>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div className="mb-6">
            <h4 className="text-base sm:text-lg font-bold tx-ink mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--bx-grad)' }}>
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              Full Description
            </h4>
            <div className="prose prose-sm sm:prose-base max-w-none">
              <p className="text-sm sm:text-base tx-soft leading-relaxed">
                {data.description}
              </p>
              {data.fullDescription && (
                <p className="text-sm sm:text-base tx-soft leading-relaxed mt-3">
                  {data.fullDescription}
                </p>
              )}
            </div>
          </div>

          {/* Required Skills */}
          {data.requiredSkills && data.requiredSkills.length > 0 && (
            <div className="mb-6">
              <h4 className="text-base sm:text-lg font-bold tx-ink mb-3">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {data.requiredSkills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 sf-purple tx-purple rounded-full text-xs sm:text-sm font-semibold border bd-purple"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Deliverables */}
          {data.deliverables && data.deliverables.length > 0 && (
            <div className="mb-6">
              <h4 className="text-base sm:text-lg font-bold tx-ink mb-3">Expected Deliverables</h4>
              <ul className="space-y-2.5">
                {data.deliverables.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 text-sm sm:text-base tx-soft">
                    <div className="w-5 h-5 sf-green-solid rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Experience Level */}
          {data.experience && (
            <div className="mb-6 p-4 sf-card2 rounded-xl border bd-line">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sf-purple rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 tx-purple" />
                </div>
                <div>
                  <div className="text-xs tx-soft">Experience Level Required</div>
                  <div className="font-bold tx-ink text-base">{data.experience}</div>
                </div>
              </div>
            </div>
          )}

          {/* Posted Date */}
          {data.postedDate && (
            <div className="mb-20 flex items-center gap-2 text-sm tx-soft">
              <Clock className="w-4 h-4" />
              <span>
                Posted {(() => {
                  const now = new Date();
                  const diffInMs = now.getTime() - new Date(data.postedDate).getTime();
                  const diffInDays = Math.floor(diffInMs / 86400000);
                  if (diffInDays === 0) return 'today';
                  if (diffInDays === 1) return 'yesterday';
                  return `${diffInDays} days ago`;
                })()}
              </span>
            </div>
          )}

          {/* Action Buttons - Sticky */}
          <div className="fixed bottom-0 left-0 right-0 flex gap-3 sm:gap-4 sf-card border-t bd-line p-4 sm:p-6 shadow-lg">
            <motion.button
              onClick={() => handleSwipeButton('left')}
              className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-xl border-2 bd-line tx-soft font-bold text-sm sm:text-base hover-card2 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
              Skip
            </motion.button>
            <motion.button
              onClick={() => handleSwipeButton('right')}
              className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-xl text-white font-bold text-sm sm:text-base shadow-lg hover:opacity-90 transition-opacity accent-bg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
              I'm Interested
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
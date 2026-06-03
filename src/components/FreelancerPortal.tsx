import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { staggerContainer, fadeRise } from '../lib/motion';
import {
  Heart,
  MessageSquare,
  DollarSign,
  Briefcase,
  Bell,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Clock,
  CheckCircle,
  ChevronRight,
  Star,
  Zap,
  TrendingUp,
  BookmarkPlus,
  Home,
  Bookmark,
  Search,
  MapPin,
  Check,
  ArrowLeft,
  Sparkles,
  Wallet,
  Building2,
  CreditCard,
  Plus,
  Shield,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { Logo } from './Logo';
import { SwipeCard } from './SwipeCard';
import { ChatInterface, PaymentStatus } from './ChatInterface';
import { ProfileDetailView } from './ProfileDetailView';
import { FreelancerProfile } from './FreelancerProfile';
import { MySkillsView } from './MySkillsView';
import { AddSkillProfile } from './AddSkillProfile';
import { SkillSwitcher } from './SkillSwitcher';
import { SupportPage } from './SupportPage';
import { EmptyState } from './EmptyState';
import { OnboardingChecklist } from './OnboardingChecklist';
import { SimpleLoader } from './SimpleLoader';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { Celebration } from './Celebration';
import { CountUp } from './CountUp';
import { MatchListSkeleton } from './Skeleton';
import { jobsService } from '../services/jobs';
import { matchesService, handleSwipe as handleSwipeService, swipesService } from '../services/matches';
import { disputesService } from '../services/disputes';
import { messagesService } from '../services/messages';
import '../styles/dashboard.css';
import '../styles/discover.css';
import { notificationsService } from '../services/notifications';
import { skillProfilesService } from '../services/profiles';
import { walletService } from '../services/wallet';
import { ratingsService } from '../services/ratings';
import { workSubmissionsService } from '../services/workSubmissions';
import { hapticsLight } from '../lib/haptics'
import type { JobWithClient, MatchWithProfiles, Notification, SkillProfile, WorkSubmission } from '../types/database';

interface FreelancerPortalProps {
  onLogout: () => void;
  defaultView?: ViewType;
}

type ViewType = 'dashboard' | 'discover' | 'matches' | 'saved' | 'profileDetail' | 'myProfile' | 'mySkills' | 'addSkillProfile' | 'wallet' | 'support';

// Helper to transform job data for SwipeCard
const transformJobForCard = (job: JobWithClient, ratingData?: { average: number; count: number }) => ({
  id: job.id,
  clientId: job.client_id, // Include client ID for swipe matching
  title: job.title,
  description: job.description || '',
  category: job.category,
  budget: job.budget,
  deadline: job.deadline || 'Flexible',
  clientName: job.client?.full_name || job.client?.company_name || 'Anonymous',
  clientAvatar: job.client?.avatar_url || '👤',
  // Only show rating if client has been rated (null means no ratings yet)
  clientRating: ratingData?.average || null,
  clientLocation: job.client?.location || 'Nigeria',
  verified: job.client?.kyc_status === 'approved',
  postedDate: new Date(job.created_at),
  requiredSkills: job.required_skills || [],
  experience: job.experience_level || 'Any level',
  portfolioImage: job.client?.avatar_url || null,
});

// Helper to transform match data for display
const transformMatchForDisplay = (match: MatchWithProfiles) => ({
  id: match.id,
  clientId: match.client_id,
  clientName: match.client?.full_name || match.client?.company_name || 'Client',
  clientAvatar: match.client?.avatar_url || '👤',
  jobTitle: match.job?.title || 'Project',
  lastMessage: 'Start chatting!', // placeholder; enriched from messagesService after load
  matchedAt: new Date(match.matched_at),
  unreadCount: 0, // placeholder; enriched from messagesService after load
  paymentStatus: match.status as PaymentStatus,
  contractAmount: match.contract_amount || match.job?.budget || 50000, // Use job budget or default amount
  match: match, // Include full match object for dispute flow
  revisionCount: match.revision_count || 0,
  reviewDeadline: match.review_deadline,
});

export function FreelancerPortal({ onLogout, defaultView }: FreelancerPortalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { error: toastError, info: toastInfo, success: toastSuccess } = useToast();
  const { isDark, toggleTheme, accent, setAccent, palettes } = useTheme();

  const isPageMode = !!defaultView;
  const navigate = useNavigate();
  const [currentView, _setCurrentView] = useState<ViewType>((defaultView as ViewType) || 'dashboard');
  const setCurrentView = useCallback((view: ViewType | ((prev: ViewType) => ViewType)) => {
    if (typeof view === 'function') {
      _setCurrentView(view);
      return;
    }
    _setCurrentView(view);
  }, []);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [previousView, setPreviousView] = useState<ViewType>('discover');
  // Discover swipe deck (mirrors Client portal's disc2 card)
  const swipeX = useMotionValue(0);
  const swipeLikeOp = useTransform(swipeX, [40, 150], [0, 1]);
  const swipeNopeOp = useTransform(swipeX, [-150, -40], [1, 0]);
  const [swipeExit, setSwipeExit] = useState(0);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedChat, _setSelectedChat] = useState<any>(null);
  const setSelectedChat = useCallback((matchOrFn: any) => {
    if (typeof matchOrFn === 'function') {
      _setSelectedChat(matchOrFn);
      return;
    }
    _setSelectedChat(matchOrFn);
  }, []);
  const [workSubmissions, setWorkSubmissions] = useState<WorkSubmission[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSwipeModal, setShowSwipeModal] = useState(false);
  const [swipeModalType, setSwipeModalType] = useState<'interest' | 'noMore'>('interest');
  const [celebrate, setCelebrate] = useState(false);
  const [lastSwipedJob, setLastSwipedJob] = useState<any>(null);
  const [matchFilter, setMatchFilter] = useState<string>('all');
  const [matchStatusFilter, setMatchStatusFilter] = useState<string>('all');

  // Real data state
  const [jobs, setJobs] = useState<JobWithClient[]>([]);
  const [clientRatings, setClientRatings] = useState<Record<string, { average: number; count: number }>>({});
  const [clientsWhoLikedMe, setClientsWhoLikedMe] = useState<string[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<{ balance: number; pending: number; bankLinked: boolean } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Loading states
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);

  // Computed stats from real data
  const stats = {
    activeJobs: matches.filter(m => m.paymentStatus === 'funded' || m.paymentStatus === 'in_progress').length,
    totalEarnings: walletData?.balance || 0,
    completedJobs: matches.filter(m => m.paymentStatus === 'completed').length,
    newMatches: matches.filter(m => m.paymentStatus === 'matched').length,
  };

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  // Throttle flag to prevent concurrent batch fetches
  const isFetchingData = useRef(false);
  const lastUserRef = useRef(user);
  // Prevents overlapping swipes (rapid taps would race the DB UNIQUE constraint
  // and double-advance the deck).
  const isSwiping = useRef(false);
  // Match ids already celebrated, so realtime + swipe-return don't double-fire.
  const celebratedMatchIds = useRef<Set<string>>(new Set());

  // Skill-profile state — declared before fetchJobs because discovery is scoped
  // to the currently selected skill profile.
  const [selectedSkillProfileId, setSelectedSkillProfileId] = useState<string>('');
  const [skillProfiles, setSkillProfiles] = useState<any[]>([]);
  const [isLoadingSkillProfiles, setIsLoadingSkillProfiles] = useState(true);

  // Fetch jobs for discovery
  const fetchJobs = useCallback(async () => {
    if (!user) return;
    setIsLoadingJobs(true);
    try {
      // Directional discovery: the server only returns jobs whose client has
      // already shown interest (right-swiped this freelancer). So the deck is
      // exactly "clients who want you", and the freelancer swiping right forms
      // the match. (See backend routers/jobs.py discovery + routers/swipes.py.)
      const { data, error } = await jobsService.getForDiscovery(user.id, { limit: 20 });
      if (!error && data) {
        setJobs(data);
        setClientsWhoLikedMe(data.map((j: JobWithClient) => j.client_id).filter(Boolean));
        setCurrentJobIndex(0);

        const clientIds = data.map((job: JobWithClient) => job.client_id).filter(Boolean);
        if (clientIds.length > 0) {
          const { ratings } = await ratingsService.getBatchAverageRatings(clientIds);
          setClientRatings(ratings);
        }
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  }, [user]);

  // Fetch matches
  const fetchMatches = useCallback(async () => {
    if (!user) return;
    setIsLoadingMatches(true);
    try {
      const { data, error } = await matchesService.getByUser(user.id);
      if (!error && data) {
        const base = data.map(transformMatchForDisplay);
        setMatches(base); // show immediately
        // Enrich with real last message + unread count from the messages service
        const enriched = await Promise.all(
          base.map(async (m) => {
            const [{ data: last }, { count }] = await Promise.all([
              messagesService.getLastMessage(m.id),
              matchesService.getUnreadCount(m.id, user.id),
            ]);
            return {
              ...m,
              lastMessage: last?.content || m.lastMessage,
              unreadCount: count,
            };
          })
        );
        setMatches(enriched);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setIsLoadingMatches(false);
    }
  }, [user]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoadingNotifications(true);
    try {
      const { data, error } = await notificationsService.getByUser(user.id);
      if (!error && data) {
        setNotifications(data.map((n: Notification) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          time: new Date(n.created_at),
          read: n.read,
          avatar: n.type === 'match' ? '🤝' : n.type === 'message' ? '💬' : n.type === 'payment' ? '💰' : '📋',
        })));
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user]);

  // Fetch wallet data
  const fetchWallet = useCallback(async () => {
    if (!user) return;
    setIsLoadingWallet(true);
    try {
      const { data: wallet, error } = await walletService.getByUser(user.id);
      if (!error && wallet) {
        setWalletData({
          balance: wallet.balance,
          pending: wallet.pending,
          bankLinked: Boolean(wallet.bank_name && wallet.account_number),
        });
      }

      const { data: txData } = await walletService.getTransactions(user.id);
      if (txData) {
        setTransactions(txData);
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setIsLoadingWallet(false);
    }
  }, [user]);

  // Initial data fetch with throttling
  useEffect(() => {
    if (!user) return;

    // Allow if user changed (new login) to prevent blocking initial load
    const isNewUser = lastUserRef.current?.id !== user?.id;
    lastUserRef.current = user;

    // Only block if already fetching AND user hasn't changed
    if (isFetchingData.current && !isNewUser) {
      console.log('Batch fetch already in progress, skipping duplicate request');
      return;
    }

    isFetchingData.current = true;

    const fetchAllData = async () => {
      try {
        // Fetch data in parallel but throttled as a batch
        await Promise.all([
          fetchJobs(),
          fetchMatches(),
          fetchNotifications(),
          fetchWallet(),
        ]);
      } catch (error) {
        console.error('Error fetching portal data:', error);
      } finally {
        isFetchingData.current = false;
      }
    };

    fetchAllData();
  }, [user, fetchJobs, fetchMatches, fetchNotifications, fetchWallet]);

  // Fetch work submissions when a chat is selected
  useEffect(() => {
    const fetchWorkSubmissions = async () => {
      if (!selectedChat?.id) {
        setWorkSubmissions([]);
        return;
      }

      try {
        const { data, error } = await workSubmissionsService.getByMatchId(selectedChat.id);
        if (!error && data) {
          setWorkSubmissions(data);
        } else {
          setWorkSubmissions([]);
        }
      } catch (error) {
        console.error('Error fetching work submissions:', error);
        setWorkSubmissions([]);
      }
    };

    fetchWorkSubmissions();
    const poll = setInterval(fetchWorkSubmissions, 4000);
    return () => clearInterval(poll);
  }, [selectedChat?.id]);

  // Transform jobs for SwipeCard display (with client ratings)
  const displayJobs = jobs.map(job =>
    transformJobForCard(job, clientRatings[job.client_id])
  );

  const markNotificationAsRead = async (id: string) => {
    // Update local state immediately for responsiveness
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    // Persist to Supabase
    const { error } = await notificationsService.markAsRead(id);
    if (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    // Update local state immediately for responsiveness
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // Persist to Supabase
    const { error } = await notificationsService.markAllAsRead(user.id);
    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getTimeAgoNotification = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Handle marking job as complete
  const handleMarkComplete = async (matchId: string) => {
    try {
      // Persist to Supabase
      const { error } = await matchesService.submitWork(matchId);
      if (error) {
        console.error('Error submitting work:', error);
        toastError('Failed to submit work. Please try again.');
        return;
      }
      // Update local state
      setMatches(prev => prev.map(match =>
        match.id === matchId
          ? { ...match, paymentStatus: 'pending_approval' as PaymentStatus, lastMessage: 'Work submitted for review' }
          : match
      ));
      // Update selectedChat if it's the current one
      if (selectedChat?.id === matchId) {
        setSelectedChat((prev: any) => prev ? { ...prev, paymentStatus: 'pending_approval' as PaymentStatus } : null);
      }
    } catch (err) {
      console.error('Error marking work as complete:', err);
      toastError('Failed to submit work. Please try again.');
    }
  };

  // Handle work submission
  const handleSubmitWork = async (notes: string, links: string[], files: any[]) => {
    if (!selectedChat || !user?.id) return;

    try {
      // Persist to Supabase with evidence
      const { error } = await matchesService.submitWorkWithEvidence(
        selectedChat.id,
        user.id,
        notes,
        links,
        files
      );

      if (error) {
        console.error('Error submitting work:', error);
        toastError('Failed to submit work. Please try again.');
        return;
      }

      // Update local state
      setMatches(prev => prev.map(match =>
        match.id === selectedChat.id
          ? { ...match, paymentStatus: 'pending_approval' as PaymentStatus, lastMessage: 'Work submitted for review' }
          : match
      ));
      setSelectedChat((prev: any) => prev ? { ...prev, paymentStatus: 'pending_approval' as PaymentStatus } : null);

      // Refetch work submissions to show the new submission
      const { data } = await workSubmissionsService.getByMatchId(selectedChat.id);
      if (data) {
        setWorkSubmissions(data);
      }
    } catch (err) {
      console.error('Error submitting work:', err);
      toastError('Failed to submit work. Please try again.');
    }
  };

  const handleRatingSubmit = async (rating: number, review: string) => {
    if (!selectedChat || !user?.id) return;

    try {
      // Find the match to get the client ID
      const match = matches.find(m => m.id === selectedChat.id);
      if (!match) {
        console.error('Match not found for rating');
        return;
      }

      // Save rating to Supabase (freelancer rates the client)
      const { error } = await ratingsService.create({
        match_id: selectedChat.id,
        rater_id: user.id,
        rated_id: match.clientId || selectedChat.clientId, // The client being rated
        rating,
        review: review || null,
      });

      if (error) {
        console.error('Error saving rating:', error);
        toastError('Failed to submit rating. Please try again.');
        return;
      }

      // Keep the match (already completed); deleting would orphan the rating.

      // Close the chat after rating is submitted
      setTimeout(() => {
        setShowRatingModal(false);
        setSelectedChat(null);
      }, 1500);
    } catch (err) {
      console.error('Error submitting rating:', err);
      toastError('Failed to submit rating. Please try again.');
    }
  };

  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
    setSelectedChat(null);
  };

  // Handle responding to a dispute (for freelancer)
  const handleRespondToDispute = async (response: string, evidence: any[]) => {
    if (!selectedChat) return;

    try {
      const { error } = await matchesService.respondToDispute(selectedChat.id, response, evidence);
      if (error) {
        console.error('Error responding to dispute:', error);
        toastError('Failed to respond to dispute. Please try again.');
        return;
      }
      // Refresh matches to get updated dispute data
      fetchMatches();
    } catch (err) {
      console.error('Error responding to dispute:', err);
      toastError('Failed to respond to dispute. Please try again.');
    }
  };

  // Handle opening a dispute (freelancers can also open disputes)
  const handleOpenDispute = async (reason: any, explanation: string, evidence: any[]) => {
    if (!selectedChat) return;

    try {
      const { error } = await matchesService.openDispute(selectedChat.id, reason, explanation, evidence);
      if (error) {
        console.error('Error opening dispute:', error);
        toastError('Failed to open dispute. Please try again.');
        return;
      }

      // Update local state
      setMatches(prev => prev.map(m =>
        m.id === selectedChat.id
          ? { ...m, paymentStatus: 'disputed' as PaymentStatus }
          : m
      ));
      if (selectedChat?.id) {
        setSelectedChat((prev: any) => prev ? { ...prev, paymentStatus: 'disputed' as PaymentStatus } : null);
      }
      // Refresh matches to get updated dispute data
      fetchMatches();
    } catch (err) {
      console.error('Error opening dispute:', err);
      toastError('Failed to open dispute. Please try again.');
    }
  };

  // Handle clearing messages (only for current user)
  const handleDeleteMatch = async (matchId: string) => {
    try {
      const { error } = await matchesService.delete(matchId);
      if (error) {
        console.error('Error deleting match:', error);
        toastError('Failed to delete chat. Please try again.');
        return;
      }

      // Close the chat UI
      setSelectedChat(null);

      // Update local state - remove from freelancer's view
      setMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (err) {
      console.error('Error deleting match:', err);
      toastError('Failed to delete chat. Please try again.');
    }
  };

  // Check if job was just completed and show rating modal
  useEffect(() => {
    if (selectedChat?.paymentStatus === 'completed' && !showRatingModal) {
      setShowRatingModal(true);
    }
  }, [selectedChat?.paymentStatus]);

  // Skill-profile state is declared earlier (above fetchJobs).

  // Fetch skill profiles
  const fetchSkillProfiles = useCallback(async () => {
    if (!user) return;
    setIsLoadingSkillProfiles(true);
    try {
      const { data, error } = await skillProfilesService.getByFreelancer(user.id);
      if (!error && data) {
        const transformed = data.map((sp: SkillProfile) => ({
          id: sp.id,
          headline: sp.headline,
          category: sp.category,
          skills: sp.skills || [],
          bio: sp.bio || '',
          location: profile?.location || 'Nigeria',
          availability: sp.availability || 'Available',
          portfolioImages: sp.portfolio_images || [],
          experience: sp.experience || [],
          status: sp.status,
          createdDate: new Date(sp.created_at),
          views: sp.views || 0,
          interests: sp.interests || 0,
          matches: sp.matches || 0,
        }));
        setSkillProfiles(transformed);
        // Keep current selection; otherwise restore the persisted one (if it
        // still exists) and fall back to the first profile.
        setSelectedSkillProfileId(prev => {
          if (prev) return prev;
          const stored = user ? localStorage.getItem(`freelancerSelectedSkillId:${user.id}`) : null;
          if (stored && transformed.some((s: any) => s.id === stored)) return stored;
          return transformed[0]?.id || '';
        });
      }
    } catch (err) {
      console.error('Error fetching skill profiles:', err);
    } finally {
      setIsLoadingSkillProfiles(false);
    }
  }, [user, profile?.location]);

  useEffect(() => {
    if (user) {
      fetchSkillProfiles();
    }
  }, [user, fetchSkillProfiles]);

  // Persist the active skill profile so the freelancer returns to the same
  // discovery context.
  useEffect(() => {
    if (user && selectedSkillProfileId) {
      localStorage.setItem(`freelancerSelectedSkillId:${user.id}`, selectedSkillProfileId);
    }
  }, [user, selectedSkillProfileId]);

  // Realtime: surface a match the moment the other side swipes.
  useEffect(() => {
    if (!user) return;
    const channel = matchesService.subscribeToUserMatches(user.id, (match, isNew) => {
      // Status change on an existing match (e.g. escrow funded → can submit
      // work): just refresh so the open chat/dashboard reflects it live.
      if (!isNew) {
        fetchMatches();
        return;
      }
      if (celebratedMatchIds.current.has(match.id)) return;
      celebratedMatchIds.current.add(match.id);
      const title = match.job?.title || 'a job';
      setCelebrate(true);
      toastSuccess(`It's a match on "${title}"! 🎉 Open Matches to start chatting.`);
      fetchMatches();
    });
    return () => { matchesService.unsubscribe(channel); };
  }, [user, fetchMatches, toastSuccess]);

  // Keep the open chat's status fields in sync with the live match list so a
  // change driven by the client (e.g. escrow funded) surfaces the "Submit Work"
  // action without a manual refresh. Preserves locally-enriched fields.
  useEffect(() => {
    if (!selectedChat?.id) return;
    const fresh = matches.find(m => m.id === selectedChat.id);
    if (!fresh) return;
    if (
      fresh.paymentStatus === selectedChat.paymentStatus &&
      fresh.revisionCount === selectedChat.revisionCount &&
      fresh.reviewDeadline === selectedChat.reviewDeadline
    ) return;
    setSelectedChat((prev: any) => prev ? {
      ...prev,
      paymentStatus: fresh.paymentStatus,
      revisionCount: fresh.revisionCount,
      reviewDeadline: fresh.reviewDeadline,
      match: fresh.match,
      contractAmount: fresh.contractAmount,
    } : prev);
  }, [matches, selectedChat?.id, selectedChat?.paymentStatus, selectedChat?.revisionCount, selectedChat?.reviewDeadline, setSelectedChat]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!user) return;
    // Ignore re-entry while a swipe is still being recorded.
    if (isSwiping.current) return;

    const job = displayJobs[currentJobIndex];
    if (!job) return;

    isSwiping.current = true;
    hapticsLight()
    const wasLast = currentJobIndex >= displayJobs.length - 1;

    // Optimistically advance: remove the swiped job and free the next card right
    // away so the deck moves at animation speed instead of waiting on the network.
    setJobs(prev => prev.filter(j => j.id !== job.id));

    if (direction === 'right') {
      setLastSwipedJob(job);
      setSwipeModalType('interest');
      setTimeout(() => setShowSwipeModal(true), 600);
    } else if (wasLast) {
      // Left swipe on the last job — show "no more" modal
      setTimeout(() => {
        setSwipeModalType('noMore');
        setShowSwipeModal(true);
      }, 700);
    }

    setTimeout(() => {
      isSwiping.current = false;
    }, 600);

    // Record the swipe in the background; reconcile a mutual match when it lands.
    // The match-list poll is a backstop if this response is slow.
    void handleSwipeService(
      user.id,
      job.clientId, // The client who posted the job
      job.id, // The job ID (target)
      'job',
      direction,
      selectedSkillProfileId || null // The skill profile being offered (context)
    ).then(({ match, error }) => {
      if (error) {
        console.error('Error recording swipe:', error);
        toastError('Could not record your swipe. Please try again.');
        return;
      }
      if (direction !== 'right') return;
      if (match && !celebratedMatchIds.current.has(match.id)) {
        // It's a match! Both parties swiped right
        celebratedMatchIds.current.add(match.id);
        setCelebrate(true);
        toastSuccess(`It's a match on "${job.title}"! 🎉`);
        fetchMatches();
      } else {
        toastInfo('Interest sent to the client');
      }
    });
  };

  // Keyboard swiping on the Discover tab: ← pass, → like. Placed after
  // handleSwipe so the handler is initialized before this effect references it.
  useEffect(() => {
    if (currentView !== 'discover') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') handleSwipe('left');
      else if (e.key === 'ArrowRight') handleSwipe('right');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, currentJobIndex, displayJobs, selectedSkillProfileId]);

  const handleSaveJob = (jobId: string) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter(id => id !== jobId));
    } else {
      setSavedJobs([...savedJobs, jobId]);
    }
  };

  // Wallet State
  const [linkedBankAccount, setLinkedBankAccount] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | null>(null);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  const nigerianBanks = [
    'Access Bank',
    'First Bank of Nigeria',
    'Guaranty Trust Bank (GTBank)',
    'United Bank for Africa (UBA)',
    'Zenith Bank',
    'Fidelity Bank',
    'Union Bank',
    'Stanbic IBTC Bank',
    'Sterling Bank',
    'Wema Bank',
    'Polaris Bank',
    'Keystone Bank',
    'Ecobank Nigeria',
    'FCMB',
    'Jaiz Bank',
    'Providus Bank',
    'Unity Bank',
    'Titan Trust Bank',
    'Globus Bank',
    'Parallex Bank',
    'Kuda Bank',
    'Opay',
    'Moniepoint',
    'PalmPay',
  ];

  const handleLinkBankAccount = () => {
    if (bankFormData.bankName && bankFormData.accountNumber && bankFormData.accountName) {
      setLinkedBankAccount({
        bankName: bankFormData.bankName,
        accountNumber: bankFormData.accountNumber,
        accountName: bankFormData.accountName,
      });
      setShowAddBankModal(false);
      setBankFormData({ bankName: '', accountNumber: '', accountName: '' });
    }
  };

  const renderWallet = () => {
    const txMeta = (t: any) => {
      if (t.type === 'credit' || t.type === 'escrow_out') return { sign: '+', color: 'var(--bx-green)', bg: 'rgba(15,157,118,0.16)', Icon: Check, label: t.description || 'Payment received' };
      if (t.type === 'escrow_in') return { sign: '', color: 'var(--bx-amber)', bg: 'rgba(217,138,0,0.16)', Icon: Clock, label: t.description || 'Held in escrow' };
      return { sign: '−', color: 'var(--bx-muted)', bg: 'var(--bx-card-2)', Icon: DollarSign, label: t.description || 'Withdrawal' };
    };
    return (
    <div className="bx" style={{ minHeight: '100%' }}>
      {/* header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bx-solid)', borderBottom: '1px solid var(--bx-line)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setCurrentView('dashboard')} className="bx-onb__x" style={{ width: 38, height: 38 }}><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <div style={{ fontWeight: 750, color: 'var(--bx-ink)', fontSize: 16 }}>Wallet</div>
          <div className="bx__sub" style={{ marginTop: 0 }}>Earnings &amp; payouts</div>
        </div>
      </div>

      <div className="bx__wrap" style={{ paddingTop: 16, maxWidth: 1120 }}>
        {/* demo notice */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bx__tile"
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16, background: 'rgba(217,138,0,0.10)', borderColor: 'rgba(217,138,0,0.3)' }}>
          <Sparkles className="w-5 h-5" style={{ color: 'var(--bx-amber)', flex: 'none', marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--bx-ink)' }}>Demo credits — not real money</div>
            <div className="bx__sub" style={{ marginTop: 3 }}>Balances are simulated credits while payout integration is finished. They have no cash value and cannot be withdrawn yet.</div>
          </div>
        </motion.div>

        <div className="wl-grid">
          {/* Left: balance + payout method */}
          <div className="wl-col">
            <motion.div className="wl-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="wl-hero__label">Available balance</div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center' }}><Wallet className="w-5 h-5" /></div>
              </div>
              <div className="wl-hero__bal">₦{(walletData?.balance ?? 0).toLocaleString()}</div>
              <div className="wl-hero__row">
                <div><span className="wl-hero__label">In escrow</span><b>₦{(walletData?.pending ?? 0).toLocaleString()}</b></div>
                <div><span className="wl-hero__label">Total earned</span><b>₦{stats.totalEarnings.toLocaleString()}</b></div>
              </div>
            </motion.div>

            <motion.div className="bx__tile" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <div className="bx__t-head" style={{ marginBottom: 14 }}>
                <div className="bx__t-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Building2 className="w-4 h-4" style={{ color: 'var(--bx-accent)' }} /> Payout method</div>
              </div>
              {linkedBankAccount ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bx-green)', display: 'grid', placeItems: 'center', flex: 'none' }}><Check className="w-4 h-4 text-white" /></span>
                    <span style={{ fontWeight: 650, color: 'var(--bx-green)', fontSize: 13.5 }}>Bank account linked</span>
                  </div>
                  {[['Bank', linkedBankAccount.bankName], ['Account', `****${linkedBankAccount.accountNumber.slice(-4)}`], ['Name', linkedBankAccount.accountName]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span className="bx__sub" style={{ marginTop: 0 }}>{k}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--bx-ink)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '14px 4px' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'var(--bx-card-2)', color: 'var(--bx-faint)', margin: '0 auto 12px' }}><CreditCard className="w-7 h-7" /></div>
                  <div style={{ fontWeight: 700, color: 'var(--bx-ink)' }}>No payout method yet</div>
                  <div className="bx__sub" style={{ marginTop: 4 }}>Link a bank account to set where your earnings will go. Real payouts aren’t available yet.</div>
                  <button onClick={() => setShowAddBankModal(true)}
                    style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 13, border: 'none', cursor: 'pointer', background: 'var(--bx-grad)', color: '#fff', fontSize: 13.5, fontWeight: 700, boxShadow: 'var(--bx-glow)' }}>
                    <Plus className="w-4 h-4" /> Link bank account
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: transactions + escrow note */}
          <div className="wl-col">
            <motion.div className="bx__tile" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="bx__t-head" style={{ marginBottom: 6 }}>
                <div className="bx__t-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock className="w-4 h-4" style={{ color: 'var(--bx-accent)' }} /> Recent transactions</div>
              </div>
              {transactions.length === 0 ? (
                <div className="bx__empty">No transactions yet — completed projects will show up here.</div>
              ) : (
                <div>
                  {transactions.slice(0, 9).map((t: any, i: number) => {
                    const m = txMeta(t);
                    return (
                      <div key={t.id || i} className="wl-txn">
                        <div className="wl-txn__ic" style={{ background: m.bg, color: m.color }}><m.Icon className="w-5 h-5" /></div>
                        <div className="wl-txn__main">
                          <div className="wl-txn__t">{m.label}</div>
                          <div className="wl-txn__d">{t.created_at ? new Date(t.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</div>
                        </div>
                        <div className="wl-txn__amt" style={{ color: m.color }}>{m.sign}₦{Number(t.amount || 0).toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            <motion.div className="bx__tile" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, background: 'rgba(37,99,235,0.08)', borderColor: 'rgba(37,99,235,0.28)' }}>
              <Shield className="w-5 h-5" style={{ color: 'var(--bx-blue)', flex: 'none', marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--bx-ink)' }}>How escrow works</div>
                <div className="bx__sub" style={{ marginTop: 3 }}>Funds are held in escrow until you complete the work and the client approves, then released to your balance.</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Add Bank Account Modal */}
      <AnimatePresence>
        {showAddBankModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowAddBankModal(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
              style={{ background: 'var(--bx-solid)' }}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between sticky top-0 z-10" style={{ borderBottom: '1px solid var(--bx-line)', background: 'var(--bx-solid)' }}>
                <h3 className="text-lg font-bold" style={{ color: 'var(--bx-ink)' }}>Link Bank Account</h3>
                <button
                  onClick={() => setShowAddBankModal(false)}
                  className="p-2 rounded-full transition-colors"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--bx-muted)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* Bank Selection */}
                <div>
                  <label className="bx-label">
                    Select Bank
                  </label>
                  <select
                    value={bankFormData.bankName}
                    onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                    className="jb-input"
                  >
                    <option value="">Choose a bank</option>
                    {nigerianBanks.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label className="bx-label">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankFormData.accountNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setBankFormData({ ...bankFormData, accountNumber: value });
                    }}
                    placeholder="Enter 10-digit account number"
                    className="jb-input"
                    maxLength={10}
                  />
                </div>

                {/* Account Name */}
                <div>
                  <label className="bx-label">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={bankFormData.accountName}
                    onChange={(e) => setBankFormData({ ...bankFormData, accountName: e.target.value })}
                    placeholder="Enter account holder name"
                    className="jb-input"
                  />
                </div>

                {/* Info Notice */}
                <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(217,138,0,0.12)', border: '1px solid rgba(217,138,0,0.3)' }}>
                  <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--bx-amber)' }} />
                  <p className="text-xs" style={{ color: 'var(--bx-ink-soft)' }}>
                    Please ensure the account name matches your registered name on Lowkey Gem for successful withdrawals.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5" style={{ borderTop: '1px solid var(--bx-line)', background: 'var(--bx-card-2)' }}>
                <motion.button
                  onClick={handleLinkBankAccount}
                  disabled={!bankFormData.bankName || bankFormData.accountNumber.length !== 10 || !bankFormData.accountName}
                  className="w-full py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed accent-bg"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Link Account
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    );
  };

  const renderDashboard = () => (
    <div className="bx">
     <div className="bx__wrap">
      {/* Header */}
      <motion.div className="bx__head" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <div className="bx__eyebrow">Freelancer · Overview</div>
          <h1 className="bx__hi">{profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}` : 'Overview'}</h1>
          <div className="bx__sub">Here’s how your freelance work is going.</div>
        </div>
        <button
          onClick={() => setCurrentView('discover')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', padding: '12px 20px', borderRadius: 13, border: 'none', cursor: 'pointer', background: 'var(--bx-grad)', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: 'var(--bx-glow)' }}
        >
          <Zap className="w-4 h-4" /> Discover jobs
        </button>
      </motion.div>

      {/* Summary strip */}
      <motion.div className="jb-summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        {[
          { icon: Briefcase, label: 'Active jobs', value: stats.activeJobs, tint: 'var(--bx-accent)' },
          { icon: DollarSign, label: 'Earnings', value: stats.totalEarnings, tint: 'var(--bx-accent-2)', format: (n: number) => `₦${(n / 1000).toFixed(0)}k` },
          { icon: CheckCircle, label: 'Completed', value: stats.completedJobs, tint: '#0f9d76' },
          { icon: Heart, label: 'Matches', value: stats.newMatches, tint: '#e11d6b' },
        ].map((s) => (
          <motion.button key={s.label} className="jb-sum"
            whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
            style={{ cursor: 'pointer', textAlign: 'left', width: '100%', border: 'none', font: 'inherit', color: 'inherit' }}>
            <div className="jb-sum__v"><CountUp value={s.value} format={s.format} /></div>
            <div className="jb-sum__l"><s.icon className="w-3.5 h-3.5" style={{ color: s.tint }} /> {s.label}</div>
          </motion.button>
        ))}
      </motion.div>

      {/* Skill Switcher */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        style={{ margin: '14px 0' }}>
        <SkillSwitcher
          skills={skillProfiles.map(s => ({ id: s.id, headline: s.headline, category: s.category, status: s.status }))}
          selectedSkillId={selectedSkillProfileId}
          onSelectSkill={setSelectedSkillProfileId}
        />
      </motion.div>

      {/* Onboarding */}
      <OnboardingChecklist
        userType="freelancer"
        profile={profile}
        hasSkillProfiles={skillProfiles.length > 0}
        hasBankLinked={walletData?.bankLinked || false}
        onNavigate={(view) => setCurrentView(view as ViewType)}
      />

      {/* Bento */}
      <motion.div className="bx__bento" variants={staggerContainer(0.06)} initial="hidden" animate="show"
        style={{ marginTop: 18 }}>
        {/* HERO — wallet / earnings */}
        <motion.button variants={fadeRise} className="bx__tile bx__tile--wide bx__tile--btn" onClick={() => setCurrentView('wallet')}>
          <div className="bx__t-top">
            <div className="bx__t-icon" style={{ background: 'rgba(var(--bx-accent-rgb),0.12)', color: 'var(--bx-accent)', boxShadow: 'none' }}><Wallet className="w-5 h-5" /></div>
            <ChevronRight className="w-4 h-4 bx__t-chev" />
          </div>
          <div className="bx__hero-body">
            <div className="bx__t-label">Available balance</div>
            <div className="bx__metric bx__metric--lg">₦<CountUp value={walletData?.balance ?? 0} /></div>
            <div className="bx__hero-row" style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--bx-line)' }}>
              <div className="bx__hero-stat"><span className="bx__t-label" style={{ marginTop: 0 }}>In escrow</span><b>₦{(walletData?.pending ?? 0).toLocaleString()}</b></div>
              <div className="bx__hero-stat"><span className="bx__t-label" style={{ marginTop: 0 }}>Active jobs</span><b>{stats.activeJobs}</b></div>
            </div>
          </div>
        </motion.button>

        {/* Quick Actions (2x2) */}
        <motion.div variants={fadeRise} className="bx__tile bx__tile--wide"
          style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bx__t-head"><div className="bx__t-title">Quick Actions</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, marginTop: 6 }}>
            {[
              { icon: Zap, label: 'Find jobs', sub: 'Start swiping', bg: 'var(--bx-grad)', view: 'discover' as ViewType },
              { icon: MessageSquare, label: 'Messages', sub: 'View matches', bg: '#0e1116', view: 'matches' as ViewType },
              { icon: Briefcase, label: 'My skills', sub: 'Manage profiles', bg: 'var(--bx-accent-2)', view: 'mySkills' as ViewType },
              { icon: DollarSign, label: 'Wallet', sub: 'Earnings & payout', bg: '#0f9d76', view: 'wallet' as ViewType },
            ].map((a) => (
              <motion.button key={a.label} onClick={() => setCurrentView(a.view)}
                whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
                  padding: 18, borderRadius: 18, border: '1px solid var(--bx-line)',
                  background: 'var(--bx-card-2)', cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'box-shadow 0.22s var(--bx-ease), border-color 0.22s',
                  font: 'inherit', color: 'inherit',
                }}>
                <span style={{
                  width: 44, height: 44, borderRadius: 13, display: 'grid', placeItems: 'center',
                  background: a.bg, color: '#fff', flex: 'none', boxShadow: '0 8px 16px -8px rgba(0,0,0,0.3)',
                }}>
                  <a.icon className="w-5 h-5" />
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bx-ink)' }}>{a.label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--bx-muted)', marginTop: 2 }}>{a.sub}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent matches (full width) */}
        <motion.div variants={fadeRise} className="bx__tile"
          style={{ gridColumn: '1 / -1' }}>
          <div className="bx__t-head">
            <div className="bx__t-title">Recent matches</div>
            <a href="/freelancer/matches" onClick={(e) => { e.preventDefault(); setCurrentView('matches') }} className="bx__t-link">View all <ChevronRight className="w-3.5 h-3.5" /></a>
          </div>
          {matches.length === 0 ? (
            <div className="bx__empty">No matches yet — start swiping to connect.</div>
          ) : (
            <div className="bx__list">
              {matches.slice(0, 6).map((match) => (
                <button key={match.id} className="bx__listrow" onClick={() => setSelectedChat(match)}>
                  <div className="bx__av">
                    {typeof match.clientAvatar === 'string' && match.clientAvatar.startsWith('http')
                      ? <img src={match.clientAvatar} alt="" />
                      : <span>{(match.clientName || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}</span>}
                  </div>
                  <div className="bx__lr-main">
                    <div className="bx__lr-title">{match.jobTitle}</div>
                    <div className="bx__lr-sub">{match.lastMessage}</div>
                  </div>
                  {match.unreadCount > 0 && <span className="bx__count">{match.unreadCount}</span>}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
      <button
        onClick={toggleTheme}
        title={isDark ? 'Light mode' : 'Dark mode'}
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          right: 16,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid var(--bx-line)',
          background: 'var(--bx-card-2)',
          color: isDark ? '#f59e0b' : '#6366f1',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          zIndex: 10001,
          boxShadow: 'var(--bx-shadow)',
        }}
      >
        {isDark ? '☀' : '☾'}
      </button>
     </div>
    </div>
  );

  const renderDiscover = () => {
    // Loading state
    if (isLoadingJobs) {
      return (
        <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 60px)', paddingBottom: '70px', background: 'var(--bx-bg)' }}>
          <SimpleLoader message="Loading jobs..." size="medium" />
        </div>
      );
    }

    // No jobs available at all
    if (displayJobs.length === 0) {
      return (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 60px)', paddingBottom: '70px', background: 'var(--bx-bg)' }}>
          <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4" style={{ background: 'var(--bx-solid)', borderBottom: '1px solid var(--bx-line)' }}>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--bx-ink)' }}>
              Discover Jobs
            </h2>
          </div>
          <EmptyState
            icon={Briefcase}
            title="No Jobs Available"
            description={skillProfiles.length === 0
              ? "Create a skill profile first so clients can find you, then check back for matching jobs!"
              : "No jobs match your skills right now. Check back soon for new opportunities!"}
            ctaLabel={skillProfiles.length === 0 ? "Create Skill Profile" : "Refresh"}
            onCtaClick={() => skillProfiles.length === 0 ? setCurrentView('addSkillProfile') : fetchJobs()}
          />
        </div>
      );
    }

    const activeProfile = skillProfiles.find(sp => sp.id === selectedSkillProfileId) || skillProfiles[0];
    const total = displayJobs.length;
    const remaining = Math.max(0, total - currentJobIndex);
    const progressPct = total > 0 ? Math.min(100, (currentJobIndex / total) * 100) : 0;
    const current = displayJobs[currentJobIndex];
    const exhausted = currentJobIndex >= displayJobs.length;

    const heroImg = current && (current.portfolioImage || (typeof current.clientAvatar === 'string' && current.clientAvatar.startsWith('http') ? current.clientAvatar : null));

    // Fling the card off-screen, then advance to the next job.
    const commitSwipe = (dir: 'left' | 'right') => {
      setSwipeDir(dir);
      setSwipeExit(dir === 'right' ? 560 : -560);
      setTimeout(() => {
        handleSwipe(dir);
        swipeX.set(0);
        setSwipeExit(0);
        setSwipeDir(null);
      }, 330);
    };

    return (
      <div className="bx" style={{ minHeight: '100%' }}>
        <div className="disc2">
          {/* sticky context bar */}
          <div className="disc2__bar">
            <div className="disc2__bar-row">
              <div>
                <h2>Discover Jobs</h2>
                <p>
                  {remaining} {remaining === 1 ? 'opportunity' : 'opportunities'} left
                  {activeProfile && <> · offering <b>{activeProfile.headline}</b></>}
                </p>
              </div>
              {current && (
                <motion.button
                  onClick={() => handleSaveJob(current.id)}
                  className={`disc2__save ${savedJobs.includes(current.id) ? 'on' : ''}`}
                  whileTap={{ scale: 0.92 }}
                  aria-label={savedJobs.includes(current.id) ? 'Saved' : 'Save'}
                >
                  <Bookmark className="w-5 h-5" fill={savedJobs.includes(current.id) ? 'currentColor' : 'none'} />
                </motion.button>
              )}
            </div>
            <div className="disc2__prog"><i style={{ width: `${progressPct}%` }} /></div>
          </div>

          {exhausted || !current ? (
            <div className="disc2__done">
              <motion.div className="disc2__done-badge" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
                <Sparkles className="w-9 h-9" fill="currentColor" />
              </motion.div>
              <h3>You're all caught up</h3>
              <p>You've seen every job matching this skill. Switch skills or check back soon for fresh opportunities.</p>
              <div className="disc2__done-stats">
                <div className="disc2__done-stat"><b><CountUp value={matches.length} /></b><span>Matches</span></div>
                <div className="disc2__done-stat"><b><CountUp value={total} /></b><span>Viewed</span></div>
                <div className="disc2__done-stat"><b><CountUp value={savedJobs.length} /></b><span>Saved</span></div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="disc2__act disc2__act--like" style={{ flex: 'none', padding: '13px 22px' }} onClick={() => setCurrentView('matches')}>View matches</button>
                <button className="disc2__act disc2__act--skip" style={{ flex: 'none', padding: '13px 22px' }} onClick={() => fetchJobs()}>Refresh deck</button>
              </div>
            </div>
          ) : (
            <>
              <motion.div
                className="disc2__swipe"
                style={{ x: swipeX }}
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={(_e, info) => {
                  const committed = Math.abs(info.offset.x) > 120 || Math.abs(info.velocity.x) > 520;
                  if (committed) commitSwipe(info.offset.x > 0 ? 'right' : 'left');
                  else swipeX.set(0);
                }}
                animate={swipeExit !== 0 ? { x: swipeExit } : { x: 0 }}
                transition={swipeExit !== 0 ? { duration: 0.34, ease: [0.16, 1, 0.3, 1] } : { type: 'spring', stiffness: 320, damping: 30 }}
              >
                <motion.span className="disc2__stamp like" style={{ opacity: swipeLikeOp }}>Like</motion.span>
                <motion.span className="disc2__stamp nope" style={{ opacity: swipeNopeOp }}>Nope</motion.span>
                {swipeDir && <div className="disc2__tint" style={{ background: swipeDir === 'right' ? 'rgba(15,157,118,0.16)' : 'rgba(239,68,68,0.16)' }} />}
              <div className="disc2__scroll">
                {/* hero image */}
                <div className="disc2__gallery">
                  <div className="disc2__photo">
                    {heroImg ? (
                      <img src={heroImg} alt={current.title} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'var(--bx-grad)', color: '#fff' }}>
                        <Briefcase className="w-16 h-16" />
                      </div>
                    )}
                    {current.verified && <div className="disc2__badge"><Check className="w-3.5 h-3.5" /> Verified client</div>}
                    {current.clientRating && <div className="disc2__rating"><Star className="w-3.5 h-3.5" style={{ fill: '#facc15', color: '#facc15' }} />{current.clientRating}</div>}
                  </div>
                </div>

                {/* title + meta */}
                <div className="disc2__sect" style={{ marginTop: 20 }}>
                  <div className="disc2__name">{current.title}</div>
                  <div className="disc2__role">{current.category}</div>
                  <div className="disc2__meta">
                    <span><User className="w-4 h-4" />{current.clientName}</span>
                    {current.clientLocation && <span><MapPin className="w-4 h-4" />{current.clientLocation}</span>}
                    {current.deadline && <span className="disc2__avail"><Clock className="w-4 h-4" />{current.deadline}</span>}
                  </div>
                </div>

                {/* stats */}
                <div className="disc2__sect">
                  <div className="disc2__stats">
                    <div className="disc2__stat"><b>₦{((current.budget ?? 0) / 1000).toFixed(0)}k</b><span>Budget</span></div>
                    <div className="disc2__stat"><b>{current.deadline}</b><span>Deadline</span></div>
                    <div className="disc2__stat"><b>{current.experience}</b><span>Level</span></div>
                  </div>
                </div>

                {/* description */}
                {current.description && (
                  <div className="disc2__sect">
                    <div className="disc2__sect-t"><Briefcase className="w-5 h-5" style={{ color: 'var(--bx-accent-2)' }} /> About the role</div>
                    <p className="disc2__bio">{current.description}</p>
                  </div>
                )}

                {/* required skills */}
                {current.requiredSkills?.length > 0 && (
                  <div className="disc2__sect">
                    <div className="disc2__sect-t">Required Skills</div>
                    <div className="disc2__skills">
                      {current.requiredSkills.map((skill: string, i: number) => <span key={i} className="disc2__skill">{skill}</span>)}
                    </div>
                  </div>
                )}
              </div>
              </motion.div>

              {/* fixed action bar */}
              <div className="disc2__actions">
                <div className="disc2__actions-in">
                  <motion.button className="disc2__act disc2__act--skip" onClick={() => commitSwipe('left')} whileTap={{ scale: 0.97 }}>
                    <X className="w-5 h-5" /> Skip
                  </motion.button>
                  <motion.button className="disc2__act disc2__act--like" onClick={() => commitSwipe('right')} whileTap={{ scale: 0.97 }}>
                    <Heart className="w-5 h-5" fill="currentColor" /> I'm Interested
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderMatches = () => {
    const getTimeAgo = (date: Date) => {
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMins = Math.floor(diffInMs / 60000);
      const diffInHours = Math.floor(diffInMs / 3600000);
      const diffInDays = Math.floor(diffInMs / 86400000);

      if (diffInMins < 60) return `${diffInMins} min`;
      if (diffInHours < 24) return `${diffInHours} hr`;
      if (diffInDays < 7) return `${diffInDays} days`;
      return 'Last week';
    };

    // Loading state
    if (isLoadingMatches) {
      return <MatchListSkeleton />;
    }

    const statusBadge = (status: string) => {
      switch (status) {
        case 'matched': return <span className="bx__badge" style={{ background: 'var(--bx-amber)', fontSize: 10, padding: '2px 8px', height: 'auto' }}>Awaiting Payment</span>;
        case 'funded': return <span className="bx__badge" style={{ background: 'var(--bx-green)', fontSize: 10, padding: '2px 8px', height: 'auto' }}>In Progress</span>;
        case 'pending_approval': return <span className="bx__badge" style={{ background: 'var(--bx-accent-2)', fontSize: 10, padding: '2px 8px', height: 'auto' }}>In Review</span>;
        case 'completed': return <span className="bx__badge" style={{ background: 'var(--bx-muted)', fontSize: 10, padding: '2px 8px', height: 'auto' }}>Completed</span>;
        default: return null;
      }
    };

    // Empty state
    if (matches.length === 0) {
      return (
        <div className="bx__wrap">
          <div className="bx__eyebrow" style={{ marginBottom: 16 }}>Matches</div>
          <EmptyState
            icon={Heart}
            title="No Matches Yet"
            description="Keep swiping on jobs that interest you. When a client likes you back, you'll match and can start chatting!"
            ctaLabel="Discover Jobs"
            onCtaClick={() => setCurrentView('discover')}
          />
        </div>
      );
    }

    return (
      <div className="bx" style={{ minHeight: '100%' }}>
      <div className="bx__wrap">
        {/* Header */}
        <div className="bx__eyebrow" style={{ marginBottom: 16 }}>Matches</div>

        {/* Horizontal Scrolling Match Avatars */}
        <div className="bx__list" style={{ flexDirection: 'row', gap: 16, overflowX: 'auto', paddingBottom: 12, scrollSnapType: 'x mandatory' }}>
          {matches.map((match) => {
            const getInitials = (name: string) => {
              const words = name.split(' ');
              if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
              return name.substring(0, 2).toUpperCase();
            };
            return (
              <motion.button
                key={match.id}
                onClick={() => setSelectedChat(match)}
                className="flex flex-col items-center gap-2 flex-shrink-0"
                style={{ scrollSnapAlign: 'start' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <div className="bx__av" style={{ width: 56, height: 56, borderRadius: '50%', fontSize: 20 }}>
                    {typeof match.clientAvatar === 'string' && match.clientAvatar.startsWith('http') ? (
                      <img src={match.clientAvatar} alt={match.clientName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{match.clientAvatar || getInitials(match.clientName)}</span>
                    )}
                  </div>
                  {match.unreadCount > 0 && (
                    <div className="bx__count" style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, minWidth: 20 }}>
                      {match.unreadCount}
                    </div>
                  )}
                </div>
                <div className="bx__lr-sub" style={{ maxWidth: 64 }}>{match.clientName.split(' ')[0]}</div>
              </motion.button>
            );
          })}
        </div>

        {/* Filter by job / status */}
        {(() => {
          const jobFilters = Array.from(new Set(matches.map(m => m.jobTitle).filter(Boolean))) as string[];
          const activeFilter = matchFilter;
          const statusActive = matchStatusFilter;
          return (
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              <button
                onClick={() => { setMatchFilter('all'); setMatchStatusFilter('all'); }}
                className={`bx__badge ${activeFilter === 'all' && statusActive === 'all' ? 'accent-bg text-white' : 'sf-card2 tx-soft'}`}
                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                All
              </button>
              <button
                onClick={() => { setMatchFilter('all'); setMatchStatusFilter('completed'); }}
                className={`bx__badge ${statusActive === 'completed' ? 'accent-bg text-white' : 'sf-card2 tx-soft'}`}
                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                Completed
              </button>
              {jobFilters.map(job => (
                <button
                  key={job}
                  onClick={() => { setMatchFilter(job); setMatchStatusFilter('all'); }}
                  className={`bx__badge ${activeFilter === job ? 'accent-bg text-white' : 'sf-card2 tx-soft'}`}
                  style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {job}
                </button>
              ))}
            </div>
          );
        })()}

        {/* Messages List */}
        <div className="bx__list">
          {(() => {
            let filtered = matches;
            if (matchStatusFilter === 'completed') filtered = filtered.filter(m => m.paymentStatus === 'completed');
            else if (matchFilter !== 'all') filtered = filtered.filter(m => m.jobTitle === matchFilter);
            return filtered.map((match) => (
            <motion.button
              key={match.id}
              onClick={() => setSelectedChat(match)}
              className="bx__listrow"
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="bx__av" style={{ position: 'relative' }}>
                {typeof match.clientAvatar === 'string' && match.clientAvatar.startsWith('http') ? (
                  <img src={match.clientAvatar} alt={match.clientName} className="w-full h-full object-cover" />
                ) : (
                  <span>{(match.clientName || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}</span>
                )}
                {match.unreadCount > 0 && (
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: 'var(--bx-accent-3)', border: '2px solid var(--bx-card)' }} />
                )}
              </div>

              <div className="bx__lr-main">
                <div className="bx__lr-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {match.clientName}
                  {statusBadge(match.paymentStatus)}
                </div>
                <div className="bx__lr-sub">{match.lastMessage}</div>
              </div>

              <div className="bx__lr-sub" style={{ flexShrink: 0, fontSize: 11 }}>
                {getTimeAgo(match.matchedAt)}
              </div>
            </motion.button>
          ))})()}
        </div>
      </div>
      </div>
    );
  };

  const renderSaved = () => (
    <div className="bx" style={{ minHeight: '100%' }}>
    <div className="bx__wrap">
      <div className="bx__eyebrow" style={{ marginBottom: 16 }}>Saved Jobs</div>

      {savedJobs.length === 0 ? (
        <div className="bx__empty" style={{ padding: '60px 20px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(var(--bx-accent-rgb),0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookmarkPlus className="w-10 h-10" style={{ color: 'var(--bx-accent-2)' }} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--bx-ink)', marginBottom: 8 }}>No Saved Jobs</h3>
          <p style={{ fontSize: 14, color: 'var(--bx-muted)', maxWidth: 280, margin: '0 auto 24px' }}>
            Bookmark jobs while swiping to review them later
          </p>
          <motion.button
            onClick={() => setCurrentView('discover')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '12px 24px', borderRadius: 13, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 14, color: '#fff',
              background: 'linear-gradient(120deg, var(--bx-accent), var(--bx-accent-2))',
              boxShadow: 'var(--bx-glow)',
            }}
          >
            Start Discovering
          </motion.button>
        </div>
      ) : (
        <div className="bx__list">
          {displayJobs
            .filter(j => savedJobs.includes(j.id))
            .map((job) => (
              <motion.button
                key={job.id}
                onClick={() => {
                  setCurrentJobIndex(displayJobs.findIndex(j => j.id === job.id));
                  setPreviousView('saved');
                  setCurrentView('profileDetail');
                }}
                className="bx__listrow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="bx__av" style={{ position: 'relative' }}>
                  {job.portfolioImage
                    ? <img src={job.portfolioImage} alt={job.title} className="w-full h-full object-cover" />
                    : <span>{(job.title || '?').charAt(0).toUpperCase()}</span>}
                  {job.verified && (
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: 'var(--bx-accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bx-card)' }}>
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                </div>

                <div className="bx__lr-main">
                  <div className="bx__lr-title">{job.title}</div>
                  <div className="bx__lr-sub">{job.category}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <span className="bx__lr-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                      <DollarSign className="w-3 h-3" />
                      ₦{((job.budget ?? 0) / 1000).toFixed(0)}k
                    </span>
                    <span className="bx__lr-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                      <Clock className="w-3 h-3" />
                      {job.deadline}
                    </span>
                  </div>
                </div>

                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveJob(job.id);
                  }}
                  style={{ padding: 8, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--bx-muted)', flexShrink: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </motion.button>
            ))}
        </div>
      )}
    </div>
    </div>
  );

  const renderProfileDetail = () => {
    const job = displayJobs[currentJobIndex];
    if (!job) return null;

    const handleSwipeButton = (direction: 'left' | 'right') => {
      handleSwipe(direction);
      setCurrentView('discover');
    };

    return (
      <div className="bx__wrap" style={{ paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}>
        {/* Header with Back Button */}
        <div className="bx__t-head" style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bx-card)', borderBottom: '1px solid var(--bx-line)', marginBottom: 0, padding: '12px 0' }}>
          <motion.button
            onClick={() => setCurrentView(previousView)}
            style={{ padding: 8, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--bx-ink)' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
          <span className="bx__t-title">Job Details</span>
          <div />
        </div>

        {/* Job Info */}
        <div style={{ marginTop: 20 }}>
          {/* Title & Client */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--bx-ink)', marginBottom: 6 }}>
              {job.title}
            </h3>
            <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--bx-accent-2)', fontWeight: 600, marginBottom: 12 }}>
              {job.category}
            </p>

            {/* Client & Location */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--bx-muted)' }}>
                <User className="w-4 h-4" />
                {job.clientName}
              </span>
              {job.clientLocation && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--bx-muted)' }}>
                  <MapPin className="w-4 h-4" />
                  {job.clientLocation}
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24, padding: 16, borderRadius: 'var(--bx-radius)', background: 'var(--bx-card-2)', border: '1px solid var(--bx-line)' }}>
            {[
              { value: `₦${((job.budget ?? 0) / 1000).toFixed(0)}k`, label: 'Budget' },
              { value: job.deadline, label: 'Deadline' },
              { value: job.experience, label: 'Level' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 800, color: 'var(--bx-accent-2)', marginBottom: 4 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 13, color: 'var(--bx-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {job.description && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--bx-ink)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase className="w-5 h-5" style={{ color: 'var(--bx-accent-2)' }} />
                Job Description
              </h4>
              <p style={{ fontSize: 14, color: 'var(--bx-ink-soft)', lineHeight: 1.7 }}>
                {job.description}
              </p>
            </div>
          )}

          {/* Required Skills */}
          {job.requiredSkills?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--bx-ink)', marginBottom: 12 }}>Required Skills</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {job.requiredSkills.map((skill: string, index: number) => (
                  <span key={index} style={{ padding: '6px 14px', background: 'rgba(var(--bx-accent-rgb),0.12)', color: 'var(--bx-accent-2)', borderRadius: 999, fontSize: 13, fontWeight: 500 }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', gap: 12, background: 'var(--bx-card)', borderTop: '1px solid var(--bx-line)', padding: '12px 16px calc(88px + env(safe-area-inset-bottom, 0px))', zIndex: 30 }}>
          <motion.button
            onClick={() => handleSwipeButton('left')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 14, border: '2px solid var(--bx-line)', background: 'none', color: 'var(--bx-ink-soft)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <X className="w-5 h-5" />
            Skip
          </motion.button>
          <motion.button
            onClick={() => handleSwipeButton('right')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 14, border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'var(--bx-grad)', boxShadow: 'var(--bx-glow)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Heart className="w-5 h-5" />
            I'm Interested
          </motion.button>
        </div>
      </div>
    );
  };

  return (
    <div className="bx min-h-screen flex flex-col">
      <Celebration show={celebrate} onDone={() => setCelebrate(false)} />
      {/* Header */}
      <header className={`sticky top-0 z-40 ${currentView === 'discover' ? 'hidden sm:block' : ''}`} style={{ background: 'var(--bx-solid)', borderBottom: '1px solid var(--bx-line)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Left - Hamburger Menu */}
          <motion.button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full transition-colors"
            style={{ color: 'var(--bx-ink)', background: 'none', border: 'none', cursor: 'pointer' }}
            whileHover={{ scale: 1.05, background: 'var(--bx-card-2)' }}
            whileTap={{ scale: 0.95 }}
          >
            {showMenu ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </motion.button>

          {/* Center - Logo */}
          <Logo textColor="var(--bx-ink)" />

          {/* Right - Notifications */}
          <motion.button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-6 h-6" strokeWidth={1.5} style={{ color: 'var(--bx-ink-soft)' }} />
            {unreadCount > 0 && (
              <div
                className="absolute flex items-center justify-center rounded-full"
                style={{
                  top: '-4px',
                  right: '-6px',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 5px',
                  background: 'var(--bx-accent-3)',
                  border: '2px solid var(--bx-card)',
                }}
              >
                <span className="text-white text-[10px] font-bold">{unreadCount}</span>
              </div>
            )}
          </motion.button>
        </div>

        {/* Notifications Panel - Slide from right on mobile */}
        <AnimatePresence>
          {showNotifications && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNotifications(false)}
                className="fixed inset-0 bg-black/50 z-40"
              />

              {/* Notifications Panel - Full slide on mobile, dropdown on desktop */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full sm:w-96 sm:max-w-md sm:top-16 sm:bottom-auto sm:rounded-2xl z-50 overflow-hidden"
                style={{ background: 'var(--bx-solid)', boxShadow: 'var(--bx-shadow-lg)', border: '1px solid var(--bx-line)', backdropFilter: 'blur(24px) saturate(160%)', WebkitBackdropFilter: 'blur(24px) saturate(160%)' }}
              >
                {/* Header */}
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--bx-line)', background: 'var(--bx-card-2)' }}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="sm:hidden p-2 rounded-full transition-colors"
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--bx-muted)' }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--bx-ink)' }}>Notifications</h3>
                      <p className="text-sm" style={{ color: 'var(--bx-muted)' }}>{unreadCount} unread</p>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm font-medium accent-text hover:underline"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--bx-faint)' }} />
                      <p style={{ color: 'var(--bx-muted)' }}>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <motion.button
                        key={notification.id}
                        onClick={() => {
                          markNotificationAsRead(notification.id);
                          setShowNotifications(false);
                          // Navigate based on notification type
                          if (notification.type === 'match' || notification.type === 'message') {
                            setCurrentView('matches');
                          } else if (notification.type === 'job') {
                            setCurrentView('discover');
                          }
                        }}
                        className="w-full p-4 flex items-start gap-3 transition-colors text-left"
                        style={{ borderBottom: '1px solid var(--bx-line)', background: !notification.read ? 'rgba(var(--bx-accent-rgb),0.05)' : 'transparent', border: 'none', borderBottomWidth: 1, cursor: 'pointer' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'var(--bx-card-2)' }}>
                          {notification.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-sm" style={{ color: !notification.read ? 'var(--bx-ink)' : 'var(--bx-ink-soft)' }}>
                              {notification.title}
                            </span>
                            <span className="text-xs flex-shrink-0" style={{ color: 'var(--bx-muted)' }}>
                              {getTimeAgoNotification(notification.time)}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2" style={{ color: !notification.read ? 'var(--bx-ink-soft)' : 'var(--bx-muted)' }}>
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 accent-bg rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </motion.button>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Menu Dropdown */}
        <AnimatePresence>
          {showMenu && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMenu(false)}
                className="fixed inset-0 bg-black/50 z-40"
              />
              
              {/* Slide-in Menu */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] z-50"
                style={{ background: 'var(--bx-solid)', boxShadow: 'var(--bx-shadow-lg)', borderRight: '1px solid var(--bx-line)', backdropFilter: 'blur(24px) saturate(160%)', WebkitBackdropFilter: 'blur(24px) saturate(160%)' }}
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-6" style={{ borderBottom: '1px solid var(--bx-line)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <Logo textColor="var(--bx-ink)" />
                      <button
                        onClick={() => setShowMenu(false)}
                        className="p-2 rounded-full transition-colors"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--bx-ink)' }}
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div>
                      <div className="bx__eyebrow">Navigation</div>
                      <h3 className="font-bold text-lg" style={{ color: 'var(--bx-ink)' }}>Freelancer Account</h3>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-4">
                    <div className="bx__list">
                      {[
                        { icon: User, label: 'Profile', action: () => setCurrentView('myProfile'), view: 'myProfile' },
                        { icon: Sparkles, label: 'My Skills', action: () => setCurrentView('mySkills'), view: 'mySkills' },
                        { icon: Wallet, label: 'Wallet', action: () => setCurrentView('wallet'), view: 'wallet' },
                        { icon: HelpCircle, label: 'Help & Support', action: () => setCurrentView('support'), view: 'support' },
                        { icon: Settings, label: 'Settings', action: () => setCurrentView('myProfile'), view: null },
                      ].map((item) => {
                        const isActive = currentView === item.view;
                        return (
                          <button
                            key={item.label}
                            onClick={() => {
                              item.action();
                              setShowMenu(false);
                            }}
                            className="bx__listrow"
                            style={{ background: isActive ? 'rgba(var(--bx-accent-rgb),0.08)' : 'none' }}
                          >
                            <span className="bx__av" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 14 }}>
                              <item.icon className="w-4 h-4" />
                            </span>
                            <span className="bx__lr-main">
                              <span className="bx__lr-title">{item.label}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Theme Toggle */}
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bx-line)' }}>
                      <button
                        onClick={() => toggleTheme()}
                        className="bx__listrow"
                      >
                        <span className="bx__av" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 16, background: 'var(--bx-card-2)', color: isDark ? '#f59e0b' : '#6366f1', boxShadow: 'none' }}>
                          {isDark ? '☀' : '☾'}
                        </span>
                        <span className="bx__lr-main">
                          <span className="bx__lr-title">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                        </span>
                      </button>
                    </div>

                    {/* Accent Colour */}
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bx-line)' }}>
                      <div className="bx__eyebrow" style={{ padding: '0 12px', marginBottom: 10 }}>Theme Accent</div>
                      <div style={{ display: 'flex', gap: 8, padding: '0 12px', flexWrap: 'wrap' }}>
                        {palettes.map(p => {
                          const active = accent.id === p.id
                          return (
                            <button
                              key={p.id}
                              onClick={() => setAccent(p.id as any)}
                              title={p.label}
                              style={{
                                width: 38, height: 38, borderRadius: '50%', border: active ? '3px solid var(--bx-ink)' : '2px solid var(--bx-line)',
                                background: p.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'border-color 0.2s, transform 0.2s', transform: active ? 'scale(1.15)' : 'scale(1)',
                              }}
                            >
                              {active && <Check size={16} color="#fff" strokeWidth={3} />}
                            </button>
                          )
                        })}
                      </div>
                      <div style={{ padding: '8px 12px 0', fontSize: 11, color: 'var(--bx-faint)', letterSpacing: '0.02em' }}>
                        {accent.label}
                      </div>
                    </div>

                    {/* Logout Button - Higher in menu */}
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bx-line)' }}>
                      <button
                        onClick={() => {
                          onLogout();
                          setShowMenu(false);
                        }}
                        className="bx__listrow"
                        style={{ color: 'var(--bx-accent-3)' }}
                      >
                        <span className="bx__av" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 14, background: 'rgba(225,29,107,0.16)', boxShadow: 'none' }}>
                          <LogOut className="w-4 h-4" style={{ color: 'var(--bx-accent-3)' }} />
                        </span>
                        <span className="bx__lr-main">
                          <span className="bx__lr-title" style={{ color: 'var(--bx-accent-3)' }}>Logout</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden" style={{ background: 'var(--bx-bg)' }}>
        {selectedChat ? (
          <div className="fixed inset-0 z-50" style={{ background: 'var(--bx-bg)' }}>
            <ChatInterface
              otherUser={{
                name: selectedChat.clientName,
                avatar: selectedChat.clientAvatar,
                isOnline: true,
              }}
              jobTitle={selectedChat.jobTitle}
              onClose={() => setSelectedChat(null)}
              onDelete={() => handleDeleteMatch(selectedChat.id)}
              userType="freelancer"
              paymentStatus={selectedChat.paymentStatus}
              contractAmount={selectedChat.contractAmount}
              onMarkComplete={() => handleMarkComplete(selectedChat.id)}
              onSubmitWork={handleSubmitWork}
              matchId={selectedChat.id}
              match={selectedChat.match}
              revisionCount={selectedChat.revisionCount}
              reviewDeadline={selectedChat.reviewDeadline}
              workSubmissions={workSubmissions}
              showRatingModal={showRatingModal}
              onRatingSubmit={handleRatingSubmit}
              onCloseRatingModal={handleCloseRatingModal}
              onOpenDispute={handleOpenDispute}
              onRespondToDispute={handleRespondToDispute}
              currentUserId={user?.id}
              otherUserId={selectedChat.clientId}
            />
          </div>
        ) : (
          <div className="h-full relative overflow-y-auto">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentView}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
            {currentView === 'dashboard' && renderDashboard()}
            {currentView === 'discover' && renderDiscover()}
            {currentView === 'matches' && renderMatches()}
            {currentView === 'saved' && renderSaved()}
            {currentView === 'profileDetail' && renderProfileDetail()}
            {currentView === 'myProfile' && (
              <FreelancerProfile
                onBack={() => setCurrentView('dashboard')}
                onProfileUpdated={() => refreshProfile()}
              />
            )}
            {currentView === 'mySkills' && (
              <MySkillsView
                skillProfiles={skillProfiles}
                selectedProfileId={selectedSkillProfileId}
                onSelectProfile={setSelectedSkillProfileId}
                onAddNewProfile={() => setCurrentView('addSkillProfile')}
                onUpdateProfile={(updatedProfile) => {
                  setSkillProfiles(skillProfiles.map(p =>
                    p.id === updatedProfile.id ? updatedProfile : p
                  ));
                }}
                onDeleteProfile={async (profileId) => {
                  const { error } = await skillProfilesService.delete(profileId);
                  if (error) {
                    throw error;
                  }
                  setSkillProfiles(skillProfiles.filter(p => p.id !== profileId));
                  if (selectedSkillProfileId === profileId) {
                    const remaining = skillProfiles.filter(p => p.id !== profileId);
                    setSelectedSkillProfileId(remaining[0]?.id || '');
                  }
                }}
                userId={user?.id}
              />
            )}
            {currentView === 'addSkillProfile' && (
              <AddSkillProfile
                onClose={() => setCurrentView('mySkills')}
                onProfileCreated={(newProfile) => {
                  setSkillProfiles([newProfile, ...skillProfiles]);
                  setSelectedSkillProfileId(newProfile.id);
                  setCurrentView('mySkills');
                }}
              />
            )}
            {currentView === 'wallet' && renderWallet()}
            {currentView === 'support' && (
              <SupportPage onBack={() => setCurrentView('dashboard')} userType="freelancer" />
            )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Bottom Navigation — Apple liquid-glass pill */}
      {!selectedChat && (
      <nav className="dx-glassnav">
        {[
          { icon: Home, view: 'dashboard' as ViewType },
          { icon: Zap, view: 'discover' as ViewType },
          { icon: MessageSquare, view: 'matches' as ViewType },
          { icon: Bookmark, view: 'saved' as ViewType },
        ].map((item) => (
          <button
            key={item.view}
            className={`dx-glassnav__item${currentView === item.view && !selectedChat ? ' on' : ''}`}
            onClick={() => setCurrentView(item.view)}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </nav>
      )}

      {/* Swipe Modal */}
      <AnimatePresence>
        {showSwipeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSwipeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl p-6 max-w-md w-full"
              style={{ background: 'var(--bx-solid)', border: '1px solid var(--bx-line)' }}
            >
              {swipeModalType === 'interest' && lastSwipedJob && (
                <>
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-3">🎉</div>
                    <h3 className="text-2xl font-bold" style={{ color: 'var(--bx-ink)' }}>It's a Match!</h3>
                  </div>
                  <p className="mb-4 text-center" style={{ color: 'var(--bx-muted)' }}>
                    You've accepted "{lastSwipedJob.title}" from {lastSwipedJob.clientName}.
                  </p>
                  <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bx-card-2)', border: '1px solid var(--bx-line)' }}>
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--bx-ink)' }}>Next Steps:</p>
                    <ul className="text-sm space-y-2" style={{ color: 'var(--bx-muted)' }}>
                      <li className="flex items-start gap-2">
                        <span className="accent-text font-bold">1.</span>
                        <span>Head to your Messages to chat with the client</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="accent-text font-bold">2.</span>
                        <span>Discuss project details and requirements</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="accent-text font-bold">3.</span>
                        <span>Wait for the client to fund escrow to begin work</span>
                      </li>
                    </ul>
                  </div>
                </>
              )}
              {swipeModalType === 'noMore' && (
                <>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--bx-ink)' }}>All Done!</h3>
                  <p className="mb-6" style={{ color: 'var(--bx-muted)' }}>
                    Check back tomorrow for more opportunities.
                  </p>
                </>
              )}
              <motion.button
                onClick={() => {
                  setShowSwipeModal(false);
                  if (swipeModalType === 'interest') {
                    setCurrentView('matches');
                  }
                }}
                className="w-full py-3 rounded-xl text-white font-bold accent-bg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {swipeModalType === 'interest' ? 'Go to Messages' : 'Got it!'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
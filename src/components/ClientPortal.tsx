import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { staggerContainer, fadeRise } from '../lib/motion';
import {
  Heart,
  MessageSquare,
  Search,
  Briefcase,
  Bell,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Plus,
  Star,
  ChevronRight,
  BookmarkPlus,
  Zap,
  TrendingUp,
  Check,
  Home,
  Bookmark,
  MapPin,
  Clock,
  ArrowLeft,
  Wallet,
  Building2,
  CreditCard,
  Shield,
  DollarSign,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { Logo } from './Logo';
// (SwipeCard removed from client Discover — Discover is now a scrollable profile)
import { ChatInterface, PaymentStatus } from './ChatInterface';
import { ProfileDetailView } from './ProfileDetailView';
import { AddJob } from './AddJob';
import { MyJobsView } from './MyJobsView';
import { JobSwitcher } from './JobSwitcher';
import { ClientProfile } from './ClientProfile';
import { SupportPage } from './SupportPage';
import { EmptyState } from './EmptyState';
import { OnboardingChecklist } from './OnboardingChecklist';
import { SimpleLoader } from './SimpleLoader';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
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
import type { MatchWithProfiles, Notification, SkillProfile, WorkSubmission } from '../types/database';

interface ClientPortalProps {
  onLogout: () => void;
  defaultView?: ViewType;
}

type ViewType = 'dashboard' | 'discover' | 'matches' | 'saved' | 'jobs' | 'profileDetail' | 'myJobs' | 'addJob' | 'myProfile' | 'wallet' | 'support';

interface FreelancerCard {
  id: string;
  freelancerId: string;
  name: string;
  headline: string;
  bio: string;
  location: string;
  availability: string;
  rating: number | null;
  ratingCount: number;
  completedJobs: number;
  responseTime: string;
  successRate: string;
  verified: boolean;
  portfolioImage: string | null;
  portfolioImages: string[];
  avatar: string | null;
  skills: string[];
  experience: any[];
}

interface ClientMatchDisplay {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  profession: string;
  matchedAt: Date;
  lastMessage: string;
  unreadCount: number;
  paymentStatus: PaymentStatus;
  contractAmount: number;
  match: any;
  revisionCount: number;
  reviewDeadline: string | null;
}

interface ClientNotificationDisplay {
  id: string;
  type: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  avatar: string;
}

interface ClientJob {
  id: string;
  title: string;
  category: string;
  budget: number;
  deadline: string;
  status: string;
  description: string;
  requiredSkills: string[];
  postedDate: Date;
  matches: number;
  proposals: number;
  views: number;
}

// Helper to transform skill profile data for SwipeCard
const transformFreelancerForCard = (sp: any, ratingData?: { average: number; count: number }) => ({
  id: sp.id,
  freelancerId: sp.freelancer_id, // Include freelancer ID for swipe matching
  name: sp.freelancer?.full_name || 'Freelancer',
  headline: sp.headline || '',
  bio: sp.bio || '',
  location: sp.freelancer?.location || 'Nigeria',
  availability: sp.availability || 'Available',
  // Only show rating if freelancer has been rated (null means no ratings yet)
  rating: ratingData?.average || null,
  ratingCount: ratingData?.count || 0,
  completedJobs: ratingData?.count || 0, // Use rating count as proxy for completed jobs
  responseTime: '1h',
  successRate: '95%',
  verified: sp.freelancer?.kyc_status === 'approved',
  // Use avatar (profile/bio photo) first as main image, fallback to first portfolio image
  portfolioImage: sp.freelancer?.avatar_url || sp.portfolio_images?.[0] || null,
  // Portfolio images are the work samples (separate from the bio photo)
  portfolioImages: sp.portfolio_images || [],
  avatar: sp.freelancer?.avatar_url || null,
  skills: sp.skills || [],
  experience: sp.experience || [],
});

// Helper to transform match data for display
const transformClientMatchForDisplay = (match: MatchWithProfiles) => ({
  id: match.id,
  freelancerId: match.freelancer_id,
  freelancerName: match.freelancer?.full_name || 'Freelancer',
  freelancerAvatar: match.freelancer?.avatar_url || '👤',
  profession: match.skill_profile?.headline || match.job?.title || 'Professional',
  matchedAt: new Date(match.matched_at),
  lastMessage: 'Start chatting!', // placeholder; enriched from messagesService after load
  unreadCount: 0, // placeholder; enriched from messagesService after load
  paymentStatus: match.status as PaymentStatus,
  contractAmount: match.contract_amount || match.job?.budget || 50000, // Use job budget or default amount
  match: match, // Include full match object for dispute flow
  revisionCount: match.revision_count || 0,
  reviewDeadline: match.review_deadline,
});

export function ClientPortal({ onLogout, defaultView }: ClientPortalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { error: toastError, info: toastInfo, success: toastSuccess } = useToast();

  const isPageMode = !!defaultView;
  const navigate = useNavigate();
  const { isDark, toggleTheme, accent, setAccent, palettes } = useTheme();
  const [currentView, _setCurrentView] = useState<ViewType>((defaultView as ViewType) || 'dashboard');
  const setCurrentView = useCallback((view: ViewType | ((prev: ViewType) => ViewType)) => {
    if (typeof view === 'function') {
      _setCurrentView(view);
      return;
    }
    _setCurrentView(view);
  }, []);
  const [currentFreelancerIndex, setCurrentFreelancerIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [savedFreelancers, setSavedFreelancers] = useState<string[]>([]);
  const [selectedChat, _setSelectedChat] = useState<any>(null);
  const setSelectedChat = useCallback((matchOrFn: any) => {
    if (typeof matchOrFn === 'function') {
      _setSelectedChat(matchOrFn);
      return;
    }
    _setSelectedChat(matchOrFn);
  }, []);
  const [workSubmissions, setWorkSubmissions] = useState<WorkSubmission[]>([]);
  const [showPostJob, setShowPostJob] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Discover swipe (drag the profile left/right to pass/like)
  const swipeX = useMotionValue(0);
  const swipeLikeOp = useTransform(swipeX, [40, 150], [0, 1]);
  const swipeNopeOp = useTransform(swipeX, [-150, -40], [1, 0]);
  const [swipeExit, setSwipeExit] = useState(0);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [previousView, setPreviousView] = useState<ViewType>('discover');
  const [showSwipeModal, setShowSwipeModal] = useState(false);
  const [swipeModalType, setSwipeModalType] = useState<'interest' | 'noMore'>('interest');
  const [celebrate, setCelebrate] = useState(false);
  const [lastSwipedFreelancer, setLastSwipedFreelancer] = useState<any>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedFreelancerName, setSavedFreelancerName] = useState('');

  // Real data state
  const [freelancers, setFreelancers] = useState<FreelancerCard[]>([]);
  const [clientMatches, setClientMatches] = useState<ClientMatchDisplay[]>([]);
  const [clientMatchFilter, setClientMatchFilter] = useState<string>('all');
  const [clientStatusFilter, setClientStatusFilter] = useState<string>('all');
  const [notifications, setNotifications] = useState<ClientNotificationDisplay[]>([]);
  const [walletData, setWalletData] = useState<{ balance: number; pending: number; hasPaymentMethod: boolean } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Loading states
  const [isLoadingFreelancers, setIsLoadingFreelancers] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);

  // Job Management State - must be defined before fetchFreelancers
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [myJobs, setMyJobs] = useState<ClientJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  // Computed payment stats from real data
  const clientPaymentStats = {
    totalSpent: transactions.filter(t => t.type === 'escrow_out' || (t.type === 'debit' && !t.description?.includes('Escrow'))).reduce((sum, t) => sum + t.amount, 0),
    inEscrow: walletData?.pending || 0,
    refundable: 0,
  };

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  // Throttle flag to prevent concurrent batch fetches
  const isFetchingData = useRef(false);
  const lastUserRef = useRef(user);
  // Prevents overlapping swipes (rapid taps would race the DB UNIQUE constraint
  // and double-advance the deck).
  const isSwiping = useRef(false);
  // Match ids we've already celebrated, so the realtime subscription and the
  // swipe-return path don't trigger the celebration twice.
  const celebratedMatchIds = useRef<Set<string>>(new Set());

  // Fetch freelancers (skill profiles) for discovery - filtered by job skills
  const fetchFreelancers = useCallback(async () => {
    if (!user) return;
    // Discovery is scoped to the currently selected job — we only show
    // freelancers whose skills match THAT job's requirements. Fall back to the
    // first job if nothing is selected yet.
    const activeJob = myJobs.find(j => j.id === selectedJobId) || myJobs[0];
    if (!activeJob) {
      setFreelancers([]);
      setCurrentFreelancerIndex(0);
      setIsLoadingFreelancers(false);
      return;
    }

    setIsLoadingFreelancers(true);
    try {
      // Required skills come from the active job only.
      const requiredSkills = new Set<string>(
        (Array.isArray(activeJob.requiredSkills) ? activeJob.requiredSkills : [])
          .map((skill: string) => skill.toLowerCase().trim())
          .filter(Boolean)
      );
      const jobCategory = (activeJob.category || '').toLowerCase().trim();

      // Get already swiped skill profile IDs to exclude from discovery
      const { data: mySwipes } = await swipesService.getByUser(user.id);
      const swipedIds: string[] = mySwipes?.map(swipe => swipe.target_id) || [];

      const { data, error } = await skillProfilesService.getForDiscovery(swipedIds, 50);

      if (!error && data) {
        // Keep only freelancers whose category matches the job AND whose skills
        // overlap the job's requirements by at least 2 (so a cross-discipline
        // freelancer can't leak in on a single shared skill). If the job lists
        // no required skills, show everyone. Jobs with a single required skill
        // fall back to requiring that one match.
        const need = Math.min(2, requiredSkills.size);
        const matchingFreelancers = requiredSkills.size === 0
          ? data
          : data.filter((sp: any) => {
              const catOk = !jobCategory || (sp.category || '').toLowerCase().trim() === jobCategory;
              if (!catOk) return false;
              const overlaps = Array.isArray(sp.skills)
                ? sp.skills.filter((skill: string) =>
                    requiredSkills.has(skill.toLowerCase().trim())
                  ).length
                : 0;
              return overlaps >= need;
            });

        // Fetch ratings for all freelancers
        const freelancerIds = matchingFreelancers
          .map((sp: any) => sp.freelancer_id)
          .filter(Boolean);

        let ratingsMap: Record<string, { average: number; count: number }> = {};
        if (freelancerIds.length > 0) {
          const { ratings } = await ratingsService.getBatchAverageRatings(freelancerIds);
          ratingsMap = ratings;
        }

        // Transform with ratings data
        setFreelancers(matchingFreelancers.map((sp: any) =>
          transformFreelancerForCard(sp, ratingsMap[sp.freelancer_id])
        ));
        setCurrentFreelancerIndex(0);
      }
    } catch (err) {
      console.error('Error fetching freelancers:', err);
    } finally {
      setIsLoadingFreelancers(false);
    }
  }, [user, myJobs, selectedJobId]);

  // Fetch matches
  const fetchMatches = useCallback(async () => {
    if (!user) return;
    setIsLoadingMatches(true);
    try {
      const { data, error } = await matchesService.getByUser(user.id);
      if (!error && data) {
        const base = data.map(transformClientMatchForDisplay);
        setClientMatches(base); // show immediately
        const enriched = await Promise.all(
          base.map(async (m: any) => {
            const [{ data: last }, { count }] = await Promise.all([
              messagesService.getLastMessage(m.id),
              matchesService.getUnreadCount(m.id, user.id),
            ]);
            return { ...m, lastMessage: last?.content || m.lastMessage, unreadCount: count };
          })
        );
        setClientMatches(enriched);
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
          avatar: n.type === 'match' ? '🤝' : n.type === 'message' ? '💬' : n.type === 'payment' ? '💰' : n.type === 'proposal' ? '📄' : n.type === 'delivery' ? '📦' : '📋',
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
          hasPaymentMethod: Boolean(wallet.bank_name), // Clients use this for payment method status
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

  // Initial data fetch with throttling (freelancers fetched separately after jobs load)
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
  }, [user, fetchMatches, fetchNotifications, fetchWallet]);

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
  }, [selectedChat?.id, selectedChat?.paymentStatus]);

  // Transform freelancers for SwipeCard display
  const displayFreelancers = freelancers;

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

  // Handle funding escrow
  const handleFundEscrow = async (matchId: string) => {
    try {
      // Get the match to get the contract amount
      const match = clientMatches.find(m => m.id === matchId);
      if (!match) return;

      // Persist to Supabase
      const { error } = await matchesService.fundProject(matchId, match.contractAmount || 0);
      if (error) {
        console.error('Error funding project:', error);
        toastError('Failed to fund escrow. Please try again.');
        return;
      }

      // Update local state
      setClientMatches(prev => prev.map(m =>
        m.id === matchId
          ? { ...m, paymentStatus: 'funded' as PaymentStatus, lastMessage: 'Payment secured in escrow' }
          : m
      ));
      // Update selectedChat if it's the current one
      if (selectedChat?.id === matchId) {
        setSelectedChat((prev: any) => prev ? { ...prev, paymentStatus: 'funded' as PaymentStatus } : null);
      }
    } catch (err) {
      console.error('Error funding escrow:', err);
      toastError('Failed to fund escrow. Please try again.');
    }
  };

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Handle approving and releasing payment
  const handleApproveRelease = async (matchId: string) => {
    try {
      // Persist to Supabase
      const { error } = await matchesService.approveWork(matchId);
      if (error) {
        console.error('Error approving work:', error);
        toastError('Failed to approve work. Please try again.');
        return;
      }

      // Update local state
      setClientMatches(prev => prev.map(match =>
        match.id === matchId
          ? { ...match, paymentStatus: 'completed' as PaymentStatus, lastMessage: 'Job completed - Payment released' }
          : match
      ));
      // Update selectedChat if it's the current one
      if (selectedChat?.id === matchId) {
        setSelectedChat((prev: any) => prev ? { ...prev, paymentStatus: 'completed' as PaymentStatus } : null);
      }
      // Celebrate the completed job, then show rating modal
      setCelebrate(true);
      setShowRatingModal(true);
    } catch (err) {
      console.error('Error approving work:', err);
      toastError('Failed to approve work. Please try again.');
    }
  };

  const handleRatingSubmit = async (rating: number, review: string) => {
    if (!selectedChat?.id || !user?.id) return;

    try {
      // Persist the client's rating of the freelancer. The match was already
      // marked completed on approval, so we keep it (deleting would orphan the
      // rating record).
      const { error } = await ratingsService.create({
        match_id: selectedChat.id,
        rater_id: user.id,
        rated_id: selectedChat.freelancerId,
        rating,
        review: review || null,
      });

      if (error) {
        console.error('Error saving rating:', error);
        toastError('Failed to submit rating. Please try again.');
        return;
      }

      // Refresh so the completed match reflects the new rating.
      fetchMatches();
    } catch (err) {
      console.error('Error submitting rating:', err);
      toastError('Failed to submit rating. Please try again.');
      return;
    }

    // Close the chat after rating is submitted
    setTimeout(() => {
      setShowRatingModal(false);
      setSelectedChat(null);
    }, 2000);
  };

  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
    setSelectedChat(null);
  };

  // Handle requesting revision from client
  const handleRequestRevision = async (matchId: string) => {
    try {
      const { error } = await matchesService.requestRevision(matchId);
      if (error) {
        console.error('Error requesting revision:', error);
        toastError('Failed to request revision. Please try again.');
        return;
      }

      // Update local state
      setClientMatches(prev => prev.map(m =>
        m.id === matchId
          ? { ...m, paymentStatus: 'in_progress' as PaymentStatus, revisionCount: (m.revisionCount || 0) + 1 }
          : m
      ));
      // Update selectedChat if it's the current one
      if (selectedChat?.id === matchId) {
        setSelectedChat((prev: any) => prev ? { ...prev, paymentStatus: 'in_progress' as PaymentStatus, revisionCount: (prev.revisionCount || 0) + 1 } : null);
      }
      // Refresh matches to get updated data
      fetchMatches();
    } catch (err) {
      console.error('Error requesting revision:', err);
      toastError('Failed to request revision. Please try again.');
    }
  };

  // Handle opening a dispute
  const handleOpenDispute = async (matchId: string, reason: any, explanation: string, evidence: any[]) => {
    try {
      const { error } = await matchesService.openDispute(matchId, reason, explanation, evidence);
      if (error) {
        console.error('Error opening dispute:', error);
        toastError('Failed to open dispute. Please try again.');
        return;
      }

      // Update local state
      setClientMatches(prev => prev.map(m =>
        m.id === matchId
          ? { ...m, paymentStatus: 'disputed' as PaymentStatus }
          : m
      ));
      if (selectedChat?.id === matchId) {
        setSelectedChat((prev: any) => prev ? { ...prev, paymentStatus: 'disputed' as PaymentStatus } : null);
      }
      // Refresh matches to get updated dispute data
      fetchMatches();
    } catch (err) {
      console.error('Error opening dispute:', err);
      toastError('Failed to open dispute. Please try again.');
    }
  };

  // Handle responding to a dispute (for freelancer, but include for completeness)
  const handleRespondToDispute = async (matchId: string, response: string, evidence: any[]) => {
    try {
      const { error } = await matchesService.respondToDispute(matchId, response, evidence);
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

      // Update local state - remove from client's view
      setClientMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (err) {
      console.error('Error deleting match:', err);
      toastError('Failed to delete chat. Please try again.');
    }
  };

  // Wallet State for Client
  const [linkedPaymentMethod, setLinkedPaymentMethod] = useState<{
    cardType: string;
    lastFour: string;
    expiryDate: string;
  } | null>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  const handleLinkPaymentMethod = () => {
    if (paymentFormData.cardNumber.length >= 16 && paymentFormData.expiryDate && paymentFormData.cardholderName) {
      setLinkedPaymentMethod({
        cardType: paymentFormData.cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
        lastFour: paymentFormData.cardNumber.slice(-4),
        expiryDate: paymentFormData.expiryDate,
      });
      setShowAddPaymentModal(false);
      setPaymentFormData({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
    }
  };

  const renderWallet = () => {
    const txMeta = (t: any) => {
      if (t.type === 'credit') return { sign: '+', color: 'var(--bx-green)', bg: 'rgba(15,157,118,0.16)', Icon: Check, label: t.description || 'Funds received' };
      if (t.type === 'escrow_in') return { sign: '−', color: 'var(--bx-amber)', bg: 'rgba(217,138,0,0.16)', Icon: DollarSign, label: t.description || 'Funded to escrow' };
      if (t.type === 'escrow_out') return { sign: '−', color: 'var(--bx-muted)', bg: 'var(--bx-card-2)', Icon: Check, label: t.description || 'Payment released' };
      return { sign: '−', color: 'var(--bx-muted)', bg: 'var(--bx-card-2)', Icon: DollarSign, label: t.description || 'Withdrawal' };
    };
    return (
    <div className="bx" style={{ minHeight: '100%' }}>
      {/* header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bx-solid)', borderBottom: '1px solid var(--bx-line)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setCurrentView('dashboard')} className="bx-onb__x" style={{ width: 38, height: 38 }}><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <div style={{ fontWeight: 750, color: 'var(--bx-ink)', fontSize: 16 }}>Wallet</div>
          <div className="bx__sub" style={{ marginTop: 0 }}>Escrow &amp; payments</div>
        </div>
      </div>

      <div className="bx__wrap" style={{ paddingTop: 16, maxWidth: 1120 }}>
        {/* demo notice */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bx__tile"
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16, background: 'rgba(217,138,0,0.10)', borderColor: 'rgba(217,138,0,0.3)' }}>
          <Wallet className="w-5 h-5" style={{ color: 'var(--bx-amber)', flex: 'none', marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--bx-ink)' }}>Demo credits — no real charges</div>
            <div className="bx__sub" style={{ marginTop: 3 }}>Escrow uses simulated credits while payment integration is finished. No real money is charged and no card is stored.</div>
          </div>
        </motion.div>

        <div className="wl-grid">
          {/* Left: balance + payment method */}
          <div className="wl-col">
            <motion.div className="wl-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="wl-hero__label">Available balance</div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center' }}><Wallet className="w-5 h-5" /></div>
              </div>
              <div className="wl-hero__bal">₦{(walletData?.balance ?? 0).toLocaleString()}</div>
              <div className="wl-hero__row">
                <div><span className="wl-hero__label">In escrow</span><b>₦{clientPaymentStats.inEscrow.toLocaleString()}</b></div>
                <div><span className="wl-hero__label">Total spent</span><b>₦{clientPaymentStats.totalSpent.toLocaleString()}</b></div>
              </div>
            </motion.div>

            <motion.div className="bx__tile" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <div className="bx__t-head" style={{ marginBottom: 14 }}>
                <div className="bx__t-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CreditCard className="w-4 h-4" style={{ color: 'var(--bx-accent)' }} /> Payment method</div>
              </div>
              <div style={{ textAlign: 'center', padding: '14px 4px' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'var(--bx-card-2)', color: 'var(--bx-faint)', margin: '0 auto 12px' }}><CreditCard className="w-7 h-7" /></div>
                <div style={{ fontWeight: 700, color: 'var(--bx-ink)' }}>Card payments coming soon</div>
                <div className="bx__sub" style={{ marginTop: 4 }}>Fund escrow with demo credits to try the full project flow. Real cards aren’t available yet.</div>
              </div>
            </motion.div>
          </div>

          {/* Right: transactions + escrow note */}
          <div className="wl-col">
            <motion.div className="bx__tile" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="bx__t-head" style={{ marginBottom: 6 }}>
                <div className="bx__t-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock className="w-4 h-4" style={{ color: 'var(--bx-accent)' }} /> Recent transactions</div>
              </div>
              {transactions.length === 0 ? (
                <div className="bx__empty">No transactions yet — funding a project will show up here.</div>
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
                <div className="bx__sub" style={{ marginTop: 3 }}>Escrow holds project funds until you approve completed work; you can request a refund if the freelancer doesn’t deliver.</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  // Fetch client's jobs
  const fetchMyJobs = useCallback(async () => {
    if (!user) return;
    setIsLoadingJobs(true);
    try {
      const { data, error } = await jobsService.getByClient(user.id);
      if (!error && data) {
        const transformed = data.map((job: any) => ({
          id: job.id,
          title: job.title,
          category: job.category,
          budget: job.budget,
          deadline: job.deadline || 'Flexible',
          status: job.status,
          description: job.description,
          requiredSkills: job.required_skills || [],
          postedDate: new Date(job.created_at),
          matches: job.matches || 0,
          proposals: job.proposals || 0,
          views: job.views || 0,
        }));
        setMyJobs(transformed);
        // Keep the current selection; otherwise restore the persisted one (if it
        // still exists) and fall back to the first job.
        setSelectedJobId(prev => {
          if (prev) return prev;
          const stored = user ? localStorage.getItem(`clientSelectedJobId:${user.id}`) : null;
          if (stored && transformed.some((j: any) => j.id === stored)) return stored;
          return transformed[0]?.id || '';
        });
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMyJobs();
    }
  }, [user, fetchMyJobs]);

  // Re-fetch freelancers when jobs change (to filter by job skills)
  useEffect(() => {
    if (user && myJobs.length > 0 && !isLoadingJobs) {
      fetchFreelancers();
    }
  }, [user, myJobs, isLoadingJobs, fetchFreelancers]);

  // Persist the active job so the client returns to the same hiring context.
  useEffect(() => {
    if (user && selectedJobId) {
      localStorage.setItem(`clientSelectedJobId:${user.id}`, selectedJobId);
    }
  }, [user, selectedJobId]);

  // Realtime: surface a match the moment the other side swipes (even when this
  // client isn't the one who swiped second).
  useEffect(() => {
    if (!user) return;
    const channel = matchesService.subscribeToUserMatches(user.id, (match, isNew) => {
      // Status change on an existing match (e.g. work submitted → review panel):
      // just refresh so the open chat/dashboard reflects it live.
      if (!isNew) {
        fetchMatches();
        return;
      }
      if (celebratedMatchIds.current.has(match.id)) return;
      celebratedMatchIds.current.add(match.id);
      const name = match.freelancer?.full_name?.split(' ')[0] || 'a freelancer';
      setCelebrate(true);
      toastSuccess(`It's a match with ${name}! 🎉 Open Matches to start chatting.`);
      fetchMatches();
    });
    return () => { matchesService.unsubscribe(channel); };
  }, [user, fetchMatches, toastSuccess]);

  // Keep the open chat's status fields in sync with the live match list so a
  // change driven by the other party (e.g. freelancer submits work) surfaces the
  // review panel without a manual refresh. Preserves locally-enriched fields.
  useEffect(() => {
    if (!selectedChat?.id) return;
    const fresh = clientMatches.find(m => m.id === selectedChat.id);
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
  }, [clientMatches, selectedChat?.id, selectedChat?.paymentStatus, selectedChat?.revisionCount, selectedChat?.reviewDeadline, setSelectedChat]);

  // Computed stats from real data
  const stats = {
    activeJobs: myJobs.filter(j => j.status === 'active').length,
    totalMatches: clientMatches.length,
    savedProfiles: savedFreelancers.length,
    newMessages: notifications.filter(n => n.type === 'message' && !n.read).length,
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!user) return;
    // Guard against out of bounds access
    if (currentFreelancerIndex >= displayFreelancers.length) return;
    // Ignore re-entry while a swipe is still being recorded.
    if (isSwiping.current) return;

    const freelancer = displayFreelancers[currentFreelancerIndex];
    if (!freelancer) return;

    isSwiping.current = true;
    hapticsLight()

    if (direction === 'right') {
      setLastSwipedFreelancer(freelancer);
      setSwipeModalType('interest');
      setTimeout(() => setShowSwipeModal(true), 600);
    }

    // Optimistically advance to the next freelancer right away so the deck moves
    // at animation speed instead of waiting on the network round-trip.
    setTimeout(() => {
      const nextIndex = currentFreelancerIndex + 1;
      setCurrentFreelancerIndex(nextIndex);
      isSwiping.current = false;

      // Check if no more freelancers - only show modal if we didn't already show interest modal
      if (nextIndex >= displayFreelancers.length && direction !== 'right') {
        setTimeout(() => {
          setSwipeModalType('noMore');
          setShowSwipeModal(true);
        }, 100);
      }
    }, 600);

    // Record the swipe in the background; reconcile a mutual match when it lands.
    // The match-list poll is a backstop if this response is slow.
    void handleSwipeService(
      user.id,
      freelancer.freelancerId, // The freelancer who owns the skill profile
      freelancer.id, // The skill profile ID (target)
      'freelancer',
      direction,
      selectedJobId || null // The job this client is hiring for (context)
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
        toastSuccess(`It's a match with ${freelancer.name.split(' ')[0]}! 🎉`);
        fetchMatches();
      } else {
        toastInfo(`Interest sent to ${freelancer.name.split(' ')[0]}`);
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
  }, [currentView, currentFreelancerIndex, displayFreelancers, selectedJobId]);

  // Reset the photo carousel to the first shot whenever the shown freelancer changes.
  useEffect(() => { setCurrentImageIndex(0); }, [currentFreelancerIndex]);

  const handleSaveFreelancer = (freelancerId: string) => {
    if (savedFreelancers.includes(freelancerId)) {
      setSavedFreelancers(savedFreelancers.filter(id => id !== freelancerId));
    } else {
      setSavedFreelancers([...savedFreelancers, freelancerId]);
      const freelancer = displayFreelancers.find(f => f.id === freelancerId);
      if (freelancer) {
        setSavedFreelancerName(freelancer.name.split(' ')[0]);
        setShowSaveModal(true);
      }
    }
  };

  const renderDashboard = () => {
    const selectedJob = myJobs.find(j => j.id === selectedJobId);
    const isOnboardingComplete = !!profile?.full_name && myJobs.length > 0 &&
      (linkedPaymentMethod !== null || walletData?.hasPaymentMethod === true);

    const qActions = [
      { label: 'Discover', sub: 'Start swiping', icon: Zap, bg: 'var(--bx-grad)', view: 'discover' as ViewType },
      { label: 'Post a job', sub: 'Find matches', icon: Plus, bg: '#0b0e14', view: 'addJob' as ViewType },
      { label: 'Messages', sub: 'View matches', icon: MessageSquare, bg: 'var(--bx-accent-2)', view: 'matches' as ViewType },
      { label: 'My jobs', sub: 'Manage postings', icon: Briefcase, bg: '#0f9d76', view: 'myJobs' as ViewType },
    ];

    return (
    <div className="bx">
     <div className="bx__wrap">
      {/* Header */}
      <motion.div className="bx__head" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <div className="bx__eyebrow">Client · Overview</div>
          <h1 className="bx__hi">{profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}` : 'Overview'}</h1>
          <div className="bx__sub">Here’s how your hiring is going today.</div>
        </div>
        <button
          onClick={() => setCurrentView('discover')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', padding: '12px 20px', borderRadius: 13, border: 'none', cursor: 'pointer', background: 'var(--bx-grad)', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: 'var(--bx-glow)' }}
        >
          <Heart className="w-4 h-4" /> Discover talent
        </button>
      </motion.div>

      {/* Summary strip */}
      <motion.div className="jb-summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        {[
          { v: stats.activeJobs, l: 'Active jobs', icon: Briefcase, tint: 'var(--bx-accent)', view: 'myJobs' as ViewType },
          { v: stats.totalMatches, l: 'Matches', icon: Heart, tint: '#e11d6b', view: 'matches' as ViewType },
          { v: stats.savedProfiles, l: 'Saved', icon: BookmarkPlus, tint: 'var(--bx-accent-2)', view: 'saved' as ViewType },
          { v: stats.newMessages, l: 'Unread', icon: MessageSquare, tint: '#0f9d76', view: 'matches' as ViewType },
        ].map((s) => (
          <motion.button key={s.l} className="jb-sum" onClick={() => setCurrentView(s.view)}
            whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
            style={{ cursor: 'pointer', textAlign: 'left', width: '100%', border: 'none', font: 'inherit', color: 'inherit' }}>
            <div className="jb-sum__v">{s.v}</div>
            <div className="jb-sum__l"><s.icon className="w-3.5 h-3.5" style={{ color: s.tint }} /> {s.l}</div>
          </motion.button>
        ))}
      </motion.div>

      {/* JobSwitcher */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        style={{ margin: '14px 0' }}>
        <JobSwitcher
          jobs={myJobs.map(j => ({ id: j.id, title: j.title, category: j.category, status: j.status }))}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
        />
      </motion.div>

      {/* Onboarding (only when incomplete) */}
      {!isOnboardingComplete && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <OnboardingChecklist
            userType="client"
            profile={profile}
            hasJobs={myJobs.length > 0}
            hasPaymentMethod={linkedPaymentMethod !== null || walletData?.hasPaymentMethod === true}
            onNavigate={(view) => setCurrentView(view as ViewType)}
          />
        </motion.div>
      )}

      {/* Bento */}
      <motion.div className="bx__bento" variants={staggerContainer(0.06)} initial="hidden" animate="show"
        style={{ marginTop: 18 }}>
        {/* HERO — wallet */}
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
              <div className="bx__hero-stat"><span className="bx__t-label" style={{ marginTop: 0 }}>Active matches</span><b>{stats.totalMatches}</b></div>
            </div>
          </div>
        </motion.button>

        {/* Quick Actions (2x2) */}
        <motion.div variants={fadeRise} className="bx__tile bx__tile--wide"
          style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bx__t-head"><div className="bx__t-title">Quick Actions</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, marginTop: 6 }}>
            {qActions.map((a) => (
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
            <a href="/client/matches" onClick={(e) => { e.preventDefault(); setCurrentView('matches') }} className="bx__t-link">View all <ChevronRight className="w-3.5 h-3.5" /></a>
          </div>
          {clientMatches.length === 0 ? (
            <div className="bx__empty">No matches yet — start swiping to connect.</div>
          ) : (
            <div className="bx__list">
              {clientMatches.slice(0, 6).map((match) => (
                <button key={match.id} className="bx__listrow" onClick={() => setSelectedChat(match)}>
                  <div className="bx__av">
                    {typeof match.freelancerAvatar === 'string' && match.freelancerAvatar.startsWith('http')
                      ? <img src={match.freelancerAvatar} alt="" />
                      : <span>{(match.freelancerName || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}</span>}
                  </div>
                  <div className="bx__lr-main">
                    <div className="bx__lr-title">{match.freelancerName}</div>
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
  };

  const renderDiscover = () => {
    // Must have a job posted first
    if (myJobs.length === 0 && !isLoadingJobs) {
      return (
        <div className="w-full h-full flex flex-col" style={{ background: 'var(--bx-bg)' }}>
          <EmptyState
            icon={Briefcase}
            title="Post a Job First"
            description="Before you can discover freelancers, you need to post a job. This helps us match you with talented professionals who have the right skills for your project."
            ctaLabel="Post Your First Job"
            onCtaClick={() => setCurrentView('addJob')}
          />
        </div>
      );
    }

    // Loading state
    if (isLoadingFreelancers || isLoadingJobs) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: 'var(--bx-bg)' }}>
          <SimpleLoader message="Finding freelancers for your job..." size="medium" />
        </div>
      );
    }

    // No freelancers available that match job skills
    if (displayFreelancers.length === 0) {
      return (
        <div className="w-full h-full flex flex-col" style={{ background: 'var(--bx-bg)' }}>
          <EmptyState
            icon={User}
            title="No Matching Freelancers Yet"
            description="We couldn't find freelancers that match your job requirements right now. Check back soon as new talent joins every day!"
            ctaLabel="View My Jobs"
            onCtaClick={() => setCurrentView('myJobs')}
            secondaryCtaLabel="Post Another Job"
            onSecondaryCta={() => setCurrentView('addJob')}
          />
        </div>
      );
    }

    const activeJob = myJobs.find(j => j.id === selectedJobId) || myJobs[0];
    const total = displayFreelancers.length;
    const remaining = Math.max(0, total - currentFreelancerIndex);
    const progressPct = total > 0 ? Math.min(100, (currentFreelancerIndex / total) * 100) : 0;
    const current = displayFreelancers[currentFreelancerIndex];
    const exhausted = currentFreelancerIndex >= displayFreelancers.length;

    // Build gallery images for the current freelancer (avatar + portfolio shots)
    const galleryImages: string[] = [];
    if (current) {
      if (current.avatar || current.portfolioImage) galleryImages.push(current.avatar || current.portfolioImage);
      if (Array.isArray(current.portfolioImages)) {
        current.portfolioImages.forEach((img: string) => { if (img && !galleryImages.includes(img)) galleryImages.push(img); });
      }
    }
    if (galleryImages.length === 0) {
      galleryImages.push('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=600&fit=crop');
    }
    const imgIdx = Math.min(currentImageIndex, galleryImages.length - 1);
    // Fling the card off-screen, then advance to the next freelancer.
    const commitSwipe = (dir: 'left' | 'right') => {
      setSwipeDir(dir);
      setSwipeExit(dir === 'right' ? 560 : -560);
      setTimeout(() => {
        setCurrentImageIndex(0);
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
                <h2>Discover Talent</h2>
                <p>
                  {remaining} {remaining === 1 ? 'profile' : 'profiles'} left
                  {activeJob && <> · hiring for <b>{activeJob.title}</b></>}
                </p>
              </div>
              {current && (
                <motion.button
                  onClick={() => handleSaveFreelancer(current.id)}
                  className={`disc2__save ${savedFreelancers.includes(current.id) ? 'on' : ''}`}
                  whileTap={{ scale: 0.92 }}
                  aria-label={savedFreelancers.includes(current.id) ? 'Saved' : 'Save'}
                >
                  <Bookmark className="w-5 h-5" fill={savedFreelancers.includes(current.id) ? 'currentColor' : 'none'} />
                </motion.button>
              )}
            </div>
            <div className="disc2__prog"><i style={{ width: `${progressPct}%` }} /></div>
          </div>

          {exhausted || !current ? (
            <div className="disc2__done">
              <motion.div className="disc2__done-badge" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
                <Heart className="w-9 h-9" fill="currentColor" />
              </motion.div>
              <h3>You've seen everyone</h3>
              <p>Great exploring! Switch jobs to find different talent, or check back as new freelancers join.</p>
              <div className="disc2__done-stats">
                <div className="disc2__done-stat"><b><CountUp value={clientMatches.length} /></b><span>Matches</span></div>
                <div className="disc2__done-stat"><b><CountUp value={total} /></b><span>Viewed</span></div>
                <div className="disc2__done-stat"><b><CountUp value={savedFreelancers.length} /></b><span>Saved</span></div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="disc2__act disc2__act--like" style={{ flex: 'none', padding: '13px 22px' }} onClick={() => setCurrentView('matches')}>View matches</button>
                <button className="disc2__act disc2__act--skip" style={{ flex: 'none', padding: '13px 22px' }} onClick={() => setCurrentFreelancerIndex(0)}>Start over</button>
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
                {/* gallery */}
                <div className="disc2__gallery">
                  <div className="disc2__photo">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={imgIdx}
                        src={galleryImages[imgIdx]}
                        alt={`${current.name} ${imgIdx + 1}`}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.28 }}
                      />
                    </AnimatePresence>
                    {galleryImages.length > 1 && (
                      <>
                        <button className="disc2__navbtn" style={{ left: 12 }} onClick={() => setCurrentImageIndex((imgIdx - 1 + galleryImages.length) % galleryImages.length)}>
                          <ChevronRight className="w-5 h-5" style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <button className="disc2__navbtn" style={{ right: 12 }} onClick={() => setCurrentImageIndex((imgIdx + 1) % galleryImages.length)}>
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="disc2__counter">{imgIdx + 1} / {galleryImages.length}</div>
                      </>
                    )}
                    {current.verified && <div className="disc2__badge"><Check className="w-3.5 h-3.5" /> Verified</div>}
                    <div className="disc2__rating"><Star className="w-3.5 h-3.5" style={{ fill: '#facc15', color: '#facc15' }} />{current.rating || '5.0'}</div>
                  </div>
                  {galleryImages.length > 1 && (
                    <div className="disc2__thumbs">
                      {galleryImages.map((img, i) => (
                        <button key={i} className={`disc2__thumb ${i === imgIdx ? 'on' : ''}`} onClick={() => setCurrentImageIndex(i)}>
                          <img src={img} alt={`thumb ${i + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* name + meta */}
                <div className="disc2__sect" style={{ marginTop: 20 }}>
                  <div className="disc2__name">
                    {current.name}
                    {current.verified && <span className="disc2__vbadge"><Check className="w-4 h-4 text-white" strokeWidth={3} /></span>}
                  </div>
                  {current.headline && <div className="disc2__role">{current.headline}</div>}
                  <div className="disc2__meta">
                    {current.location && <span><MapPin className="w-4 h-4" />{current.location}</span>}
                    {current.availability && <span className="disc2__avail"><Clock className="w-4 h-4" />{current.availability}</span>}
                  </div>
                </div>

                {/* stats */}
                <div className="disc2__sect">
                  <div className="disc2__stats">
                    <div className="disc2__stat"><b>{current.completedJobs || 0}</b><span>Jobs done</span></div>
                    <div className="disc2__stat"><b>{current.responseTime || '2h'}</b><span>Response</span></div>
                    <div className="disc2__stat"><b>{current.successRate || '98%'}</b><span>Success</span></div>
                  </div>
                </div>

                {/* bio */}
                {current.bio && (
                  <div className="disc2__sect">
                    <div className="disc2__sect-t"><User className="w-5 h-5" style={{ color: 'var(--bx-accent-2)' }} /> About</div>
                    <p className="disc2__bio">{current.bio}</p>
                  </div>
                )}

                {/* skills */}
                {current.skills?.length > 0 && (
                  <div className="disc2__sect">
                    <div className="disc2__sect-t">Skills &amp; Expertise</div>
                    <div className="disc2__skills">
                      {current.skills.map((skill: string, i: number) => <span key={i} className="disc2__skill">{skill}</span>)}
                    </div>
                  </div>
                )}

                {/* experience */}
                {current.experience?.length > 0 && (
                  <div className="disc2__sect">
                    <div className="disc2__sect-t"><Briefcase className="w-5 h-5" style={{ color: 'var(--bx-accent-2)' }} /> Experience Highlights</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {current.experience.map((exp: any, i: number) => (
                        <div key={i} className="disc2__exp">
                          <b>{exp.title}</b>
                          <div className="co">{exp.company}</div>
                          <div className="du">{exp.duration}</div>
                        </div>
                      ))}
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
    // Helper function to format time ago
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

    const statusBadge = (status: string) => {
      switch (status) {
        case 'matched': return <span className="bx__badge" style={{ background: 'var(--bx-amber)', fontSize: 10, padding: '2px 8px', height: 'auto' }}>Fund Escrow</span>;
        case 'funded': return <span className="bx__badge" style={{ background: 'var(--bx-green)', fontSize: 10, padding: '2px 8px', height: 'auto' }}>In Progress</span>;
        case 'pending_approval': return <span className="bx__badge" style={{ background: 'var(--bx-accent-2)', fontSize: 10, padding: '2px 8px', height: 'auto' }}>Review Work</span>;
        case 'completed': return <span className="bx__badge" style={{ background: 'var(--bx-muted)', fontSize: 10, padding: '2px 8px', height: 'auto' }}>Completed</span>;
        default: return null;
      }
    };

    // Loading state
    if (isLoadingMatches) {
      return <MatchListSkeleton />;
    }

    // Empty state
    if (clientMatches.length === 0) {
      return (
        <div className="bx__wrap">
          <div className="bx__eyebrow" style={{ marginBottom: 16 }}>Matches</div>
          <EmptyState
            icon={Heart}
            title="No Matches Yet"
            description="Swipe right on freelancers you'd like to work with. When they like you back, you'll match!"
            ctaLabel="Discover Freelancers"
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
          {clientMatches.map((match) => (
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
                  {typeof match.freelancerAvatar === 'string' && match.freelancerAvatar.startsWith('http') ? (
                    <img src={match.freelancerAvatar} alt={match.freelancerName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{match.freelancerAvatar || '👤'}</span>
                  )}
                </div>
                {match.unreadCount > 0 && (
                  <div className="bx__count" style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, minWidth: 20 }}>
                    {match.unreadCount}
                  </div>
                )}
              </div>
              <div className="bx__lr-sub" style={{ maxWidth: 64 }}>{match.freelancerName.split(' ')[0]}</div>
            </motion.button>
          ))}
        </div>

        {/* Filter by profession / status */}
        {(() => {
          const jobFilters = Array.from(new Set(clientMatches.map(m => m.profession).filter(Boolean))) as string[];
          const activeFilter = clientMatchFilter;
          const statusActive = clientStatusFilter;
          return (
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              <button
                onClick={() => { setClientMatchFilter('all'); setClientStatusFilter('all'); }}
                className={`bx__badge ${activeFilter === 'all' && statusActive === 'all' ? 'accent-bg text-white' : 'sf-card2 tx-soft'}`}
                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                All
              </button>
              <button
                onClick={() => { setClientMatchFilter('all'); setClientStatusFilter('completed'); }}
                className={`bx__badge ${statusActive === 'completed' ? 'accent-bg text-white' : 'sf-card2 tx-soft'}`}
                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                Completed
              </button>
              {jobFilters.map(job => (
                <button
                  key={job}
                  onClick={() => { setClientMatchFilter(job); setClientStatusFilter('all'); }}
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
            let filtered = clientMatches;
            if (clientStatusFilter === 'completed') filtered = filtered.filter(m => m.paymentStatus === 'completed');
            else if (clientMatchFilter !== 'all') filtered = filtered.filter(m => m.profession === clientMatchFilter);
            return filtered.map((match) => (
            <motion.button
              key={match.id}
              onClick={() => setSelectedChat(match)}
              className="bx__listrow"
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="bx__av" style={{ position: 'relative' }}>
                {typeof match.freelancerAvatar === 'string' && match.freelancerAvatar.startsWith('http') ? (
                  <img src={match.freelancerAvatar} alt={match.freelancerName} className="w-full h-full object-cover" />
                ) : (
                  <span>{(match.freelancerName || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}</span>
                )}
                {match.unreadCount > 0 && (
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: 'var(--bx-accent-3)', border: '2px solid var(--bx-card)' }} />
                )}
              </div>

              <div className="bx__lr-main">
                <div className="bx__lr-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {match.freelancerName}
                  {displayFreelancers.find(f => f.name === match.freelancerName)?.verified && (
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--bx-accent-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </span>
                  )}
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
      <div className="bx__eyebrow" style={{ marginBottom: 16 }}>Saved</div>

      {savedFreelancers.length === 0 ? (
        <div className="bx__empty" style={{ padding: '60px 20px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(var(--bx-accent-rgb),0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookmarkPlus className="w-10 h-10" style={{ color: 'var(--bx-accent-2)' }} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--bx-ink)', marginBottom: 8 }}>No Saved Freelancers</h3>
          <p style={{ fontSize: 14, color: 'var(--bx-muted)', maxWidth: 280, margin: '0 auto 24px' }}>
            Bookmark freelancers while swiping to review them later
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
          {displayFreelancers
            .filter(f => savedFreelancers.includes(f.id))
            .map((freelancer) => (
              <motion.button
                key={freelancer.id}
                onClick={() => {
                  setCurrentFreelancerIndex(displayFreelancers.findIndex(f => f.id === freelancer.id));
                  setPreviousView('saved');
                  setCurrentView('profileDetail');
                }}
                className="bx__listrow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="bx__av" style={{ position: 'relative', border: '2px solid var(--bx-accent-2)' }}>
                  <img
                    src={freelancer.portfolioImage}
                    alt={freelancer.name}
                    className="w-full h-full object-cover"
                  />
                  {freelancer.verified && (
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: 'var(--bx-accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bx-card)' }}>
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                </div>

                <div className="bx__lr-main">
                  <div className="bx__lr-title">{freelancer.name}</div>
                  <div className="bx__lr-sub">{freelancer.headline}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <span className="bx__lr-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                      <Star className="w-3 h-3" style={{ fill: 'var(--bx-accent-2)', color: 'var(--bx-accent-2)' }} />
                      {freelancer.rating}
                    </span>
                    <span className="bx__lr-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                      <Briefcase className="w-3 h-3" />
                      {freelancer.completedJobs} jobs
                    </span>
                  </div>
                </div>

                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveFreelancer(freelancer.id);
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
    const freelancer = displayFreelancers[currentFreelancerIndex];
    if (!freelancer) return null;

    // Build portfolio images array from real data
    const portfolioImages: string[] = [];

    // First image: avatar/bio photo
    if (freelancer.avatar || freelancer.portfolioImage) {
      portfolioImages.push(freelancer.avatar || freelancer.portfolioImage!);
    }

    // Add portfolio work samples (exclude the avatar if it's already in portfolio_images)
    if (freelancer.portfolioImages && Array.isArray(freelancer.portfolioImages)) {
      freelancer.portfolioImages.forEach((img: string) => {
        if (img && !portfolioImages.includes(img)) {
          portfolioImages.push(img);
        }
      });
    }

    // Fallback to placeholder if no images at all
    if (portfolioImages.length === 0) {
      portfolioImages.push('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=600&fit=crop');
    }

    const handleSwipeButton = (direction: 'left' | 'right') => {
      handleSwipe(direction);
      setCurrentView('discover');
    };

    return (
      <div className="bx__wrap">
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
          <span className="bx__t-title">Profile Details</span>
          <div />
        </div>

        {/* Portfolio Gallery */}
        <div style={{ borderRadius: 'var(--bx-radius)', overflow: 'hidden', background: 'rgba(var(--bx-accent-rgb),0.06)', marginTop: 16 }}>
          <div style={{ aspectRatio: '4/5', position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={portfolioImages[currentImageIndex]}
                alt={`Portfolio ${currentImageIndex + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>

            {/* Navigation Arrows */}
            {portfolioImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((currentImageIndex - 1 + portfolioImages.length) % portfolioImages.length)}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', padding: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer' }}
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((currentImageIndex + 1) % portfolioImages.length)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', padding: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer' }}
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Image Counter */}
            <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>
              {currentImageIndex + 1} / {portfolioImages.length}
            </div>

            {/* Verified Badge */}
            {freelancer.verified && (
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--bx-accent-2)', color: '#fff', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check className="w-3.5 h-3.5" />
                Verified
              </div>
            )}

            {/* Rating Badge */}
            <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.95)', padding: '6px 14px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star className="w-3.5 h-3.5" style={{ fill: '#facc15', color: '#facc15' }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{freelancer.rating || '5.0'}</span>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {portfolioImages.length > 1 && (
            <div style={{ display: 'flex', gap: 8, padding: '12px 16px 16px', overflowX: 'auto' }}>
              {portfolioImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    flexShrink: 0, width: 64, height: 64, borderRadius: 10, overflow: 'hidden',
                    border: currentImageIndex === index ? '2px solid var(--bx-accent-2)' : '2px solid transparent',
                    opacity: currentImageIndex === index ? 1 : 0.6, cursor: 'pointer', padding: 0,
                    transition: 'opacity 0.2s, transform 0.2s', background: 'none',
                  }}
                >
                  <img src={img} alt={`Thumbnail ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div>
          {/* Name & Headline */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--bx-ink)', marginBottom: 6 }}>
              {freelancer.name}
            </h3>
            <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--bx-accent-2)', fontWeight: 600, marginBottom: 12 }}>
              {freelancer.headline}
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {freelancer.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--bx-muted)' }}>
                  <MapPin className="w-4 h-4" />
                  {freelancer.location}
                </span>
              )}
              {freelancer.availability && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--bx-green)', fontWeight: 500 }}>
                  <Clock className="w-4 h-4" />
                  {freelancer.availability}
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24, padding: 16, borderRadius: 'var(--bx-radius)', background: 'var(--bx-card-2)', border: '1px solid var(--bx-line)' }}>
            {[
              { value: freelancer.completedJobs || 0, label: 'Jobs Done' },
              { value: freelancer.responseTime || '2h', label: 'Response' },
              { value: freelancer.successRate || '98%', label: 'Success' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, color: 'var(--bx-accent-2)', marginBottom: 4 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 13, color: 'var(--bx-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Bio */}
          {freelancer.bio && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--bx-ink)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User className="w-5 h-5" style={{ color: 'var(--bx-accent-2)' }} />
                About Me
              </h4>
              <p style={{ fontSize: 14, color: 'var(--bx-ink-soft)', lineHeight: 1.7 }}>
                {freelancer.bio}
              </p>
            </div>
          )}

          {/* Skills */}
          {freelancer.skills?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--bx-ink)', marginBottom: 12 }}>Skills & Expertise</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {freelancer.skills.map((skill: string, index: number) => (
                  <span key={index} style={{ padding: '6px 14px', background: 'rgba(var(--bx-accent-rgb),0.12)', color: 'var(--bx-accent-2)', borderRadius: 999, fontSize: 13, fontWeight: 500 }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience Highlights */}
          {freelancer.experience?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--bx-ink)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase className="w-5 h-5" style={{ color: 'var(--bx-accent-2)' }} />
                Experience Highlights
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {freelancer.experience.map((exp: any, index: number) => (
                  <div key={index} style={{ padding: 16, borderRadius: 'var(--bx-radius-sm)', background: 'var(--bx-card-2)', border: '1px solid var(--bx-line)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--bx-ink)' }}>{exp.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--bx-muted)' }}>{exp.company}</div>
                    <div style={{ fontSize: 12, color: 'var(--bx-faint)', marginTop: 4 }}>{exp.duration}</div>
                  </div>
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
      {/* Header - Hidden on mobile when in discover mode */}
      <header className={`sticky top-0 z-40 ${currentView === 'discover' ? 'hidden sm:block' : ''}`} style={{ background: 'var(--bx-solid)', borderBottom: '1px solid var(--bx-line)' }}>
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Left side - Hamburger Menu */}
          <motion.button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full"
            style={{ color: 'var(--bx-ink)', background: 'none', border: 'none', cursor: 'pointer' }}
            whileHover={{ scale: 1.05, background: 'var(--bx-card-2)' }}
            whileTap={{ scale: 0.95 }}
          >
            {showMenu ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </motion.button>

          {/* Center - Logo */}
          <Logo textColor="var(--bx-ink)" />

          {/* Right side - Notifications */}
          <motion.button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
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
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                <span>{unreadCount}</span>
              </div>
            )}
          </motion.button>
        </div>

        {/* Notifications Panel - Slide from right on mobile */}
        <AnimatePresence>
          {showNotifications && (
              <motion.div
                key="notif-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNotifications(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)' }}
              />
          )}
          {showNotifications && (
              <motion.div
                key="notif-panel"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full sm:w-96 sm:max-w-md sm:top-16 sm:bottom-auto sm:rounded-2xl overflow-hidden"
                style={{ zIndex: 1000, background: 'var(--bx-solid)', boxShadow: 'var(--bx-shadow-lg)', border: '1px solid var(--bx-line)', backdropFilter: 'blur(24px) saturate(160%)', WebkitBackdropFilter: 'blur(24px) saturate(160%)' }}
              >
                <div style={{ padding: 16, borderBottom: '1px solid var(--bx-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bx-card-2)' }}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="sm:hidden"
                      style={{ padding: 8, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--bx-muted)' }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--bx-ink)' }}>Notifications</h3>
                      <p style={{ fontSize: 14, color: 'var(--bx-muted)' }}>{unreadCount} unread</p>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{ fontSize: 14, fontWeight: 500, color: 'var(--bx-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center' }}>
                      <Bell className="w-12 h-12" style={{ color: 'var(--bx-faint)', margin: '0 auto 12px' }} />
                      <p style={{ color: 'var(--bx-muted)' }}>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <motion.button
                        key={notification.id}
                        onClick={() => {
                          markNotificationAsRead(notification.id);
                          setShowNotifications(false);
                          if (notification.type === 'match' || notification.type === 'message') {
                            setCurrentView('matches');
                          } else if (notification.type === 'proposal') {
                            setCurrentView('myJobs');
                          } else if (notification.type === 'delivery') {
                            setCurrentView('matches');
                          }
                        }}
                        style={{
                          width: '100%', padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12,
                          textAlign: 'left', border: 'none', cursor: 'pointer',
                          borderBottom: '1px solid var(--bx-line)',
                          background: !notification.read ? 'rgba(var(--bx-accent-rgb),0.05)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bx-card-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                          {notification.avatar}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: !notification.read ? 'var(--bx-ink)' : 'var(--bx-ink-soft)' }}>
                              {notification.title}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--bx-muted)', flexShrink: 0 }}>
                              {getTimeAgoNotification(notification.time)}
                            </span>
                          </div>
                          <p style={{ fontSize: 14, color: !notification.read ? 'var(--bx-ink-soft)' : 'var(--bx-muted)', lineClamp: 2 }}>
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bx-accent)', flexShrink: 0, marginTop: 8 }}></div>
                        )}
                      </motion.button>
                    ))
                  )}
                </div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* Menu Dropdown */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              key="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)' }}
            />
          )}
          {showMenu && (
            <motion.div
              key="menu-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0,
                width: 320, maxWidth: '85vw', zIndex: 1000,
                background: 'var(--bx-solid)', boxShadow: 'var(--bx-shadow-lg)',
                borderRight: '1px solid var(--bx-line)',
                backdropFilter: 'blur(24px) saturate(160%)', WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              }}
              >
                <div className="flex flex-col h-full">
                  <div style={{ padding: 24, borderBottom: '1px solid var(--bx-line)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <Logo textColor="var(--bx-ink)" />
                      <button
                        onClick={() => setShowMenu(false)}
                        style={{ padding: 8, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--bx-ink)' }}
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div>
                      <div className="bx__eyebrow">Navigation</div>
                      <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--bx-ink)' }}>Client Account</h3>
                    </div>
                  </div>

                  <div style={{ padding: 16 }}>
                    <div className="bx__list">
                      {[
                        { icon: User, label: 'Profile', view: 'myProfile' },
                        { icon: Briefcase, label: 'My Jobs', view: 'myJobs' },
                        { icon: Wallet, label: 'Wallet', view: 'wallet' },
                        { icon: HelpCircle, label: 'Help & Support', view: 'support' },
                        { icon: Settings, label: 'Settings', view: null },
                      ].map((item) => {
                        const isActive = currentView === item.view;
                        return (
                          <button
                            key={item.label}
                            className="bx__listrow"
                            onClick={() => {
                              if (item.view) { setCurrentView(item.view as ViewType); }
                              else { setCurrentView('myProfile'); }
                              setShowMenu(false);
                            }}
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

                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bx-line)' }}>
                      <button
                        onClick={() => { onLogout(); setShowMenu(false); }}
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

                    {/* Theme Accent Colour Picker */}
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
                  </div>
                </div>
              </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {selectedChat ? (
          <div className="fixed inset-0 z-50" style={{ background: 'var(--bx-bg)' }}>
            <ChatInterface
              otherUser={{
                name: selectedChat.freelancerName,
                avatar: selectedChat.freelancerAvatar,
                isOnline: true,
              }}
              jobTitle={selectedChat.profession}
              onClose={() => setSelectedChat(null)}
              onDelete={() => handleDeleteMatch(selectedChat.id)}
              userType="client"
              paymentStatus={selectedChat.paymentStatus}
              contractAmount={selectedChat.contractAmount}
              onFundEscrow={() => handleFundEscrow(selectedChat.id)}
              onApproveRelease={() => handleApproveRelease(selectedChat.id)}
              showRatingModal={showRatingModal}
              onRatingSubmit={handleRatingSubmit}
              onCloseRatingModal={handleCloseRatingModal}
              matchId={selectedChat.id}
              match={selectedChat.match}
              revisionCount={selectedChat.revisionCount}
              reviewDeadline={selectedChat.reviewDeadline}
              workSubmissions={workSubmissions}
              onRequestRevision={() => handleRequestRevision(selectedChat.id)}
              onOpenDispute={(reason, explanation, evidence) => handleOpenDispute(selectedChat.id, reason, explanation, evidence)}
              onRespondToDispute={(response, evidence) => handleRespondToDispute(selectedChat.id, response, evidence)}
              currentUserId={user?.id}
              otherUserId={selectedChat.freelancerId}
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
            {currentView === 'myJobs' && (
              <MyJobsView
                jobs={myJobs}
                selectedJobId={selectedJobId}
                onSelectJob={setSelectedJobId}
                onPostNewJob={() => setCurrentView('addJob')}
                onUpdateJob={(updatedJob) => {
                  setMyJobs(myJobs.map(j => j.id === updatedJob.id ? updatedJob : j));
                }}
                onDeleteJob={async (jobId) => {
                  const { error } = await jobsService.delete(jobId);
                  if (error) {
                    throw error;
                  }
                  setMyJobs(myJobs.filter(j => j.id !== jobId));
                  if (selectedJobId === jobId) {
                    const remaining = myJobs.filter(j => j.id !== jobId);
                    setSelectedJobId(remaining[0]?.id || '');
                  }
                }}
              />
            )}
            {currentView === 'addJob' && (
              <AddJob
                onClose={() => setCurrentView('dashboard')}
                onJobCreated={(job: any) => {
                  const normalized: ClientJob = {
                    id: job.id,
                    title: job.title,
                    category: job.category,
                    budget: job.budget,
                    deadline: job.deadline || 'Flexible',
                    status: job.status,
                    description: job.description,
                    requiredSkills: job.required_skills || [],
                    postedDate: new Date(job.created_at),
                    matches: job.matches || 0,
                    proposals: job.proposals || 0,
                    views: job.views || 0,
                  }
                  setMyJobs([normalized, ...myJobs]);
                  setSelectedJobId(job.id);
                  setCurrentView('myJobs');
                }}
              />
            )}
            {currentView === 'myProfile' && (
              <ClientProfile
                onBack={() => setCurrentView('dashboard')}
                onProfileUpdated={() => {
                  // Refresh the profile in this component's useAuth instance
                  refreshProfile();
                }}
              />
            )}
            {currentView === 'wallet' && renderWallet()}
            {currentView === 'support' && (
              <SupportPage onBack={() => setCurrentView('dashboard')} userType="client" />
            )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Bottom Navigation — hidden when chat is open */}
      {!selectedChat && (
      <nav className="bx-glassnav">
        {[
          { icon: Home, view: 'dashboard' as ViewType },
          { icon: Heart, view: 'discover' as ViewType },
          { icon: MessageSquare, view: 'matches' as ViewType },
          { icon: Bookmark, view: 'saved' as ViewType },
        ].map((item) => {
          const active = currentView === item.view && !selectedChat;
          return (
            <a
              key={item.view}
              href={`/client/${item.view}`}
              className={`bx-glassnav__item ${active ? 'on' : ''}`}
              aria-label={item.view}
              onClick={(e) => { e.preventDefault(); setCurrentView(item.view); }}
            >
              <item.icon className="w-6 h-6" strokeWidth={2.2} />
            </a>
          );
        })}
      </nav>
      )}

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {showProfileDetail && currentFreelancerIndex < displayFreelancers.length && (
          <ProfileDetailView
            data={displayFreelancers[currentFreelancerIndex]}
            type="freelancer"
            onClose={() => setShowProfileDetail(false)}
            onSwipe={(direction) => {
              setShowProfileDetail(false);
              handleSwipe(direction);
            }}
          />
        )}
      </AnimatePresence>

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
              style={{ background: 'var(--bx-solid)', borderRadius: 20, padding: 24, maxWidth: 448, width: '100%' }}
            >
              {swipeModalType === 'interest' && lastSwipedFreelancer && (
                <>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--bx-ink)' }}>Interest Sent!</h3>\n                  <p className="mb-6" style={{ color: 'var(--bx-muted)' }}>
                    You've shown interest in {lastSwipedFreelancer.name}. You'll get a match notification if they're interested in you too.
                  </p>
                </>
              )}
              {swipeModalType === 'noMore' && (
                <>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--bx-ink)' }}>All Done!</h3>
                  <p className="mb-6" style={{ color: 'var(--bx-muted)' }}>
                    Check back tomorrow for more talent.
                  </p>
                </>
              )}
              <motion.button
                onClick={() => setShowSwipeModal(false)}
                className="w-full py-3 rounded-xl text-white font-bold accent-bg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Got it!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Freelancer Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'var(--bx-solid)', borderRadius: 20, padding: 24, maxWidth: 384, width: '100%', textAlign: 'center' }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(var(--bx-accent-rgb),0.12)' }}>
                <Bookmark className="w-8 h-8" style={{ color: 'var(--bx-accent-2)' }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--bx-ink)' }}>Saved!</h3>
              <p className="mb-6" style={{ color: 'var(--bx-muted)' }}>
                {savedFreelancerName} has been added to your shortlist. You can view all saved freelancers anytime.
              </p>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowSaveModal(false)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 14, color: 'var(--bx-ink-soft)', fontWeight: 600, border: '1px solid var(--bx-line)', background: 'none', cursor: 'pointer', fontSize: 14 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowSaveModal(false);
                    setCurrentView('saved');
                  }}
                  className="flex-1 py-3 rounded-xl text-white font-bold accent-bg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Saved
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { staggerContainer, fadeRise } from '../lib/motion';
import {
  LayoutDashboard,
  Users,
  User,
  FileCheck,
  Briefcase,
  Sparkles,
  CreditCard,
  Flag,
  LogOut,
  Search,
  Filter,
  Check,
  X,
  Eye,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  MessageCircle,
  DollarSign,
  UserCheck,
  UserX,
  FileText,
  Image,
  ChevronDown,
  ArrowLeft,
  Ban,
  AlertCircle,
  HelpCircle,
  Menu,
  Bell,
  Settings,
  TrendingUp,
  Send,
  Shield,
} from 'lucide-react';
import { Logo } from './Logo';
import { SupportPage } from './SupportPage';
import { CountUp } from './CountUp';
import { Scale } from 'lucide-react';
import { DisputesDashboard } from './admin/DisputesDashboard';
import { DisputeDetailView } from './admin/DisputeDetailView';
import { adminApi } from '../services/adminApi';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import '../styles/dashboard.css';

interface AdminPortalProps {
  onLogout: () => void;
  defaultView?: AdminView;
}

type AdminView =
  | 'dashboard'
  | 'kyc'
  | 'kycDetail'
  | 'professions'
  | 'skills'
  | 'users'
  | 'userDetail'
  | 'jobs'
  | 'jobDetail'
  | 'skillProfiles'
  | 'skillProfileDetail'
  | 'payments'
  | 'paymentDetail'
  | 'disputes'
  | 'disputeDetail'
  | 'reports'
  | 'reportDetail'
  | 'support'
  | 'supportTicketDetail';

// UI data types (populated from the API)
interface KYCSubmission {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  userType: 'freelancer' | 'client';
  profession?: string; // For freelancers - may be a new profession not in approved list
  idType: string;
  idNumber: string;
  idFrontUrl: string;
  idBackUrl: string;
  selfieUrl: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
}

interface ProfessionRequest {
  id: string;
  professionName: string;
  submittedBy: { id: string; name: string; email: string };
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  suggestedSkills?: string[];
  rejectionReason?: string;
}

interface SkillRequest {
  id: string;
  skillName: string;
  category: string;
  submittedBy: { id: string; name: string; email: string };
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: 'freelancer' | 'client';
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  accountStatus: 'active' | 'suspended' | 'banned';
  createdAt: Date;
  profession?: string;
  skills?: string[];
  companyName?: string;
  totalJobs?: number;
  totalEarnings?: number;
  totalSpent?: number;
}

interface JobPosting {
  id: string;
  title: string;
  category: string;
  budget: number;
  clientId: string;
  clientName: string;
  status: 'active' | 'matched' | 'completed' | 'flagged' | 'removed';
  createdAt: Date;
  description: string;
}

interface SkillProfile {
  id: string;
  freelancerId: string;
  freelancerName: string;
  headline: string;
  category: string;
  skills: string[];
  status: 'pending_review' | 'active' | 'rejected';
  submittedAt: Date;
  portfolioImages: string[];
}

interface Payment {
  id: string;
  jobId: string;
  jobTitle: string;
  freelancerId: string;
  freelancerName: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: 'funded' | 'pending_approval' | 'completed' | 'disputed' | 'refunded';
  createdAt: Date;
  disputeReason?: string;
}

interface UserReport {
  id: string;
  reportedUserId: string;
  reportedUserName: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  createdAt: Date;
  actionTaken?: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: 'freelancer' | 'client';
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  replies: {
    id: string;
    sender: 'user' | 'admin';
    senderName: string;
    message: string;
    timestamp: Date;
  }[];
}

// Map a backend kyc_submissions row (snake_case + joined profile) to the UI shape.
function mapKyc(row: any): KYCSubmission {
  const u = row.user || {};
  return {
    id: row.id,
    userId: row.user_id,
    userName: u.full_name || u.company_name || 'Unknown user',
    email: u.email || '',
    phone: u.phone || '',
    userType: u.user_type === 'client' ? 'client' : 'freelancer',
    profession: u.profession || undefined,
    idType: row.id_type || '',
    idNumber: row.id_number || '',
    idFrontUrl: row.id_front_url || '',
    idBackUrl: row.id_back_url || '',
    selfieUrl: row.selfie_url || '',
    submittedAt: new Date(row.created_at || Date.now()),
    status: (row.status as KYCSubmission['status']) || 'pending',
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    rejectionReason: row.rejection_reason || undefined,
  };
}

// Map a backend profiles row to the admin User shape.
function mapUser(row: any): User {
  const kycMap: Record<string, User['kycStatus']> = {
    verified: 'approved', approved: 'approved', rejected: 'rejected',
    submitted: 'pending', pending: 'pending',
  };
  return {
    id: row.id,
    name: row.full_name || row.company_name || 'Unknown',
    email: row.email || '',
    phone: row.phone || '',
    userType: row.user_type === 'client' ? 'client' : 'freelancer',
    kycStatus: kycMap[row.kyc_status] || 'not_submitted',
    accountStatus: row.is_banned ? 'banned' : 'active',
    createdAt: new Date(row.created_at || Date.now()),
    profession: row.profession || undefined,
    companyName: row.company_name || undefined,
  };
}

// Map a backend jobs row (with joined client) to the admin JobPosting shape.
function mapJob(row: any): JobPosting {
  const statusMap: Record<string, JobPosting['status']> = {
    active: 'active', filled: 'completed', paused: 'removed',
  };
  return {
    id: row.id,
    title: row.title || 'Untitled job',
    category: row.category || '',
    budget: row.budget || 0,
    clientId: row.client_id,
    clientName: row.client?.full_name || row.client?.company_name || 'Client',
    status: statusMap[row.status] || 'active',
    createdAt: new Date(row.created_at || Date.now()),
    description: row.description || '',
  };
}

// Map a backend skill_profiles row (with joined freelancer) to the admin shape.
function mapSkillProfile(row: any): SkillProfile {
  const statusMap: Record<string, SkillProfile['status']> = {
    active: 'active', paused: 'pending_review',
  };
  return {
    id: row.id,
    freelancerId: row.freelancer_id,
    freelancerName: row.freelancer?.full_name || row.freelancer?.company_name || 'Freelancer',
    headline: row.headline || '',
    category: row.category || '',
    skills: row.skills || [],
    status: statusMap[row.status] || 'active',
    submittedAt: new Date(row.created_at || Date.now()),
    portfolioImages: row.portfolio_images || [],
  };
}

// Map a backend transactions row to the admin Payment shape.
function mapPayment(row: any): Payment {
  const statusMap: Record<string, Payment['status']> = {
    escrow_in: 'funded', escrow_out: 'completed', credit: 'completed', debit: 'refunded',
  };
  return {
    id: row.id,
    jobId: row.match_id || '',
    jobTitle: row.description || 'Transaction',
    freelancerId: '',
    freelancerName: '',
    clientId: '',
    clientName: '',
    amount: Number(row.amount) || 0,
    status: statusMap[row.type] || 'completed',
    createdAt: new Date(row.created_at || Date.now()),
  };
}

function mapReport(row: any): UserReport {
  const statusMap: Record<string, UserReport['status']> = {
    pending: 'pending', resolved: 'action_taken', dismissed: 'dismissed',
  };
  return {
    id: row.id,
    reportedUserId: row.target_id || '',
    reportedUserName: row.target_type || '',
    reporterId: row.reporter_id,
    reporterName: row.reporter?.full_name || row.reporter?.email || 'User',
    reason: row.reason || '',
    description: row.description || '',
    status: statusMap[row.status] || 'pending',
    createdAt: new Date(row.created_at || Date.now()),
    actionTaken: row.resolution || undefined,
  };
}

function mapSupport(row: any): SupportTicket {
  const statusMap: Record<string, SupportTicket['status']> = {
    open: 'open', answered: 'in_progress', closed: 'closed',
  };
  const replies = row.admin_reply
    ? [{
        id: row.id + '-reply',
        sender: 'admin' as const,
        senderName: 'Support',
        message: row.admin_reply,
        timestamp: new Date(row.created_at || Date.now()),
      }]
    : [];
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user?.full_name || row.user?.company_name || 'User',
    userEmail: row.user?.email || '',
    userType: row.user?.user_type === 'client' ? 'client' : 'freelancer',
    subject: row.subject || '',
    message: row.message || '',
    status: statusMap[row.status] || 'open',
    priority: 'medium',
    createdAt: new Date(row.created_at || Date.now()),
    updatedAt: new Date(row.created_at || Date.now()),
    replies,
  };
}

function mapProfessionRequest(row: any): ProfessionRequest {
  return {
    id: row.id,
    professionName: row.name || '',
    submittedBy: { id: row.user_id, name: row.user?.full_name || 'User', email: row.user?.email || '' },
    submittedAt: new Date(row.created_at || Date.now()),
    status: (row.status as ProfessionRequest['status']) || 'pending',
  };
}

function mapSkillRequest(row: any): SkillRequest {
  return {
    id: row.id,
    skillName: row.name || '',
    category: '',
    submittedBy: { id: row.user_id, name: row.user?.full_name || 'User', email: row.user?.email || '' },
    submittedAt: new Date(row.created_at || Date.now()),
    status: (row.status as SkillRequest['status']) || 'pending',
  };
}

export function AdminPortal({ onLogout, defaultView }: AdminPortalProps) {
  const isPageMode = !!defaultView;
  const navigate = useNavigate();
  const { isDark, toggleTheme, accent, setAccent, palettes } = useTheme();
  const [_currentView, _setCurrentView] = useState<AdminView>((defaultView as AdminView) || 'dashboard');
  const setCurrentView = useCallback((view: AdminView | ((prev: AdminView) => AdminView)) => {
    if (typeof view === 'function') {
      _setCurrentView(view);
      return;
    }
    _setCurrentView(view);
  }, []);
  const currentView = _currentView;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Data states — all loaded from the API (no mock seeds).
  const [kycSubmissions, setKycSubmissions] = useState<KYCSubmission[]>([]);
  const [professionRequests, setProfessionRequests] = useState<ProfessionRequest[]>([]);
  const [skillRequests, setSkillRequests] = useState<SkillRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [skillProfiles, setSkillProfiles] = useState<SkillProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // Live data from the Python backend (falls back to local data if API is unreachable)
  const [apiStats, setApiStats] = useState<any>(null);
  const [apiConnected, setApiConnected] = useState(false);
  // null = still checking, true = backend up, false = unreachable (show cached-data banner)
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    adminApi
      .dashboard()
      .then((data) => { if (active) { setApiStats(data); setApiConnected(true); setApiOnline(true); } })
      .catch(() => { if (active) setApiOnline(false); /* backend not running — keep local fallback */ });
    // Load all admin data from the API
    adminApi
      .listKyc()
      .then((rows) => { if (active && Array.isArray(rows)) setKycSubmissions(rows.map(mapKyc)); })
      .catch(() => {});
    adminApi
      .listUsers()
      .then((rows) => { if (active && Array.isArray(rows)) setUsers(rows.map(mapUser)); })
      .catch(() => {});
    adminApi
      .listJobs()
      .then((rows) => { if (active && Array.isArray(rows)) setJobPostings(rows.map(mapJob)); })
      .catch(() => {});
    adminApi
      .listSkillProfiles()
      .then((rows) => { if (active && Array.isArray(rows)) setSkillProfiles(rows.map(mapSkillProfile)); })
      .catch(() => {});
    adminApi
      .listPayments()
      .then((rows) => { if (active && Array.isArray(rows)) setPayments(rows.map(mapPayment)); })
      .catch(() => {});
    adminApi
      .listReports()
      .then((rows) => { if (active && Array.isArray(rows)) setReports(rows.map(mapReport)); })
      .catch(() => {});
    adminApi
      .listSupport()
      .then((rows) => { if (active && Array.isArray(rows)) setSupportTickets(rows.map(mapSupport)); })
      .catch(() => {});
    adminApi
      .listProfessionRequests()
      .then((rows) => { if (active && Array.isArray(rows)) setProfessionRequests(rows.map(mapProfessionRequest)); })
      .catch(() => {});
    adminApi
      .listSkillRequests()
      .then((rows) => { if (active && Array.isArray(rows)) setSkillRequests(rows.map(mapSkillRequest)); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Approved professions list (existing professions in the system)
  const [approvedProfessions, setApprovedProfessions] = useState<string[]>([
    'UI/UX Designer', 'Web Developer', 'Mobile Developer', 'Graphic Designer',
    'Content Writer', 'Digital Marketer', 'Video Editor', 'Photographer',
    'Data Analyst', 'Virtual Assistant', 'Social Media Manager', 'SEO Specialist'
  ]);

  // Detail page states (for full page views instead of modals)
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [selectedSkillProfile, setSelectedSkillProfile] = useState<SkillProfile | null>(null);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [ticketReply, setTicketReply] = useState('');

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<{ type: string; id: string } | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'ban' | 'warn' | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Menu state
  const [showMenu, setShowMenu] = useState(false);

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kyc', label: 'KYC Reviews', icon: FileCheck, badge: kycSubmissions.filter(k => k.status === 'pending').length },
    { id: 'professions', label: 'Professions', icon: Briefcase, badge: professionRequests.filter(p => p.status === 'pending').length },
    { id: 'skills', label: 'Skills', icon: Sparkles, badge: skillRequests.filter(s => s.status === 'pending').length },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'jobs', label: 'Job Postings', icon: FileText },
    { id: 'skillProfiles', label: 'Skill Profiles', icon: UserCheck, badge: skillProfiles.filter(s => s.status === 'pending_review').length },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: payments.filter(p => p.status === 'disputed').length },
    { id: 'disputes', label: 'Disputes', icon: Scale, badge: 0 },
    { id: 'reports', label: 'Reports', icon: Flag, badge: reports.filter(r => r.status === 'pending').length },
    { id: 'support', label: 'Support Tickets', icon: HelpCircle, badge: supportTickets.filter(t => t.status === 'open').length },
  ];

  // Stats for dashboard
  const stats = {
    totalUsers: users.length,
    freelancers: users.filter(u => u.userType === 'freelancer').length,
    clients: users.filter(u => u.userType === 'client').length,
    pendingKYC: kycSubmissions.filter(k => k.status === 'pending').length,
    pendingProfessions: professionRequests.filter(p => p.status === 'pending').length,
    pendingSkills: skillRequests.filter(s => s.status === 'pending').length,
    pendingProfiles: skillProfiles.filter(s => s.status === 'pending_review').length,
    activeDisputes: payments.filter(p => p.status === 'disputed').length,
    openReports: reports.filter(r => r.status === 'pending').length,
    totalEscrow: payments.filter(p => p.status === 'funded' || p.status === 'pending_approval').reduce((sum, p) => sum + p.amount, 0),
  };

  // Format helpers
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
  };

  // Helper to check if profession is new (not in approved list)
  const isProfessionNew = (profession: string | undefined) => {
    if (!profession) return false;
    return !approvedProfessions.some(p => p.toLowerCase() === profession.toLowerCase());
  };

  // Action handlers
  const handleKYCApprove = (id: string) => {
    const kyc = kycSubmissions.find(k => k.id === id);

    // If this is a freelancer with a new profession, add it to approved professions list
    if (kyc && kyc.userType === 'freelancer' && kyc.profession && isProfessionNew(kyc.profession)) {
      setApprovedProfessions(prev => [...prev, kyc.profession!]);
    }

    setKycSubmissions(prev => prev.map(k =>
      k.id === id ? { ...k, status: 'approved' as const, reviewedBy: 'Admin', reviewedAt: new Date() } : k
    ));
    // Persist to Supabase via the backend (no-op if the API isn't running)
    adminApi.reviewKyc(id, 'approved').catch(() => {});
    // Navigate back to KYC list
    setCurrentView('kyc');
    setSelectedKYC(null);
  };

  const handleKYCReject = (id: string, reason: string) => {
    setKycSubmissions(prev => prev.map(k =>
      k.id === id ? { ...k, status: 'rejected' as const, reviewedBy: 'Admin', reviewedAt: new Date(), rejectionReason: reason } : k
    ));
    adminApi.reviewKyc(id, 'rejected', reason).catch(() => {});
    setShowRejectModal(false);
    setRejectReason('');
    setRejectTarget(null);
    setSelectedKYC(null);
    // Navigate back to KYC list
    setCurrentView('kyc');
  };

  const handleProfessionApprove = (id: string) => {
    setProfessionRequests(prev => prev.map(p =>
      p.id === id ? { ...p, status: 'approved' as const } : p
    ));
  };

  const handleProfessionReject = (id: string, reason: string) => {
    setProfessionRequests(prev => prev.map(p =>
      p.id === id ? { ...p, status: 'rejected' as const, rejectionReason: reason } : p
    ));
    setShowRejectModal(false);
    setRejectReason('');
    setRejectTarget(null);
  };

  const handleSkillApprove = (id: string) => {
    setSkillRequests(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'approved' as const } : s
    ));
  };

  const handleSkillReject = (id: string, reason: string) => {
    setSkillRequests(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'rejected' as const, rejectionReason: reason } : s
    ));
    setShowRejectModal(false);
    setRejectReason('');
    setRejectTarget(null);
  };

  const handleSkillProfileApprove = (id: string) => {
    setSkillProfiles(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'active' as const } : s
    ));
  };

  const handleSkillProfileReject = (id: string, reason: string) => {
    setSkillProfiles(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'rejected' as const } : s
    ));
    setShowRejectModal(false);
    setRejectReason('');
    setRejectTarget(null);
  };

  const handleUserAction = (userId: string, action: 'suspend' | 'ban' | 'activate') => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? {
        ...u,
        accountStatus: action === 'activate' ? 'active' as const : action === 'suspend' ? 'suspended' as const : 'banned' as const
      } : u
    ));
    // Persist ban/unban to Supabase via the backend (suspend treated as ban server-side)
    if (action === 'activate') adminApi.unbanUser(userId).catch(() => {});
    else adminApi.banUser(userId).catch(() => {});
    // Update selectedUser if we're on detail page
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(prev => prev ? {
        ...prev,
        accountStatus: action === 'activate' ? 'active' as const : action === 'suspend' ? 'suspended' as const : 'banned' as const
      } : null);
    }
    setShowActionModal(false);
    setActionType(null);
    setActionReason('');
    setSelectedUser(null);
  };

  const handleJobRemove = (id: string) => {
    setJobPostings(prev => prev.map(j =>
      j.id === id ? { ...j, status: 'removed' as const } : j
    ));
  };

  const handlePaymentResolve = (id: string, resolution: 'release' | 'refund') => {
    setPayments(prev => prev.map(p =>
      p.id === id ? { ...p, status: resolution === 'release' ? 'completed' as const : 'refunded' as const } : p
    ));
    setSelectedPayment(null);
  };

  const handleReportAction = (id: string, action: 'dismiss' | 'warn' | 'suspend' | 'ban') => {
    setReports(prev => prev.map(r =>
      r.id === id ? {
        ...r,
        status: action === 'dismiss' ? 'dismissed' as const : 'action_taken' as const,
        actionTaken: action !== 'dismiss' ? action : undefined
      } : r
    ));
  };

  // Render Dashboard
  const renderDashboard = () => (
    <div className="bx">
     <div className="bx__wrap">
      {/* Header */}
      <motion.div className="bx__head" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <div className="bx__eyebrow">Admin · Overview</div>
          <h1 className="bx__hi">Platform overview</h1>
          <div className="bx__sub">{apiStats ? 'Live data from the API' : 'Manage your platform'}</div>
        </div>
        <button
          onClick={() => setCurrentView('kyc')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', padding: '12px 20px', borderRadius: 13, border: 'none', cursor: 'pointer', background: 'var(--bx-grad)', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: 'var(--bx-glow)' }}
        >
          <FileCheck className="w-4 h-4" /> Review KYC
        </button>
      </motion.div>

      {/* Summary strip */}
      <motion.div className="jb-summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        {[
          { icon: Users, label: 'Total users', value: (apiStats?.users?.total ?? stats.totalUsers), tint: 'var(--bx-accent)', view: 'users' as ViewType },
          { icon: FileCheck, label: 'Pending KYC', value: (apiStats?.kyc?.pending ?? stats.pendingKYC), tint: '#d98a00', view: 'kyc' as ViewType },
          { icon: AlertTriangle, label: 'Disputes', value: (apiStats ? ((apiStats.disputes?.pending_response ?? 0) + (apiStats.disputes?.pending_review ?? 0)) : stats.activeDisputes), tint: '#e11d6b', view: 'disputes' as ViewType },
          { icon: Flag, label: 'Reports', value: stats.openReports, tint: 'var(--bx-accent-2)', view: 'reports' as ViewType },
        ].map((s) => (
          <motion.button key={s.label} className="jb-sum" onClick={() => setCurrentView(s.view)}
            whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
            style={{ cursor: 'pointer', textAlign: 'left', width: '100%', border: 'none', font: 'inherit', color: 'inherit' }}>
            <div className="jb-sum__v"><CountUp value={s.value} /></div>
            <div className="jb-sum__l"><s.icon className="w-3.5 h-3.5" style={{ color: s.tint }} /> {s.label}</div>
          </motion.button>
        ))}
      </motion.div>

      {/* Bento */}
      <motion.div className="bx__bento" variants={staggerContainer(0.06)} initial="hidden" animate="show"
        style={{ marginTop: 18 }}>
        {/* HERO — platform overview */}
        <motion.button variants={fadeRise} className="bx__tile bx__tile--hero bx__tile--grad bx__tile--btn" onClick={() => setCurrentView('users')}>
          <div className="bx__t-top">
            <div className="bx__t-icon"><Users className="w-5 h-5" /></div>
            <span className="bx__delta">Platform</span>
          </div>
          <div className="bx__hero-body">
            <div className="bx__t-label">Total users</div>
            <div className="bx__metric bx__metric--lg"><CountUp value={apiStats?.users?.total ?? stats.totalUsers} /></div>
            <div className="bx__area">
              {[38, 52, 44, 63, 57, 72, 66, 81, 75, 90, 84, 100].map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="bx__hero-row">
              <div className="bx__hero-stat"><span className="bx__t-label">Freelancers</span><b><CountUp value={apiStats?.users?.freelancers ?? stats.freelancers} /></b></div>
              <div className="bx__hero-stat"><span className="bx__t-label">Clients</span><b><CountUp value={apiStats?.users?.clients ?? stats.clients} /></b></div>
            </div>
          </div>
        </motion.button>

        {/* Quick Actions (2x2) */}
        <motion.div variants={fadeRise} className="bx__tile bx__tile--wide"
          style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="bx__t-head"><div className="bx__t-title">Quick Actions</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, marginTop: 6 }}>
            {[
              { icon: FileCheck, label: 'Review KYC', sub: `${apiStats?.kyc?.pending ?? stats.pendingKYC} pending`, bg: 'var(--bx-grad)', view: 'kyc' as ViewType },
              { icon: Briefcase, label: 'Professions', sub: `${stats.pendingProfessions} requests`, bg: '#0e1116', view: 'professions' as ViewType },
              { icon: Sparkles, label: 'Skills', sub: `${stats.pendingSkills} new`, bg: '#2563eb', view: 'skills' as ViewType },
              { icon: Users, label: 'Users', sub: `${apiStats?.users?.total ?? stats.totalUsers} total`, bg: 'var(--bx-accent-2)', view: 'users' as ViewType },
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

        {/* Recent KYC activity (full width) */}
        <motion.div variants={fadeRise} className="bx__tile"
          style={{ gridColumn: '1 / -1' }}>
          <div className="bx__t-head">
            <div className="bx__t-title">Recent activity</div>
            <a href="/admin/kyc" onClick={(e) => { e.preventDefault(); setCurrentView('kyc') }} className="bx__t-link">View all <ChevronRight className="w-3.5 h-3.5" /></a>
          </div>
          {kycSubmissions.length === 0 ? (
            <div className="bx__empty">No recent submissions.</div>
          ) : (
            <div className="bx__list">
              {kycSubmissions.slice(0, 6).map((kyc) => (
                <button key={kyc.id} className="bx__listrow" onClick={() => setSelectedKYC(kyc)}>
                  <div className="bx__av">
                    <span>{kyc.userName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="bx__lr-main">
                    <div className="bx__lr-title">{kyc.userName}</div>
                    <div className="bx__lr-sub">KYC · {kyc.status}</div>
                  </div>
                  {kyc.status === 'pending' && <span className="bx__count" style={{ background: '#d98a00', color: '#fff' }}>!</span>}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
     </div>
    </div>
  );

  // Render KYC Reviews
  const renderKYCReviews = () => {
    const filteredKYC = kycSubmissions.filter(k => {
      const matchesSearch = k.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           k.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === 'all' || k.status === statusFilter;
      return matchesSearch && matchesFilter;
    });

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">KYC Reviews</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              {filteredKYC.filter(k => k.status === 'pending').length} pending verification
            </p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sf-card rounded-2xl p-4 border bd-line"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 tx-faint" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm focus:outline-none accent-focus-border transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm font-medium focus:outline-none accent-focus-border transition-colors sf-card min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sf-card rounded-2xl border bd-line overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sf-card2 border-b bd-line">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider">User</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider">Type</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider hidden md:table-cell">ID Type</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider hidden sm:table-cell">Submitted</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredKYC.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FileCheck className="w-12 h-12 tx-faint mb-3" />
                        <p className="tx-muted font-medium">No KYC submissions found</p>
                        <p className="tx-faint text-sm mt-1">Try adjusting your search or filter</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredKYC.map((kyc, index) => (
                    <motion.tr
                      key={kyc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover-card2 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 accent-grad rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            {kyc.userName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold tx-ink truncate">{kyc.userName}</p>
                            <p className="text-xs tx-muted truncate">{kyc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          kyc.userType === 'freelancer' ? 'sf-purple tx-purple' : 'sf-blue tx-blue'
                        }`}>
                          {kyc.userType}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm tx-soft hidden md:table-cell">{kyc.idType}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm tx-muted hidden sm:table-cell">{formatDate(kyc.submittedAt)}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          kyc.status === 'pending' ? 'sf-amber tx-amber' :
                          kyc.status === 'approved' ? 'sf-green tx-green' :
                          'sf-red tx-red'
                        }`}>
                          {kyc.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {kyc.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {kyc.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          {kyc.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <motion.button
                          onClick={() => {
                            setSelectedKYC(kyc);
                            setCurrentView('kycDetail');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 accent-bg-10 accent-text rounded-lg text-sm font-semibold accent-hover-bg-20 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    );
  };

  // Render KYC Detail Full Page
  const renderKYCDetail = () => {
    if (!selectedKYC) {
      // Return a fallback UI with navigation back to KYC list
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="tx-muted mb-4">No KYC submission selected</p>
          <button
            onClick={() => setCurrentView('kyc')}
            className="px-4 py-2 accent-bg text-white rounded-lg font-semibold accent-hover-darken transition-colors"
          >
            Back to KYC Reviews
          </button>
        </div>
      );
    }

    const isNewProfession = selectedKYC.userType === 'freelancer' && selectedKYC.profession && isProfessionNew(selectedKYC.profession);

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <motion.button
            onClick={() => {
              setCurrentView('kyc');
              setSelectedKYC(null);
            }}
            className="p-2 hover-card2 rounded-xl transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 tx-soft" />
          </motion.button>
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">KYC Review</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              Reviewing application for {selectedKYC.userName}
            </p>
          </div>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl p-4 sm:p-6 ${
            selectedKYC.status === 'pending' ? 'sf-amber border-2 bd-amber' :
            selectedKYC.status === 'approved' ? 'sf-green border-2 bd-green' :
            'sf-red border-2 bd-red'
          }`}
        >
          <div className="flex items-center gap-3">
            {selectedKYC.status === 'pending' && <Clock className="w-6 h-6 tx-amber" />}
            {selectedKYC.status === 'approved' && <CheckCircle className="w-6 h-6 tx-green" />}
            {selectedKYC.status === 'rejected' && <XCircle className="w-6 h-6 tx-red" />}
            <div>
              <p className={`font-bold text-lg ${
                selectedKYC.status === 'pending' ? 'tx-amber' :
                selectedKYC.status === 'approved' ? 'tx-green' :
                'tx-red'
              }`}>
                {selectedKYC.status === 'pending' ? 'Pending Review' :
                 selectedKYC.status === 'approved' ? 'KYC Approved' :
                 'KYC Rejected'}
              </p>
              <p className={`text-sm ${
                selectedKYC.status === 'pending' ? 'tx-amber' :
                selectedKYC.status === 'approved' ? 'tx-green' :
                'tx-red'
              }`}>
                {selectedKYC.status === 'pending'
                  ? `Submitted ${formatDate(selectedKYC.submittedAt)}`
                  : `Reviewed by ${selectedKYC.reviewedBy} on ${selectedKYC.reviewedAt?.toLocaleDateString()}`
                }
              </p>
              {selectedKYC.status === 'rejected' && selectedKYC.rejectionReason && (
                <p className="text-sm tx-red mt-2">
                  <span className="font-semibold">Reason:</span> {selectedKYC.rejectionReason}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* User Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
        >
          <h3 className="font-bold text-lg tx-ink mb-4 flex items-center gap-2">
            <User className="w-5 h-5 tx-soft" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">Full Name</p>
              <p className="font-semibold tx-ink">{selectedKYC.userName}</p>
            </div>
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">Email</p>
              <p className="font-semibold tx-ink">{selectedKYC.email}</p>
            </div>
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">Phone</p>
              <p className="font-semibold tx-ink">{selectedKYC.phone}</p>
            </div>
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">User Type</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                selectedKYC.userType === 'freelancer' ? 'sf-purple tx-purple' : 'sf-blue tx-blue'
              }`}>
                {selectedKYC.userType}
              </span>
            </div>
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">ID Type</p>
              <p className="font-semibold tx-ink">{selectedKYC.idType}</p>
            </div>
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">ID Number</p>
              <p className="font-semibold tx-ink">{selectedKYC.idNumber}</p>
            </div>
          </div>
        </motion.div>

        {/* Profession Section (for freelancers) */}
        {selectedKYC.userType === 'freelancer' && selectedKYC.profession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={`rounded-2xl p-4 sm:p-6 border-2 ${
              isNewProfession ? 'sf-purple bd-purple' : 'sf-card bd-line'
            }`}
          >
            <h3 className="font-bold text-lg tx-ink mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 tx-soft" />
              Profession
              {isNewProfession && (
                <span className="px-2 py-0.5 sf-purple text-white text-xs rounded-full font-semibold">
                  NEW
                </span>
              )}
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 accent-bg/10 rounded-xl flex items-center justify-center">
                <Briefcase className="w-7 h-7 accent-text" />
              </div>
              <div>
                <p className="font-bold text-xl tx-ink">{selectedKYC.profession}</p>
                {isNewProfession ? (
                  <p className="text-sm tx-purple">
                    This is a new profession not currently in our system.
                    <span className="font-semibold"> It will be automatically added when KYC is approved.</span>
                  </p>
                ) : (
                  <p className="text-sm tx-green flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    This profession is already in our approved list
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Uploaded Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
        >
          <h3 className="font-bold text-lg tx-ink mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5 tx-soft" />
            Uploaded Documents
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-xs tx-muted font-medium">ID Front</p>
              <a href={selectedKYC.idFrontUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={selectedKYC.idFrontUrl}
                  alt="ID Front"
                  className="w-full h-40 sm:h-48 object-cover rounded-xl border-2 bd-line accent-hover-border transition-colors cursor-pointer"
                />
              </a>
              <p className="text-xs tx-faint text-center">Click to view full size</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs tx-muted font-medium">ID Back</p>
              <a href={selectedKYC.idBackUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={selectedKYC.idBackUrl}
                  alt="ID Back"
                  className="w-full h-40 sm:h-48 object-cover rounded-xl border-2 bd-line accent-hover-border transition-colors cursor-pointer"
                />
              </a>
              <p className="text-xs tx-faint text-center">Click to view full size</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs tx-muted font-medium">Selfie with ID</p>
              <a href={selectedKYC.selfieUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={selectedKYC.selfieUrl}
                  alt="Selfie"
                  className="w-full h-40 sm:h-48 object-cover rounded-xl border-2 bd-line accent-hover-border transition-colors cursor-pointer"
                />
              </a>
              <p className="text-xs tx-faint text-center">Click to view full size</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons - Always show for pending KYC */}
        {selectedKYC.status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="sf-card rounded-2xl p-4 sm:p-6 border-2 accent-border shadow-lg"
          >
            <h3 className="font-bold text-lg tx-ink mb-4">Review Decision</h3>
            {isNewProfession && (
              <div className="mb-4 p-4 sf-purple rounded-xl border bd-purple">
                <p className="text-sm tx-purple">
                  <span className="font-bold">Note:</span> Approving this KYC will also add "<span className="font-semibold">{selectedKYC.profession}</span>" to the approved professions list.
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <motion.button
                onClick={() => handleKYCApprove(selectedKYC.id)}
                style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                className="flex-1 py-3 sm:py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Check className="w-5 h-5" />
                Approve KYC
              </motion.button>
              <motion.button
                onClick={() => {
                  setRejectTarget({ type: 'kyc', id: selectedKYC.id });
                  setShowRejectModal(true);
                }}
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                className="flex-1 py-3 sm:py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X className="w-5 h-5" />
                Reject KYC
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Add bottom padding to ensure content is visible above any fixed elements */}
        <div className="pb-8"></div>
      </div>
    );
  };

  // State for adding new profession
  const [showAddProfession, setShowAddProfession] = useState(false);
  const [newProfessionName, setNewProfessionName] = useState('');

  // Handle adding new profession manually
  const handleAddProfession = () => {
    if (newProfessionName.trim() && !approvedProfessions.some(p => p.toLowerCase() === newProfessionName.trim().toLowerCase())) {
      setApprovedProfessions(prev => [...prev, newProfessionName.trim()]);
      setNewProfessionName('');
      setShowAddProfession(false);
    }
  };

  // Handle deleting a profession
  const handleDeleteProfession = (professionName: string) => {
    setApprovedProfessions(prev => prev.filter(p => p !== professionName));
  };

  // Approved skills list (existing skills in the system by category)
  const [approvedSkills, setApprovedSkills] = useState<{name: string; category: string}[]>([
    { name: 'Figma', category: 'UI/UX Design' },
    { name: 'Adobe XD', category: 'UI/UX Design' },
    { name: 'Sketch', category: 'UI/UX Design' },
    { name: 'Prototyping', category: 'UI/UX Design' },
    { name: 'React', category: 'Web Development' },
    { name: 'Node.js', category: 'Web Development' },
    { name: 'TypeScript', category: 'Web Development' },
    { name: 'Python', category: 'Web Development' },
    { name: 'Flutter', category: 'Mobile Development' },
    { name: 'React Native', category: 'Mobile Development' },
    { name: 'Swift', category: 'Mobile Development' },
    { name: 'Photoshop', category: 'Graphic Design' },
    { name: 'Illustrator', category: 'Graphic Design' },
    { name: 'SEO Writing', category: 'Content Writing' },
    { name: 'Copywriting', category: 'Content Writing' },
    { name: 'Google Ads', category: 'Digital Marketing' },
    { name: 'Facebook Ads', category: 'Digital Marketing' },
  ]);

  // State for adding new skill
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');

  // Get unique categories from approved skills
  const skillCategories = Array.from(new Set(approvedSkills.map(s => s.category)));

  // Handle adding new skill manually
  const handleAddSkill = () => {
    if (newSkillName.trim() && newSkillCategory.trim() &&
        !approvedSkills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
      setApprovedSkills(prev => [...prev, { name: newSkillName.trim(), category: newSkillCategory.trim() }]);
      setNewSkillName('');
      setNewSkillCategory('');
      setShowAddSkill(false);
    }
  };

  // Handle deleting a skill
  const handleDeleteSkill = (skillName: string) => {
    setApprovedSkills(prev => prev.filter(s => s.name !== skillName));
  };

  // Render Profession Approvals
  const renderProfessionApprovals = () => {
    const filteredProfessions = professionRequests.filter(p => {
      const matchesSearch = p.professionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.submittedBy.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesFilter;
    });

    // Filter approved professions by search
    const filteredApprovedProfessions = approvedProfessions.filter(p =>
      p.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">Professions Management</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              {approvedProfessions.length} approved professions | {professionRequests.filter(p => p.status === 'pending').length} pending requests
            </p>
          </div>
          <motion.button
            onClick={() => setShowAddProfession(true)}
            className="px-4 py-2.5 accent-bg text-white rounded-xl font-semibold text-sm flex items-center gap-2 accent-hover-darken transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Check className="w-4 h-4" />
            Add Profession
          </motion.button>
        </motion.div>

        {/* Add Profession Modal/Form */}
        {showAddProfession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sf-card rounded-2xl p-4 sm:p-6 border-2 accent-border"
          >
            <h3 className="font-bold text-lg tx-ink mb-4">Add New Profession</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newProfessionName}
                onChange={(e) => setNewProfessionName(e.target.value)}
                placeholder="Enter profession name..."
                className="flex-1 px-4 py-2.5 border-2 bd-line rounded-xl text-sm focus:outline-none accent-focus-border transition-colors"
              />
              <div className="flex gap-2">
                <motion.button
                  onClick={handleAddProfession}
                  disabled={!newProfessionName.trim()}
                  className="px-4 py-2.5 sf-green-solid text-white rounded-xl font-semibold text-sm hover:sf-green-solid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Add
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowAddProfession(false);
                    setNewProfessionName('');
                  }}
                  className="px-4 py-2.5 sf-card2 tx-soft rounded-xl font-semibold text-sm hover-card2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sf-card rounded-2xl p-4 border bd-line"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 tx-faint" />
              <input
                type="text"
                placeholder="Search by profession or submitter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm focus:outline-none accent-focus-border transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm font-medium focus:outline-none accent-focus-border transition-colors sf-card min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </motion.div>

        {/* Cards Grid */}
        {filteredProfessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="sf-card rounded-2xl p-12 border bd-line text-center"
          >
            <Briefcase className="w-12 h-12 tx-faint mx-auto mb-3" />
            <p className="tx-muted font-medium">No profession requests found</p>
            <p className="tx-faint text-sm mt-1">Try adjusting your search or filter</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredProfessions.map((prof, index) => (
              <motion.div
                key={prof.id}
                className="sf-card rounded-2xl p-4 sm:p-6 border bd-line hover:bd-line transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 accent-bg/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 accent-text" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg tx-ink">{prof.professionName}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          prof.status === 'pending' ? 'sf-amber tx-amber' :
                          prof.status === 'approved' ? 'sf-green tx-green' :
                          'sf-red tx-red'
                        }`}>
                          {prof.status}
                        </span>
                      </div>
                    </div>
                    <div className="pl-0 sm:pl-15">
                      <p className="text-sm tx-soft mb-2">
                        Submitted by: <span className="font-semibold tx-ink">{prof.submittedBy.name}</span>
                        <span className="tx-faint ml-2">({prof.submittedBy.email})</span>
                      </p>
                      <p className="text-xs tx-muted">{formatDate(prof.submittedAt)}</p>
                      {prof.suggestedSkills && prof.suggestedSkills.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold tx-soft mb-2">Suggested Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {prof.suggestedSkills.map((skill, i) => (
                              <span key={i} className="px-3 py-1 sf-card2 tx-soft rounded-full text-xs font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {prof.status === 'pending' && (
                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                      <motion.button
                        onClick={() => handleProfessionApprove(prof.id)}
                        className="flex-1 sm:flex-none px-4 py-2.5 sf-green-solid text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:sf-green-solid transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setRejectTarget({ type: 'profession', id: prof.id });
                          setShowRejectModal(true);
                        }}
                        className="flex-1 sm:flex-none px-4 py-2.5 sf-red-solid text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:sf-red-solid transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Approved Professions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
        >
          <h3 className="font-bold text-lg tx-ink mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 tx-green" />
            Approved Professions ({filteredApprovedProfessions.length})
          </h3>
          {filteredApprovedProfessions.length === 0 ? (
            <p className="tx-muted text-sm py-4 text-center">No professions match your search</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredApprovedProfessions.map((profession, index) => (
                <motion.div
                  key={profession}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-center justify-between p-3 sf-card2 rounded-xl border bd-line hover:bd-line transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sf-green rounded-lg flex items-center justify-center">
                      <Briefcase className="w-4 h-4 tx-green" />
                    </div>
                    <span className="font-medium tx-ink text-sm">{profession}</span>
                  </div>
                  <motion.button
                    onClick={() => handleDeleteProfession(profession)}
                    className="p-1.5 tx-faint hover:tx-red hover:sf-red rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Delete profession"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  // Render Skill Approvals
  const renderSkillApprovals = () => {
    const filteredSkills = skillRequests.filter(s => {
      const matchesSearch = s.skillName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesFilter;
    });

    // Filter approved skills by search
    const filteredApprovedSkills = approvedSkills.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group approved skills by category
    const skillsByCategory = filteredApprovedSkills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill.name);
      return acc;
    }, {} as Record<string, string[]>);

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">Skills Management</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              {approvedSkills.length} approved skills | {skillRequests.filter(s => s.status === 'pending').length} pending requests
            </p>
          </div>
          <motion.button
            onClick={() => setShowAddSkill(true)}
            className="px-4 py-2.5 accent-bg text-white rounded-xl font-semibold text-sm flex items-center gap-2 accent-hover-darken transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Check className="w-4 h-4" />
            Add Skill
          </motion.button>
        </motion.div>

        {/* Add Skill Form */}
        {showAddSkill && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sf-card rounded-2xl p-4 sm:p-6 border-2 accent-border"
          >
            <h3 className="font-bold text-lg tx-ink mb-4">Add New Skill</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Enter skill name..."
                className="flex-1 px-4 py-2.5 border-2 bd-line rounded-xl text-sm focus:outline-none accent-focus-border transition-colors"
              />
              <input
                type="text"
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                placeholder="Enter category..."
                list="skillCategoriesList"
                className="flex-1 sm:max-w-[200px] px-4 py-2.5 border-2 bd-line rounded-xl text-sm focus:outline-none accent-focus-border transition-colors"
              />
              <datalist id="skillCategoriesList">
                {skillCategories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              <div className="flex gap-2">
                <motion.button
                  onClick={handleAddSkill}
                  disabled={!newSkillName.trim() || !newSkillCategory.trim()}
                  className="px-4 py-2.5 sf-green-solid text-white rounded-xl font-semibold text-sm hover:sf-green-solid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Add
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowAddSkill(false);
                    setNewSkillName('');
                    setNewSkillCategory('');
                  }}
                  className="px-4 py-2.5 sf-card2 tx-soft rounded-xl font-semibold text-sm hover-card2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sf-card rounded-2xl p-4 border bd-line"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 tx-faint" />
              <input
                type="text"
                placeholder="Search by skill or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm focus:outline-none accent-focus-border transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm font-medium focus:outline-none accent-focus-border transition-colors sf-card min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sf-card rounded-2xl border bd-line overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sf-card2 border-b bd-line">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider">Skill</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider">Submitted By</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredSkills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Sparkles className="w-12 h-12 tx-faint mb-3" />
                        <p className="tx-muted font-medium">No skill requests found</p>
                        <p className="tx-faint text-sm mt-1">Try adjusting your search or filter</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSkills.map((skill, index) => (
                    <motion.tr
                      key={skill.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover-card2 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sf-blue rounded-xl flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 tx-blue" />
                          </div>
                          <span className="font-semibold tx-ink">{skill.skillName}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                        <span className="px-2.5 py-1 sf-card2 tx-soft rounded-full text-xs font-medium">
                          {skill.category}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium tx-ink truncate">{skill.submittedBy.name}</p>
                          <p className="text-xs tx-muted truncate">{skill.submittedBy.email}</p>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm tx-muted hidden md:table-cell">{formatDate(skill.submittedAt)}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          skill.status === 'pending' ? 'sf-amber tx-amber' :
                          skill.status === 'approved' ? 'sf-green tx-green' :
                          'sf-red tx-red'
                        }`}>
                          {skill.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {skill.status === 'pending' ? (
                          <div className="flex gap-2">
                            <motion.button
                              onClick={() => handleSkillApprove(skill.id)}
                              className="p-2 sf-green tx-green rounded-lg hover:sf-green transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => {
                                setRejectTarget({ type: 'skill', id: skill.id });
                                setShowRejectModal(true);
                              }}
                              className="p-2 sf-red tx-red rounded-lg hover:sf-red transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </div>
                        ) : (
                          <span className="tx-faint text-sm">-</span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Approved Skills List by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
        >
          <h3 className="font-bold text-lg tx-ink mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 tx-green" />
            Approved Skills ({filteredApprovedSkills.length})
          </h3>
          {Object.keys(skillsByCategory).length === 0 ? (
            <p className="tx-muted text-sm py-4 text-center">No skills match your search</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(skillsByCategory).map(([category, skills], catIndex) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-bold tx-soft flex items-center gap-2">
                    <span className="px-2 py-0.5 sf-card2 rounded-full text-xs">{category}</span>
                    <span className="tx-faint text-xs">({skills.length} skills)</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skillName, index) => (
                      <motion.div
                        key={skillName}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: catIndex * 0.05 + index * 0.02 }}
                        className="flex items-center gap-2 px-3 py-1.5 sf-blue rounded-lg border bd-blue group hover:bd-blue transition-colors"
                      >
                        <Sparkles className="w-3 h-3 tx-blue" />
                        <span className="text-sm font-medium tx-ink">{skillName}</span>
                        <motion.button
                          onClick={() => handleDeleteSkill(skillName)}
                          className="p-0.5 tx-faint hover:tx-red hover:sf-red rounded transition-colors opacity-0 group-hover:opacity-100"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Delete skill"
                        >
                          <X className="w-3 h-3" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  // Render Users
  const renderUsers = () => {
    const filteredUsers = users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === 'all' ||
                           (statusFilter === 'freelancer' && u.userType === 'freelancer') ||
                           (statusFilter === 'client' && u.userType === 'client') ||
                           (statusFilter === 'suspended' && u.accountStatus === 'suspended') ||
                           (statusFilter === 'banned' && u.accountStatus === 'banned');
      return matchesSearch && matchesFilter;
    });

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">User Management</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              {users.length} total users on the platform
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="sf-card rounded-2xl p-4 border bd-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sf-purple rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 tx-purple" />
              </div>
              <div>
                <p className="text-xs tx-muted">Freelancers</p>
                <p className="text-lg font-bold tx-ink">{users.filter(u => u.userType === 'freelancer').length}</p>
              </div>
            </div>
          </div>
          <div className="sf-card rounded-2xl p-4 border bd-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sf-blue rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 tx-blue" />
              </div>
              <div>
                <p className="text-xs tx-muted">Clients</p>
                <p className="text-lg font-bold tx-ink">{users.filter(u => u.userType === 'client').length}</p>
              </div>
            </div>
          </div>
          <div className="sf-card rounded-2xl p-4 border bd-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sf-amber rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 tx-amber" />
              </div>
              <div>
                <p className="text-xs tx-muted">Suspended</p>
                <p className="text-lg font-bold tx-ink">{users.filter(u => u.accountStatus === 'suspended').length}</p>
              </div>
            </div>
          </div>
          <div className="sf-card rounded-2xl p-4 border bd-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sf-red rounded-xl flex items-center justify-center">
                <Ban className="w-5 h-5 tx-red" />
              </div>
              <div>
                <p className="text-xs tx-muted">Banned</p>
                <p className="text-lg font-bold tx-ink">{users.filter(u => u.accountStatus === 'banned').length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sf-card rounded-2xl p-4 border bd-line"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 tx-faint" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm focus:outline-none accent-focus-border transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm font-medium focus:outline-none accent-focus-border transition-colors sf-card min-w-[140px]"
            >
              <option value="all">All Users</option>
              <option value="freelancer">Freelancers</option>
              <option value="client">Clients</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sf-card rounded-2xl border bd-line overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sf-card2 border-b bd-line">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider">User</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider">Type</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider hidden md:table-cell">KYC</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider hidden sm:table-cell">Joined</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold tx-soft uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Users className="w-12 h-12 tx-faint mb-3" />
                        <p className="tx-muted font-medium">No users found</p>
                        <p className="tx-faint text-sm mt-1">Try adjusting your search or filter</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover-card2 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 accent-grad rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold tx-ink truncate">{user.name}</p>
                            <p className="text-xs tx-muted truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.userType === 'freelancer' ? 'sf-purple tx-purple' : 'sf-blue tx-blue'
                        }`}>
                          {user.userType}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.kycStatus === 'approved' ? 'sf-green tx-green' :
                          user.kycStatus === 'pending' ? 'sf-amber tx-amber' :
                          user.kycStatus === 'rejected' ? 'sf-red tx-red' :
                          'sf-card2 tx-soft'
                        }`}>
                          {user.kycStatus === 'not_submitted' ? 'Not Submitted' : user.kycStatus}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.accountStatus === 'active' ? 'sf-green tx-green' :
                          user.accountStatus === 'suspended' ? 'sf-amber tx-amber' :
                          'sf-red tx-red'
                        }`}>
                          {user.accountStatus}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm tx-muted hidden sm:table-cell">{formatDate(user.createdAt)}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <motion.button
                          onClick={() => {
                            setSelectedUser(user);
                            setCurrentView('userDetail');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 accent-bg-10 accent-text rounded-lg text-sm font-semibold accent-hover-bg-20 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    );
  };

  // Render User Detail Full Page
  const renderUserDetail = () => {
    if (!selectedUser) {
      // Return a fallback UI with navigation back to Users list
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="tx-muted mb-4">No user selected</p>
          <button
            onClick={() => setCurrentView('users')}
            className="px-4 py-2 accent-bg text-white rounded-lg font-semibold accent-hover-darken transition-colors"
          >
            Back to Users
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <motion.button
            onClick={() => {
              setCurrentView('users');
              setSelectedUser(null);
            }}
            className="p-2 hover-card2 rounded-xl transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 tx-soft" />
          </motion.button>
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">User Profile</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              Viewing profile for {selectedUser.name}
            </p>
          </div>
        </motion.div>

        {/* Account Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl p-4 sm:p-6 ${
            selectedUser.accountStatus === 'active' ? 'sf-green border-2 bd-green' :
            selectedUser.accountStatus === 'suspended' ? 'sf-amber border-2 bd-amber' :
            'sf-red border-2 bd-red'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedUser.accountStatus === 'active' && <CheckCircle className="w-6 h-6 tx-green" />}
              {selectedUser.accountStatus === 'suspended' && <AlertCircle className="w-6 h-6 tx-amber" />}
              {selectedUser.accountStatus === 'banned' && <Ban className="w-6 h-6 tx-red" />}
              <div>
                <p className={`font-bold text-lg ${
                  selectedUser.accountStatus === 'active' ? 'tx-green' :
                  selectedUser.accountStatus === 'suspended' ? 'tx-amber' :
                  'tx-red'
                }`}>
                  {selectedUser.accountStatus === 'active' ? 'Active Account' :
                   selectedUser.accountStatus === 'suspended' ? 'Account Suspended' :
                   'Account Banned'}
                </p>
                <p className={`text-sm ${
                  selectedUser.accountStatus === 'active' ? 'tx-green' :
                  selectedUser.accountStatus === 'suspended' ? 'tx-amber' :
                  'tx-red'
                }`}>
                  Member since {selectedUser.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
              selectedUser.userType === 'freelancer' ? 'sf-purple tx-purple' : 'sf-blue tx-blue'
            }`}>
              {selectedUser.userType}
            </span>
          </div>
        </motion.div>

        {/* User Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
        >
          <h3 className="font-bold text-lg tx-ink mb-4 flex items-center gap-2">
            <User className="w-5 h-5 tx-soft" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">Full Name</p>
              <p className="font-semibold tx-ink">{selectedUser.name}</p>
            </div>
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">Email</p>
              <p className="font-semibold tx-ink">{selectedUser.email}</p>
            </div>
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">Phone</p>
              <p className="font-semibold tx-ink">{selectedUser.phone}</p>
            </div>
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">KYC Status</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                selectedUser.kycStatus === 'approved' ? 'sf-green tx-green' :
                selectedUser.kycStatus === 'pending' ? 'sf-amber tx-amber' :
                selectedUser.kycStatus === 'rejected' ? 'sf-red tx-red' :
                'sf-card2 tx-soft'
              }`}>
                {selectedUser.kycStatus === 'not_submitted' ? 'Not Submitted' : selectedUser.kycStatus}
              </span>
            </div>
            {selectedUser.userType === 'freelancer' && selectedUser.profession && (
              <div>
                <p className="text-xs tx-muted mb-1 font-medium">Profession</p>
                <p className="font-semibold tx-ink">{selectedUser.profession}</p>
              </div>
            )}
            {selectedUser.userType === 'client' && selectedUser.companyName && (
              <div>
                <p className="text-xs tx-muted mb-1 font-medium">Company</p>
                <p className="font-semibold tx-ink">{selectedUser.companyName}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Skills (for freelancers) */}
        {selectedUser.userType === 'freelancer' && selectedUser.skills && selectedUser.skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
          >
            <h3 className="font-bold text-lg tx-ink mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 tx-soft" />
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedUser.skills.map((skill, i) => (
                <span key={i} className="px-3 py-1.5 sf-purple tx-purple rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
        >
          <h3 className="font-bold text-lg tx-ink mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 tx-soft" />
            Activity Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="sf-card2 rounded-xl p-4">
              <p className="text-xs tx-muted mb-1 font-medium">
                {selectedUser.userType === 'freelancer' ? 'Jobs Completed' : 'Jobs Posted'}
              </p>
              <p className="text-2xl font-bold tx-ink">{selectedUser.totalJobs || 0}</p>
            </div>
            <div className="sf-card2 rounded-xl p-4">
              <p className="text-xs tx-muted mb-1 font-medium">
                {selectedUser.userType === 'freelancer' ? 'Total Earnings' : 'Total Spent'}
              </p>
              <p className="text-2xl font-bold tx-green">
                {formatCurrency(selectedUser.userType === 'freelancer' ? (selectedUser.totalEarnings || 0) : (selectedUser.totalSpent || 0))}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
        >
          <h3 className="font-bold text-lg tx-ink mb-4">Account Actions</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            {selectedUser.accountStatus === 'active' && (
              <>
                <motion.button
                  onClick={() => handleUserAction(selectedUser.id, 'suspend')}
                  style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
                  className="flex-1 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <AlertCircle className="w-5 h-5" />
                  Suspend Account
                </motion.button>
                <motion.button
                  onClick={() => handleUserAction(selectedUser.id, 'ban')}
                  style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                  className="flex-1 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Ban className="w-5 h-5" />
                  Ban Account
                </motion.button>
              </>
            )}
            {(selectedUser.accountStatus === 'suspended' || selectedUser.accountStatus === 'banned') && (
              <motion.button
                onClick={() => handleUserAction(selectedUser.id, 'activate')}
                style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                className="flex-1 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle className="w-5 h-5" />
                Activate Account
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // Render Jobs
  const renderJobs = () => {
    const filteredJobs = jobPostings.filter(j => {
      const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           j.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === 'all' || j.status === statusFilter;
      return matchesSearch && matchesFilter;
    });

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">Job Postings</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              {jobPostings.filter(j => j.status === 'flagged').length > 0 && (
                <span className="tx-red font-semibold">{jobPostings.filter(j => j.status === 'flagged').length} flagged jobs require attention</span>
              )}
              {jobPostings.filter(j => j.status === 'flagged').length === 0 && (
                <span>{jobPostings.filter(j => j.status === 'active').length} active jobs on the platform</span>
              )}
            </p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sf-card rounded-2xl p-4 border bd-line"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 tx-faint" />
              <input
                type="text"
                placeholder="Search by title or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm focus:outline-none accent-focus-border transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm font-medium focus:outline-none accent-focus-border transition-colors sf-card min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="matched">Matched</option>
              <option value="completed">Completed</option>
              <option value="flagged">Flagged</option>
              <option value="removed">Removed</option>
            </select>
          </div>
        </motion.div>

        {/* Cards Grid */}
        {filteredJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="sf-card rounded-2xl p-12 border bd-line text-center"
          >
            <FileText className="w-12 h-12 tx-faint mx-auto mb-3" />
            <p className="tx-muted font-medium">No job postings found</p>
            <p className="tx-faint text-sm mt-1">Try adjusting your search or filter</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                className={`sf-card rounded-2xl p-4 sm:p-6 border-2 transition-colors ${
                  job.status === 'flagged' ? 'bd-red sf-red' : 'bd-line hover:bd-line'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        job.status === 'flagged' ? 'sf-red' : 'sf-card2'
                      }`}>
                        {job.status === 'flagged' ? (
                          <AlertTriangle className="w-6 h-6 tx-red" />
                        ) : (
                          <FileText className="w-6 h-6 tx-soft" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg tx-ink mb-1">{job.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          job.status === 'active' ? 'sf-green tx-green' :
                          job.status === 'matched' ? 'sf-blue tx-blue' :
                          job.status === 'completed' ? 'sf-card2 tx-soft' :
                          job.status === 'flagged' ? 'sf-red tx-red' :
                          'sf-card2 tx-muted'
                        }`}>
                          {job.status === 'flagged' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {job.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm mb-3">
                      <span className="px-3 py-1 sf-card2 tx-soft rounded-full font-medium">{job.category}</span>
                      <span className="px-3 py-1 sf-green tx-green rounded-full font-bold">{formatCurrency(job.budget)}</span>
                      <span className="tx-soft">by <span className="font-semibold">{job.clientName}</span></span>
                    </div>
                    <p className="text-sm tx-soft line-clamp-2 mb-2">{job.description}</p>
                    <p className="text-xs tx-muted">{formatDate(job.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap sm:flex-col gap-2 flex-shrink-0">
                    <motion.button
                      onClick={() => {
                        setSelectedJob(job);
                        setCurrentView('jobDetail');
                      }}
                      className="px-4 py-2 accent-bg-10 accent-text rounded-xl text-sm font-semibold flex items-center justify-center gap-2 accent-hover-bg-20 transition-colors h-auto"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </motion.button>
                    {(job.status === 'active' || job.status === 'flagged') && (
                      <motion.button
                        onClick={() => handleJobRemove(job.id)}
                        style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity h-auto"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Job Detail Page
  const renderJobDetail = () => {
    if (!selectedJob) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="tx-muted mb-4">No job selected</p>
          <button
            onClick={() => setCurrentView('jobs')}
            className="px-4 py-2 accent-bg text-white rounded-lg font-semibold accent-hover-darken transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <motion.button
            onClick={() => {
              setCurrentView('jobs');
              setSelectedJob(null);
            }}
            className="p-2 hover-card2 rounded-xl transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 tx-soft" />
          </motion.button>
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">Job Details</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              Viewing job: {selectedJob.title}
            </p>
          </div>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl p-4 sm:p-6 ${
            selectedJob.status === 'flagged' ? 'sf-red border-2 bd-red' :
            selectedJob.status === 'active' ? 'sf-green border-2 bd-green' :
            selectedJob.status === 'completed' ? 'sf-blue border-2 bd-blue' :
            'sf-card2 border-2 bd-line'
          }`}
        >
          <div className="flex items-center gap-3">
            {selectedJob.status === 'flagged' && <AlertTriangle className="w-6 h-6 tx-red" />}
            {selectedJob.status === 'active' && <CheckCircle className="w-6 h-6 tx-green" />}
            {selectedJob.status === 'completed' && <CheckCircle className="w-6 h-6 tx-blue" />}
            {selectedJob.status === 'removed' && <XCircle className="w-6 h-6 tx-soft" />}
            <div>
              <p className={`font-bold text-lg ${
                selectedJob.status === 'flagged' ? 'tx-red' :
                selectedJob.status === 'active' ? 'tx-green' :
                selectedJob.status === 'completed' ? 'tx-blue' :
                'tx-ink'
              }`}>
                {selectedJob.status.charAt(0).toUpperCase() + selectedJob.status.slice(1)}
              </p>
              <p className="text-sm tx-soft">Posted {formatDate(selectedJob.createdAt)}</p>
            </div>
          </div>
        </motion.div>

        {/* Job Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
        >
          <h3 className="font-bold text-lg tx-ink mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 tx-soft" />
            Job Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">Title</p>
              <p className="font-bold text-xl tx-ink">{selectedJob.title}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs tx-muted mb-1 font-medium">Category</p>
                <span className="inline-flex items-center px-3 py-1 sf-card2 tx-soft rounded-full text-sm font-medium">
                  {selectedJob.category}
                </span>
              </div>
              <div>
                <p className="text-xs tx-muted mb-1 font-medium">Budget</p>
                <p className="font-bold text-2xl tx-green">{formatCurrency(selectedJob.budget)}</p>
              </div>
              <div>
                <p className="text-xs tx-muted mb-1 font-medium">Posted By</p>
                <p className="font-semibold tx-ink">{selectedJob.clientName}</p>
              </div>
            </div>
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">Description</p>
              <p className="tx-soft leading-relaxed">{selectedJob.description}</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        {(selectedJob.status === 'active' || selectedJob.status === 'flagged') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="sf-card rounded-2xl p-4 sm:p-6 border-2 accent-border"
          >
            <h3 className="font-bold text-lg tx-ink mb-4">Admin Actions</h3>
            <motion.button
              onClick={() => {
                handleJobRemove(selectedJob.id);
                setCurrentView('jobs');
                setSelectedJob(null);
              }}
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-5 h-5" />
              Remove This Job
            </motion.button>
          </motion.div>
        )}
      </div>
    );
  };

  // Render Skill Profiles
  const renderSkillProfiles = () => {
    const filteredProfiles = skillProfiles.filter(s => {
      const matchesSearch = s.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.freelancerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesFilter;
    });

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">Skill Profiles Review</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              {filteredProfiles.filter(p => p.status === 'pending_review').length} profiles awaiting review
            </p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sf-card rounded-2xl p-4 border bd-line"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 tx-faint" />
              <input
                type="text"
                placeholder="Search by headline or freelancer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm focus:outline-none accent-focus-border transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm font-medium focus:outline-none accent-focus-border transition-colors sf-card min-w-[160px]"
            >
              <option value="all">All Status</option>
              <option value="pending_review">Pending Review</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </motion.div>

        {/* Cards Grid */}
        {filteredProfiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="sf-card rounded-2xl p-12 border bd-line text-center"
          >
            <UserCheck className="w-12 h-12 tx-faint mx-auto mb-3" />
            <p className="tx-muted font-medium">No skill profiles found</p>
            <p className="tx-faint text-sm mt-1">Try adjusting your search or filter</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredProfiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                className="sf-card rounded-2xl p-4 sm:p-6 border bd-line hover:bd-line transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <div className="flex flex-col lg:flex-row items-start gap-4">
                  {/* Portfolio Images */}
                  <div className="flex gap-3 lg:w-52 flex-shrink-0">
                    {profile.portfolioImages.slice(0, 2).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Portfolio"
                        className="w-24 h-24 object-cover rounded-xl border bd-line"
                      />
                    ))}
                    {profile.portfolioImages.length === 0 && (
                      <div className="w-24 h-24 sf-card2 rounded-xl flex items-center justify-center">
                        <Image className="w-8 h-8 tx-faint" />
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg tx-ink">{profile.headline}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        profile.status === 'pending_review' ? 'sf-amber tx-amber' :
                        profile.status === 'active' ? 'sf-green tx-green' :
                        'sf-red tx-red'
                      }`}>
                        {profile.status === 'pending_review' ? 'Pending Review' : profile.status}
                      </span>
                    </div>
                    <p className="text-sm tx-soft mb-3">
                      By: <span className="font-semibold tx-ink">{profile.freelancerName}</span>
                      <span className="mx-2 tx-faint">|</span>
                      <span className="px-2 py-0.5 sf-card2 tx-soft rounded-full text-xs font-medium">{profile.category}</span>
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 sf-purple tx-purple rounded-full text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs tx-muted">Submitted: {formatDate(profile.submittedAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap lg:flex-col gap-2 flex-shrink-0">
                    <motion.button
                      onClick={() => {
                        setSelectedSkillProfile(profile);
                        setCurrentView('skillProfileDetail');
                      }}
                      className="px-4 py-2 accent-bg-10 accent-text rounded-xl text-sm font-semibold flex items-center justify-center gap-2 accent-hover-bg-20 transition-colors h-auto"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </motion.button>
                    {profile.status === 'pending_review' && (
                      <>
                        <motion.button
                          onClick={() => handleSkillProfileApprove(profile.id)}
                          style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                          className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity h-auto"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            setRejectTarget({ type: 'skillProfile', id: profile.id });
                            setShowRejectModal(true);
                          }}
                          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                          className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity h-auto"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Skill Profile Detail Page
  const renderSkillProfileDetail = () => {
    if (!selectedSkillProfile) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="tx-muted mb-4">No skill profile selected</p>
          <button
            onClick={() => setCurrentView('skillProfiles')}
            className="px-4 py-2 accent-bg text-white rounded-lg font-semibold accent-hover-darken transition-colors"
          >
            Back to Skill Profiles
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <motion.button
            onClick={() => {
              setCurrentView('skillProfiles');
              setSelectedSkillProfile(null);
            }}
            className="p-2 hover-card2 rounded-xl transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 tx-soft" />
          </motion.button>
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">Skill Profile Review</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              Reviewing profile for {selectedSkillProfile.freelancerName}
            </p>
          </div>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl p-4 sm:p-6 ${
            selectedSkillProfile.status === 'pending_review' ? 'sf-amber border-2 bd-amber' :
            selectedSkillProfile.status === 'active' ? 'sf-green border-2 bd-green' :
            'sf-red border-2 bd-red'
          }`}
        >
          <div className="flex items-center gap-3">
            {selectedSkillProfile.status === 'pending_review' && <Clock className="w-6 h-6 tx-amber" />}
            {selectedSkillProfile.status === 'active' && <CheckCircle className="w-6 h-6 tx-green" />}
            {selectedSkillProfile.status === 'rejected' && <XCircle className="w-6 h-6 tx-red" />}
            <div>
              <p className={`font-bold text-lg ${
                selectedSkillProfile.status === 'pending_review' ? 'tx-amber' :
                selectedSkillProfile.status === 'active' ? 'tx-green' :
                'tx-red'
              }`}>
                {selectedSkillProfile.status === 'pending_review' ? 'Pending Review' :
                 selectedSkillProfile.status === 'active' ? 'Active' : 'Rejected'}
              </p>
              <p className="text-sm tx-soft">Submitted {formatDate(selectedSkillProfile.submittedAt)}</p>
            </div>
          </div>
        </motion.div>

        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
        >
          <h3 className="font-bold text-lg tx-ink mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 tx-soft" />
            Profile Details
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">Headline</p>
              <p className="font-bold text-xl tx-ink">{selectedSkillProfile.headline}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs tx-muted mb-1 font-medium">Freelancer</p>
                <p className="font-semibold tx-ink">{selectedSkillProfile.freelancerName}</p>
              </div>
              <div>
                <p className="text-xs tx-muted mb-1 font-medium">Category</p>
                <span className="inline-flex items-center px-3 py-1 sf-card2 tx-soft rounded-full text-sm font-medium">
                  {selectedSkillProfile.category}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs tx-muted mb-2 font-medium">Skills</p>
              <div className="flex flex-wrap gap-2">
                {selectedSkillProfile.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 sf-blue tx-blue rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Portfolio Images */}
        {selectedSkillProfile.portfolioImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
          >
            <h3 className="font-bold text-lg tx-ink mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 tx-soft" />
              Portfolio Images
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {selectedSkillProfile.portfolioImages.map((img, i) => (
                <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                  <img
                    src={img}
                    alt={`Portfolio ${i + 1}`}
                    className="w-full h-32 sm:h-40 object-cover rounded-xl border-2 bd-line accent-hover-border transition-colors cursor-pointer"
                  />
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        {selectedSkillProfile.status === 'pending_review' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="sf-card rounded-2xl p-4 sm:p-6 border-2 accent-border"
          >
            <h3 className="font-bold text-lg tx-ink mb-4">Review Decision</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                onClick={() => {
                  handleSkillProfileApprove(selectedSkillProfile.id);
                  setCurrentView('skillProfiles');
                  setSelectedSkillProfile(null);
                }}
                style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                className="flex-1 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Check className="w-5 h-5" />
                Approve Profile
              </motion.button>
              <motion.button
                onClick={() => {
                  setRejectTarget({ type: 'skillProfile', id: selectedSkillProfile.id });
                  setShowRejectModal(true);
                }}
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                className="flex-1 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X className="w-5 h-5" />
                Reject Profile
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // Render Payments
  const renderPayments = () => {
    const filteredPayments = payments.filter(p => {
      const matchesSearch = p.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.freelancerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesFilter;
    });

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">Payments & Disputes</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              {payments.filter(p => p.status === 'disputed').length > 0 ? (
                <span className="tx-red font-semibold">{payments.filter(p => p.status === 'disputed').length} disputes need resolution</span>
              ) : (
                <span>All payments are in good standing</span>
              )}
            </p>
          </div>
        </motion.div>

        {/* Escrow Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="accent-grad rounded-2xl p-5 sm:p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Total in Escrow</p>
              <p className="text-3xl sm:text-4xl font-bold mt-1">{formatCurrency(stats.totalEscrow)}</p>
              <p className="text-white/70 text-xs mt-2">Funds held securely for active jobs</p>
            </div>
            <div className="w-14 h-14 sf-card/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sf-card rounded-2xl p-4 border bd-line"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 tx-faint" />
              <input
                type="text"
                placeholder="Search by job, freelancer or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm focus:outline-none accent-focus-border transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm font-medium focus:outline-none accent-focus-border transition-colors sf-card min-w-[160px]"
            >
              <option value="all">All Status</option>
              <option value="funded">Funded</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="completed">Completed</option>
              <option value="disputed">Disputed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </motion.div>

        {/* Payments Grid */}
        {filteredPayments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="sf-card rounded-2xl p-12 border bd-line text-center"
          >
            <CreditCard className="w-12 h-12 tx-faint mx-auto mb-3" />
            <p className="tx-muted font-medium">No payments found</p>
            <p className="tx-faint text-sm mt-1">Try adjusting your search or filter</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredPayments.map((payment, index) => (
              <motion.div
                key={payment.id}
                className={`sf-card rounded-2xl p-4 sm:p-6 border-2 transition-colors ${
                  payment.status === 'disputed' ? 'bd-red sf-red' : 'bd-line hover:bd-line'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        payment.status === 'disputed' ? 'sf-red' :
                        payment.status === 'completed' ? 'sf-green' :
                        'sf-card2'
                      }`}>
                        {payment.status === 'disputed' ? (
                          <AlertTriangle className="w-6 h-6 tx-red" />
                        ) : (
                          <CreditCard className={`w-6 h-6 ${payment.status === 'completed' ? 'tx-green' : 'tx-soft'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg tx-ink mb-1">{payment.jobTitle}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          payment.status === 'funded' ? 'sf-blue tx-blue' :
                          payment.status === 'pending_approval' ? 'sf-amber tx-amber' :
                          payment.status === 'completed' ? 'sf-green tx-green' :
                          payment.status === 'disputed' ? 'sf-red tx-red' :
                          'sf-card2 tx-soft'
                        }`}>
                          {payment.status === 'disputed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {payment.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold tx-ink mb-3">{formatCurrency(payment.amount)}</p>
                    <div className="flex flex-wrap gap-4 text-sm mb-3">
                      <span className="tx-soft">Freelancer: <span className="font-semibold tx-ink">{payment.freelancerName}</span></span>
                      <span className="tx-soft">Client: <span className="font-semibold tx-ink">{payment.clientName}</span></span>
                    </div>
                    {payment.disputeReason && (
                      <div className="p-4 sf-red rounded-xl border bd-red">
                        <p className="text-sm tx-red">
                          <span className="font-bold">Dispute Reason:</span> {payment.disputeReason}
                        </p>
                      </div>
                    )}
                    <p className="text-xs tx-muted mt-3">{formatDate(payment.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap sm:flex-col gap-2 flex-shrink-0">
                    <motion.button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setCurrentView('paymentDetail');
                      }}
                      className="px-4 py-2 accent-bg-10 accent-text rounded-xl text-sm font-semibold flex items-center justify-center gap-2 accent-hover-bg-20 transition-colors h-auto"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </motion.button>
                    {payment.status === 'disputed' && (
                      <>
                        <motion.button
                          onClick={() => handlePaymentResolve(payment.id, 'release')}
                          style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                          className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity h-auto"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Release to Freelancer
                        </motion.button>
                        <motion.button
                          onClick={() => handlePaymentResolve(payment.id, 'refund')}
                          style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
                          className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity h-auto"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Refund to Client
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Payment Detail Page
  const renderPaymentDetail = () => {
    if (!selectedPayment) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="tx-muted mb-4">No payment selected</p>
          <button
            onClick={() => setCurrentView('payments')}
            className="px-4 py-2 accent-bg text-white rounded-lg font-semibold accent-hover-darken transition-colors"
          >
            Back to Payments
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <motion.button
            onClick={() => {
              setCurrentView('payments');
              setSelectedPayment(null);
            }}
            className="p-2 hover-card2 rounded-xl transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 tx-soft" />
          </motion.button>
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">Payment Details</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              Transaction for: {selectedPayment.jobTitle}
            </p>
          </div>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl p-4 sm:p-6 ${
            selectedPayment.status === 'disputed' ? 'sf-red border-2 bd-red' :
            selectedPayment.status === 'completed' ? 'sf-green border-2 bd-green' :
            selectedPayment.status === 'refunded' ? 'sf-amber border-2 bd-amber' :
            'sf-blue border-2 bd-blue'
          }`}
        >
          <div className="flex items-center gap-3">
            {selectedPayment.status === 'disputed' && <AlertTriangle className="w-6 h-6 tx-red" />}
            {selectedPayment.status === 'completed' && <CheckCircle className="w-6 h-6 tx-green" />}
            {selectedPayment.status === 'refunded' && <XCircle className="w-6 h-6 tx-amber" />}
            {(selectedPayment.status === 'funded' || selectedPayment.status === 'pending_approval') && <Clock className="w-6 h-6 tx-blue" />}
            <div>
              <p className={`font-bold text-lg ${
                selectedPayment.status === 'disputed' ? 'tx-red' :
                selectedPayment.status === 'completed' ? 'tx-green' :
                selectedPayment.status === 'refunded' ? 'tx-amber' :
                'tx-blue'
              }`}>
                {selectedPayment.status === 'pending_approval' ? 'Pending Approval' :
                 selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
              </p>
              <p className="text-sm tx-soft">Created {formatDate(selectedPayment.createdAt)}</p>
            </div>
          </div>
        </motion.div>

        {/* Payment Flow Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="sf-purple rounded-2xl p-4 sm:p-6 border bd-purple"
        >
          <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--bx-ink)' }}>Payment Flow Status</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className="px-3 py-1.5 rounded-full font-semibold"
              style={{
                backgroundColor: selectedPayment.status === 'funded' || selectedPayment.status === 'pending_approval' || selectedPayment.status === 'completed' ? '#16a34a' : '#e5e7eb',
                color: selectedPayment.status === 'funded' || selectedPayment.status === 'pending_approval' || selectedPayment.status === 'completed' ? '#ffffff' : '#4b5563'
              }}
            >
              1. Funded
            </span>
            <ChevronRight className="w-4 h-4 tx-faint" />
            <span
              className="px-3 py-1.5 rounded-full font-semibold"
              style={{
                backgroundColor: selectedPayment.status === 'pending_approval' || selectedPayment.status === 'completed' ? '#16a34a' : selectedPayment.status === 'disputed' ? '#dc2626' : '#e5e7eb',
                color: selectedPayment.status === 'pending_approval' || selectedPayment.status === 'completed' || selectedPayment.status === 'disputed' ? '#ffffff' : '#4b5563'
              }}
            >
              2. Work Submitted
            </span>
            <ChevronRight className="w-4 h-4 tx-faint" />
            {selectedPayment.status === 'disputed' ? (
              <span className="px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: '#dc2626', color: '#ffffff' }}>
                3. Disputed
              </span>
            ) : (
              <span
                className="px-3 py-1.5 rounded-full font-semibold"
                style={{
                  backgroundColor: selectedPayment.status === 'completed' ? '#16a34a' : selectedPayment.status === 'refunded' ? '#d97706' : '#e5e7eb',
                  color: selectedPayment.status === 'completed' || selectedPayment.status === 'refunded' ? '#ffffff' : '#4b5563'
                }}
              >
                3. {selectedPayment.status === 'refunded' ? 'Refunded' : 'Released'}
              </span>
            )}
          </div>
        </motion.div>

        {/* Payment Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
        >
          <h3 className="font-bold text-lg tx-ink mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 tx-soft" />
            Payment Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">Amount</p>
              <p className="font-bold text-3xl tx-green">{formatCurrency(selectedPayment.amount)}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sf-card2 rounded-xl p-4">
                <p className="text-xs tx-muted mb-1 font-medium">Freelancer (Recipient)</p>
                <p className="font-semibold tx-ink">{selectedPayment.freelancerName}</p>
              </div>
              <div className="sf-card2 rounded-xl p-4">
                <p className="text-xs tx-muted mb-1 font-medium">Client (Payer)</p>
                <p className="font-semibold tx-ink">{selectedPayment.clientName}</p>
              </div>
            </div>
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">Job Title</p>
              <p className="font-semibold tx-ink">{selectedPayment.jobTitle}</p>
            </div>
          </div>
        </motion.div>

        {/* Dispute Information (if disputed) */}
        {selectedPayment.disputeReason && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="sf-red rounded-2xl p-4 sm:p-6 border-2 bd-red"
          >
            <h3 className="font-bold text-lg tx-red mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Dispute Details
            </h3>
            <p className="tx-red">{selectedPayment.disputeReason}</p>
          </motion.div>
        )}

        {/* Admin Actions for Disputed Payments */}
        {selectedPayment.status === 'disputed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="sf-card rounded-2xl p-4 sm:p-6 border-2 accent-border"
          >
            <h3 className="font-bold text-lg tx-ink mb-2">Admin Resolution</h3>
            <p className="text-sm tx-soft mb-4">
              Review the dispute and decide how to resolve it. Choose one of the following actions:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                onClick={() => {
                  handlePaymentResolve(selectedPayment.id, 'release');
                  setCurrentView('payments');
                  setSelectedPayment(null);
                }}
                style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                className="flex-1 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Check className="w-5 h-5" />
                Release to Freelancer
              </motion.button>
              <motion.button
                onClick={() => {
                  handlePaymentResolve(selectedPayment.id, 'refund');
                  setCurrentView('payments');
                  setSelectedPayment(null);
                }}
                style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
                className="flex-1 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <XCircle className="w-5 h-5" />
                Refund to Client
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // Render Reports
  const renderReports = () => {
    const filteredReports = reports.filter(r => {
      const matchesSearch = r.reportedUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           r.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesFilter;
    });

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">User Reports</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              {reports.filter(r => r.status === 'pending').length > 0 ? (
                <span className="tx-amber font-semibold">{reports.filter(r => r.status === 'pending').length} reports need attention</span>
              ) : (
                <span>No pending reports</span>
              )}
            </p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sf-card rounded-2xl p-4 border bd-line"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 tx-faint" />
              <input
                type="text"
                placeholder="Search by user or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm focus:outline-none accent-focus-border transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 sm:py-3 border-2 bd-line rounded-xl text-sm font-medium focus:outline-none accent-focus-border transition-colors sf-card min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="dismissed">Dismissed</option>
              <option value="action_taken">Action Taken</option>
            </select>
          </div>
        </motion.div>

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="sf-card rounded-2xl p-12 border bd-line text-center"
          >
            <Flag className="w-12 h-12 tx-faint mx-auto mb-3" />
            <p className="tx-muted font-medium">No reports found</p>
            <p className="tx-faint text-sm mt-1">Try adjusting your search or filter</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredReports.map((report, index) => (
              <motion.div
                key={report.id}
                className={`sf-card rounded-2xl p-4 sm:p-6 border-2 transition-colors ${
                  report.status === 'pending' ? 'bd-amber sf-amber/50' : 'bd-line hover:bd-line'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 sf-red rounded-xl flex items-center justify-center flex-shrink-0">
                        <Flag className="w-6 h-6 tx-red" />
                      </div>
                      <div className="flex-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold sf-red tx-red mb-2">
                          {report.reason}
                        </span>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            report.status === 'pending' ? 'sf-amber tx-amber' :
                            report.status === 'dismissed' ? 'sf-card2 tx-soft' :
                            'sf-green tx-green'
                          }`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4 space-y-1">
                      <p className="text-sm tx-soft">
                        <span className="font-semibold tx-ink">Reported User:</span> {report.reportedUserName}
                      </p>
                      <p className="text-sm tx-soft">
                        <span className="font-semibold tx-ink">Reported By:</span> {report.reporterName}
                      </p>
                    </div>
                    <div className="p-4 sf-card2 rounded-xl">
                      <p className="text-sm tx-soft italic">"{report.description}"</p>
                    </div>
                    <p className="text-xs tx-muted mt-3">{formatDate(report.createdAt)}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0 w-40">
                    <motion.button
                      onClick={() => {
                        setSelectedReport(report);
                        setCurrentView('reportDetail');
                      }}
                      className="w-full px-4 py-2 accent-bg-10 accent-text rounded-xl text-sm font-semibold flex items-center justify-center gap-2 accent-hover-bg-20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </motion.button>
                    {report.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          onClick={() => handleReportAction(report.id, 'dismiss')}
                          className="px-2 py-1.5 sf-card2 tx-soft rounded-lg text-xs font-semibold hover-card2 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Dismiss
                        </motion.button>
                        <motion.button
                          onClick={() => handleReportAction(report.id, 'warn')}
                          style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
                          className="px-2 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Warn
                        </motion.button>
                        <motion.button
                          onClick={() => handleReportAction(report.id, 'suspend')}
                          style={{ backgroundColor: '#ea580c', color: '#ffffff' }}
                          className="px-2 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Suspend
                        </motion.button>
                        <motion.button
                          onClick={() => handleReportAction(report.id, 'ban')}
                          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                          className="px-2 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Ban
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Report Detail Page
  const renderReportDetail = () => {
    if (!selectedReport) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="tx-muted mb-4">No report selected</p>
          <button
            onClick={() => setCurrentView('reports')}
            className="px-4 py-2 accent-bg text-white rounded-lg font-semibold accent-hover-darken transition-colors"
          >
            Back to Reports
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <motion.button
            onClick={() => {
              setCurrentView('reports');
              setSelectedReport(null);
            }}
            className="p-2 hover-card2 rounded-xl transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 tx-soft" />
          </motion.button>
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tx-ink">Report Details</h2>
            <p className="tx-soft text-xs sm:text-sm mt-1">
              Report against {selectedReport.reportedUserName}
            </p>
          </div>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl p-4 sm:p-6 ${
            selectedReport.status === 'pending' ? 'sf-amber border-2 bd-amber' :
            selectedReport.status === 'action_taken' ? 'sf-green border-2 bd-green' :
            'sf-card2 border-2 bd-line'
          }`}
        >
          <div className="flex items-center gap-3">
            {selectedReport.status === 'pending' && <Clock className="w-6 h-6 tx-amber" />}
            {selectedReport.status === 'action_taken' && <CheckCircle className="w-6 h-6 tx-green" />}
            {selectedReport.status === 'dismissed' && <XCircle className="w-6 h-6 tx-soft" />}
            <div>
              <p className={`font-bold text-lg ${
                selectedReport.status === 'pending' ? 'tx-amber' :
                selectedReport.status === 'action_taken' ? 'tx-green' :
                'tx-ink'
              }`}>
                {selectedReport.status === 'pending' ? 'Pending Review' :
                 selectedReport.status === 'action_taken' ? `Action Taken: ${selectedReport.actionTaken}` :
                 'Dismissed'}
              </p>
              <p className="text-sm tx-soft">Reported {formatDate(selectedReport.createdAt)}</p>
            </div>
          </div>
        </motion.div>

        {/* Report Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
        >
          <h3 className="font-bold text-lg tx-ink mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5 tx-soft" />
            Report Information
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sf-red rounded-xl p-4 border bd-red">
                <p className="text-xs tx-red mb-1 font-medium">Reported User</p>
                <p className="font-bold text-lg tx-ink">{selectedReport.reportedUserName}</p>
              </div>
              <div className="sf-card2 rounded-xl p-4">
                <p className="text-xs tx-muted mb-1 font-medium">Reported By</p>
                <p className="font-semibold tx-ink">{selectedReport.reporterName}</p>
              </div>
            </div>
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">Reason</p>
              <span className="inline-flex items-center px-3 py-1 sf-red tx-red rounded-full text-sm font-medium">
                {selectedReport.reason}
              </span>
            </div>
            <div>
              <p className="text-xs tx-muted mb-1 font-medium">Description</p>
              <p className="tx-soft leading-relaxed sf-card2 rounded-xl p-4">{selectedReport.description}</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        {selectedReport.status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="sf-card rounded-2xl p-4 sm:p-6 border-2 accent-border"
          >
            <h3 className="font-bold text-lg tx-ink mb-4">Take Action</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <motion.button
                onClick={() => {
                  handleReportAction(selectedReport.id, 'dismiss');
                  setCurrentView('reports');
                  setSelectedReport(null);
                }}
                style={{ backgroundColor: '#6b7280', color: '#ffffff' }}
                className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X className="w-4 h-4" />
                Dismiss
              </motion.button>
              <motion.button
                onClick={() => {
                  handleReportAction(selectedReport.id, 'warn');
                  setCurrentView('reports');
                  setSelectedReport(null);
                }}
                style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
                className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <AlertCircle className="w-4 h-4" />
                Warn
              </motion.button>
              <motion.button
                onClick={() => {
                  handleReportAction(selectedReport.id, 'suspend');
                  setCurrentView('reports');
                  setSelectedReport(null);
                }}
                style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
                className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserX className="w-4 h-4" />
                Suspend
              </motion.button>
              <motion.button
                onClick={() => {
                  handleReportAction(selectedReport.id, 'ban');
                  setCurrentView('reports');
                  setSelectedReport(null);
                }}
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Ban className="w-4 h-4" />
                Ban
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // Render Support Tickets
  const renderSupport = () => {
    const filteredTickets = supportTickets.filter(ticket => {
      const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
        case 'medium': return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
        case 'low': return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
        default: return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'open': return { bg: '#fef2f2', text: '#dc2626' };
        case 'in_progress': return { bg: '#fffbeb', text: '#d97706' };
        case 'resolved': return { bg: '#f0fdf4', text: '#16a34a' };
        case 'closed': return { bg: '#f3f4f6', text: '#6b7280' };
        default: return { bg: '#f3f4f6', text: '#6b7280' };
      }
    };

    const handleUpdateStatus = (ticketId: string, newStatus: SupportTicket['status']) => {
      setSupportTickets(prev => prev.map(t =>
        t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date() } : t
      ));
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tx-ink">Support Tickets</h2>
            <p className="text-sm sm:text-base tx-soft mt-1">Respond to user inquiries and issues</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1 rounded-full font-semibold" style={{ background: 'rgba(225,29,107,0.14)', color: 'var(--bx-accent-3)' }}>
              {supportTickets.filter(t => t.status === 'open').length} Open
            </span>
            <span className="px-3 py-1 rounded-full font-semibold" style={{ background: 'rgba(217,138,0,0.16)', color: 'var(--bx-amber)' }}>
              {supportTickets.filter(t => t.status === 'in_progress').length} In Progress
            </span>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 tx-faint" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 bd-line rounded-xl accent-focus-border focus:outline-none transition-colors tx-ink"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 bd-line rounded-xl accent-focus-border focus:outline-none transition-colors sf-card tx-ink font-medium"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </motion.div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="sf-card rounded-2xl p-12 border bd-line text-center"
          >
            <HelpCircle className="w-12 h-12 tx-faint mx-auto mb-3" />
            <p className="tx-muted font-medium">No support tickets found</p>
            <p className="tx-faint text-sm mt-1">Try adjusting your search or filter</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map((ticket, index) => {
              const priorityColors = getPriorityColor(ticket.priority);
              const statusColors = getStatusColor(ticket.status);
              return (
                <motion.div
                  key={ticket.id}
                  className={`sf-card rounded-2xl p-4 sm:p-6 border-2 transition-colors ${
                    ticket.status === 'open' ? 'bd-red sf-red/30' : 'bd-line hover:bd-line'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Ticket Content */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ticket.userType === 'freelancer' ? '#f0fdf4' : '#eff6ff' }}>
                          <User className="w-5 h-5" style={{ color: ticket.userType === 'freelancer' ? '#16a34a' : '#2563eb' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold tx-ink truncate">{ticket.subject}</h3>
                          <p className="text-sm tx-soft">{ticket.userName} • {ticket.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ backgroundColor: statusColors.bg, color: statusColors.text }}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ backgroundColor: priorityColors.bg, color: priorityColors.text }}>
                          {ticket.priority} Priority
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ backgroundColor: ticket.userType === 'freelancer' ? '#f0fdf4' : '#eff6ff', color: ticket.userType === 'freelancer' ? '#16a34a' : '#2563eb' }}>
                          {ticket.userType}
                        </span>
                      </div>
                      <p className="text-sm tx-soft line-clamp-2">{ticket.message}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs tx-muted">
                        <span>Created: {formatDate(ticket.createdAt)}</span>
                        {ticket.replies.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col gap-2 w-36 flex-shrink-0">
                      <motion.button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setCurrentView('supportTicketDetail');
                        }}
                        className="w-full px-4 py-2 accent-bg-10 accent-text rounded-xl text-sm font-semibold flex items-center justify-center gap-2 accent-hover-bg-20 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </motion.button>
                      {ticket.status === 'open' && (
                        <motion.button
                          onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                          style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
                          className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Mark In Progress
                        </motion.button>
                      )}
                      {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                        <motion.button
                          onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                          style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                          className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Mark Resolved
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render Support Ticket Detail
  const renderSupportTicketDetail = () => {
    if (!selectedTicket) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="tx-muted mb-4">No ticket selected</p>
          <button
            onClick={() => setCurrentView('support')}
            className="px-4 py-2 accent-bg text-white rounded-lg font-semibold accent-hover-darken transition-colors"
          >
            Back to Support Tickets
          </button>
        </div>
      );
    }

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return { bg: '#fef2f2', text: '#dc2626' };
        case 'medium': return { bg: '#fffbeb', text: '#d97706' };
        case 'low': return { bg: '#f0fdf4', text: '#16a34a' };
        default: return { bg: '#f3f4f6', text: '#6b7280' };
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'open': return { bg: '#fef2f2', text: '#dc2626' };
        case 'in_progress': return { bg: '#fffbeb', text: '#d97706' };
        case 'resolved': return { bg: '#f0fdf4', text: '#16a34a' };
        case 'closed': return { bg: '#f3f4f6', text: '#6b7280' };
        default: return { bg: '#f3f4f6', text: '#6b7280' };
      }
    };

    const priorityColors = getPriorityColor(selectedTicket.priority);
    const statusColors = getStatusColor(selectedTicket.status);

    const handleSendReply = () => {
      if (!ticketReply.trim()) return;

      const newReply = {
        id: `reply_${Date.now()}`,
        sender: 'admin' as const,
        senderName: 'Support Team',
        message: ticketReply,
        timestamp: new Date()
      };

      setSupportTickets(prev => prev.map(t =>
        t.id === selectedTicket.id
          ? { ...t, replies: [...t.replies, newReply], updatedAt: new Date(), status: t.status === 'open' ? 'in_progress' : t.status }
          : t
      ));

      setSelectedTicket(prev => prev ? { ...prev, replies: [...prev.replies, newReply], updatedAt: new Date() } : null);
      setTicketReply('');
    };

    const handleUpdateStatus = (newStatus: SupportTicket['status']) => {
      setSupportTickets(prev => prev.map(t =>
        t.id === selectedTicket.id ? { ...t, status: newStatus, updatedAt: new Date() } : t
      ));
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date() } : null);
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <motion.button
            onClick={() => {
              setCurrentView('support');
              setSelectedTicket(null);
              setTicketReply('');
            }}
            className="p-2 hover-card2 rounded-xl transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 tx-soft" />
          </motion.button>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold tx-ink">Support Ticket</h2>
            <p className="text-sm tx-soft">#{selectedTicket.id}</p>
          </div>
        </motion.div>

        {/* Ticket Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: selectedTicket.userType === 'freelancer' ? '#f0fdf4' : '#eff6ff' }}>
                <User className="w-6 h-6" style={{ color: selectedTicket.userType === 'freelancer' ? '#16a34a' : '#2563eb' }} />
              </div>
              <div>
                <h3 className="font-bold text-lg tx-ink">{selectedTicket.userName}</h3>
                <p className="text-sm tx-soft">{selectedTicket.userEmail}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize mt-1" style={{ backgroundColor: selectedTicket.userType === 'freelancer' ? '#f0fdf4' : '#eff6ff', color: selectedTicket.userType === 'freelancer' ? '#16a34a' : '#2563eb' }}>
                  {selectedTicket.userType}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold capitalize" style={{ backgroundColor: statusColors.bg, color: statusColors.text }}>
                {selectedTicket.status.replace('_', ' ')}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold capitalize" style={{ backgroundColor: priorityColors.bg, color: priorityColors.text }}>
                {selectedTicket.priority} Priority
              </span>
            </div>
          </div>
          <div className="border-t bd-line pt-4">
            <h4 className="font-bold tx-ink mb-2">{selectedTicket.subject}</h4>
            <p className="tx-soft leading-relaxed">{selectedTicket.message}</p>
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs tx-muted">
            <span>Created: {formatDate(selectedTicket.createdAt)}</span>
            <span>Updated: {formatDate(selectedTicket.updatedAt)}</span>
          </div>
        </motion.div>

        {/* Status Actions */}
        {selectedTicket.status !== 'closed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="sf-card rounded-2xl p-4 border bd-line"
          >
            <h4 className="font-semibold tx-ink mb-3">Update Status</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTicket.status !== 'open' && (
                <motion.button
                  onClick={() => handleUpdateStatus('open')}
                  style={{ background: 'rgba(225,29,107,0.14)', color: 'var(--bx-accent-3)' }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Reopen
                </motion.button>
              )}
              {selectedTicket.status !== 'in_progress' && (
                <motion.button
                  onClick={() => handleUpdateStatus('in_progress')}
                  style={{ background: 'rgba(217,138,0,0.16)', color: 'var(--bx-amber)' }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  In Progress
                </motion.button>
              )}
              {selectedTicket.status !== 'resolved' && (
                <motion.button
                  onClick={() => handleUpdateStatus('resolved')}
                  style={{ background: 'rgba(15,157,118,0.14)', color: 'var(--bx-green)' }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Resolved
                </motion.button>
              )}
              <motion.button
                onClick={() => handleUpdateStatus('closed')}
                style={{ background: 'var(--bx-card-2)', color: 'var(--bx-muted)' }}
                className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close Ticket
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Conversation Thread */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sf-card rounded-2xl p-4 sm:p-6 border bd-line"
        >
          <h4 className="font-bold tx-ink mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conversation
          </h4>

          {selectedTicket.replies.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-10 h-10 tx-faint mx-auto mb-2" />
              <p className="tx-muted">No replies yet. Send a response below.</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {selectedTicket.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`flex gap-3 ${reply.sender === 'admin' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    reply.sender === 'admin' ? 'accent-bg/10' : 'sf-card2'
                  }`}>
                    {reply.sender === 'admin' ? (
                      <Shield className="w-4 h-4 accent-text" />
                    ) : (
                      <User className="w-4 h-4 tx-soft" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${reply.sender === 'admin' ? 'text-right' : ''}`}>
                    <div className={`inline-block rounded-2xl p-3 ${
                      reply.sender === 'admin'
                        ? 'accent-bg text-white rounded-br-sm'
                        : 'sf-card2 tx-ink rounded-bl-sm'
                    }`}>
                      <p className="text-sm">{reply.message}</p>
                    </div>
                    <p className="text-xs tx-muted mt-1">
                      {reply.senderName} • {formatDate(reply.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply Input */}
          {selectedTicket.status !== 'closed' && (
            <div className="border-t bd-line pt-4">
              <textarea
                value={ticketReply}
                onChange={(e) => setTicketReply(e.target.value)}
                placeholder="Type your reply..."
                className="w-full p-3 border-2 bd-line rounded-xl accent-focus-border focus:outline-none transition-colors resize-none tx-ink"
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <motion.button
                  onClick={handleSendReply}
                  disabled={!ticketReply.trim()}
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed accent-bg"
                  style={{ color: '#ffffff' }}
                  whileHover={{ scale: ticketReply.trim() ? 1.02 : 1 }}
                  whileTap={{ scale: ticketReply.trim() ? 0.98 : 1 }}
                >
                  <Send className="w-4 h-4" />
                  Send Reply
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  // Get current view content
  const getCurrentViewContent = () => {
    switch (currentView) {
      case 'dashboard': return renderDashboard();
      case 'kyc': return renderKYCReviews();
      case 'kycDetail': return renderKYCDetail();
      case 'professions': return renderProfessionApprovals();
      case 'skills': return renderSkillApprovals();
      case 'users': return renderUsers();
      case 'userDetail': return renderUserDetail();
      case 'jobs': return renderJobs();
      case 'jobDetail': return renderJobDetail();
      case 'skillProfiles': return renderSkillProfiles();
      case 'skillProfileDetail': return renderSkillProfileDetail();
      case 'payments': return renderPayments();
      case 'paymentDetail': return renderPaymentDetail();
      case 'disputes': return (
        <DisputesDashboard
          onSelectDispute={(disputeId) => {
            setSelectedDisputeId(disputeId);
            setCurrentView('disputeDetail');
          }}
        />
      );
      case 'disputeDetail': return selectedDisputeId ? (
        <DisputeDetailView
          disputeId={selectedDisputeId}
          adminId="admin-user-id"
          onBack={() => {
            setSelectedDisputeId(null);
            setCurrentView('disputes');
          }}
          onResolved={() => {
            setSelectedDisputeId(null);
            setCurrentView('disputes');
          }}
        />
      ) : null;
      case 'reports': return renderReports();
      case 'reportDetail': return renderReportDetail();
      case 'support': return renderSupport();
      case 'supportTicketDetail': return renderSupportTicketDetail();
      default: return renderDashboard();
    }
  };

  // Calculate total pending items for notification badge
  const totalPendingItems = stats.pendingKYC + stats.pendingProfessions + stats.pendingSkills + stats.pendingProfiles + stats.activeDisputes + stats.openReports;

  return (
    <div className="bx min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: 'var(--bx-solid)', borderBottom: '1px solid var(--bx-line)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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

          {/* Right - Notification Badge */}
          <motion.div
            className="relative p-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-6 h-6" strokeWidth={1.5} style={{ color: 'var(--bx-ink-soft)' }} />
            {totalPendingItems > 0 && (
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
                <span className="text-white text-[10px] font-bold">{totalPendingItems > 99 ? '99+' : totalPendingItems}</span>
              </div>
            )}
          </motion.div>
        </div>

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
                className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] z-50 overflow-y-auto"
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
                      <h3 className="font-bold text-lg" style={{ color: 'var(--bx-ink)' }}>Admin Portal</h3>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="bx__list">
                      {navItems.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setCurrentView(item.id as AdminView);
                              setSearchQuery('');
                              setStatusFilter('all');
                              setShowMenu(false);
                            }}
                            className="bx__listrow"
                            style={{ background: isActive ? 'rgba(var(--bx-accent-rgb),0.1)' : 'none', color: isActive ? 'var(--bx-accent)' : 'var(--bx-ink)' }}
                          >
                            <span className="bx__av" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 14, background: isActive ? 'var(--bx-grad)' : 'var(--bx-card-2)', color: isActive ? '#fff' : 'var(--bx-ink-soft)', boxShadow: 'none' }}>
                              <item.icon className="w-4 h-4" />
                            </span>
                            <span className="bx__lr-main">
                              <span className="bx__lr-title" style={{ color: isActive ? 'var(--bx-accent)' : 'var(--bx-ink)' }}>{item.label}</span>
                            </span>
                            {item.badge && item.badge > 0 && (
                              <span className="bx__count">{item.badge}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Settings */}
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bx-line)' }}>
                      <button
                        onClick={() => {
                          navigate('/admin/dashboard');
                        }}
                        className="bx__listrow"
                      >
                        <span className="bx__av" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 14, background: 'var(--bx-card-2)', color: 'var(--bx-ink-soft)', boxShadow: 'none' }}>
                          <Settings className="w-4 h-4" />
                        </span>
                        <span className="bx__lr-main"><span className="bx__lr-title">Settings</span></span>
                      </button>
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

                    {/* Logout Button */}
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

      {/* Backend offline → showing cached/local data */}
      <AnimatePresence>
        {apiOnline === false && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            style={{ background: 'rgba(217,138,0,0.12)', borderBottom: '1px solid rgba(217,138,0,0.3)' }}
          >
            <div className="px-4 sm:px-6 py-2.5 max-w-7xl mx-auto flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--bx-amber)' }} />
              <p className="text-sm" style={{ color: 'var(--bx-ink-soft)' }}>
                Admin API unavailable — showing cached/local data. Actions may not be saved until the backend is reachable.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {getCurrentViewContent()}
        </div>
      </main>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && rejectTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowRejectModal(false);
              setRejectReason('');
              setRejectTarget(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl max-w-md w-full"
              style={{ background: 'var(--bx-solid)', border: '1px solid var(--bx-line)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6" style={{ borderBottom: '1px solid var(--bx-line)' }}>
                <h3 className="text-xl font-bold" style={{ color: 'var(--bx-ink)' }}>Rejection Reason</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--bx-muted)' }}>Please provide a reason for rejection</p>
              </div>

              <div className="p-6 space-y-4">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="jb-input resize-none"
                  style={{ height: '8rem' }}
                />

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                      setRejectTarget(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl font-medium"
                    style={{ background: 'var(--bx-card-2)', color: 'var(--bx-ink-soft)', border: '1px solid var(--bx-line)' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      if (rejectTarget.type === 'kyc') {
                        handleKYCReject(rejectTarget.id, rejectReason);
                      } else if (rejectTarget.type === 'profession') {
                        handleProfessionReject(rejectTarget.id, rejectReason);
                      } else if (rejectTarget.type === 'skill') {
                        handleSkillReject(rejectTarget.id, rejectReason);
                      } else if (rejectTarget.type === 'skillProfile') {
                        handleSkillProfileReject(rejectTarget.id, rejectReason);
                      }
                    }}
                    disabled={!rejectReason.trim()}
                    className="flex-1 py-2.5 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--bx-accent-3)' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Reject
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

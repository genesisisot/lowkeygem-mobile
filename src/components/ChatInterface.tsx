import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Paperclip, Image as ImageIcon, File, Check, CheckCheck, X, Clock, CheckCircle, Wallet, Shield, Flag, MoreVertical, AlertTriangle, Star, Mic, Square, Play, Pause, FileText, Loader2, Trash2 } from 'lucide-react';
import type { WorkSubmission, WorkSubmissionFile, Dispute, DisputeReason, MatchWithProfiles, MessageWithSender } from '../types/database';
import { WorkSubmissionForm } from './disputes/WorkSubmissionForm';
import { WorkSubmissionView } from './disputes/WorkSubmissionView';
import { ClientReviewPanel } from './disputes/ClientReviewPanel';
import { DisputeInitiationForm } from './disputes/DisputeInitiationForm';
import { DisputeResponseForm } from './disputes/DisputeResponseForm';
import { DisputeStatusBanner } from './disputes/DisputeStatusBanner';
import { api } from '../lib/api';
import { messagesService } from '../services/messages';
import { ratingsService } from '../services/ratings';
interface TypingResponse { is_typing: boolean }
import { storageService } from '../services/storage';
import { reportsService } from '../services/reports';
import { useToast } from './Toast';

export type PaymentStatus = 'matched' | 'funded' | 'in_progress' | 'pending_approval' | 'completed' | 'disputed' | 'refunded';

// Simple confetti component
function Confetti() {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ['var(--bx-accent)', '#FFD700', '#00D4AA', '#FF6B6B', '#4ECDC4', '#A855F7'][Math.floor(Math.random() * 6)],
    size: 8 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ y: -20, x: `${piece.left}vw`, opacity: 1, rotate: 0 }}
          animate={{
            y: '100vh',
            opacity: [1, 1, 0],
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1)
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'linear'
          }}
          style={{
            position: 'absolute',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

interface Message {
  id: string;
  sender: 'freelancer' | 'client' | 'system';
  text: string;
  timestamp: Date;
  read: boolean;
  type?: 'message' | 'payment_funded' | 'work_submitted' | 'payment_released';
  attachment?: {
    type: 'image' | 'file';
    url: string;
    name: string;
  };
  voiceNote?: {
    url: string;
    duration: number; // in seconds
  };
}

interface ChatInterfaceProps {
  otherUser: {
    name: string;
    avatar?: string;
    isOnline?: boolean;
  };
  jobTitle?: string;
  onClose?: () => void;
  onDelete?: () => void;
  userType?: 'freelancer' | 'client';
  paymentStatus?: PaymentStatus;
  contractAmount?: number;
  onFundEscrow?: () => void;
  onMarkComplete?: () => void;
  onApproveRelease?: () => void;
  showRatingModal?: boolean;
  onRatingSubmit?: (rating: number, review: string) => void;
  onCloseRatingModal?: () => void;
  // New dispute-related props
  matchId?: string;
  match?: MatchWithProfiles;
  revisionCount?: number;
  reviewDeadline?: string | null;
  workSubmissions?: WorkSubmission[];
  dispute?: Dispute | null;
  onSubmitWork?: (notes: string, links: string[], files: WorkSubmissionFile[]) => Promise<void>;
  onRequestRevision?: () => Promise<void>;
  onOpenDispute?: (reason: DisputeReason, explanation: string, evidence: WorkSubmissionFile[]) => Promise<void>;
  onRespondToDispute?: (response: string, evidence: WorkSubmissionFile[]) => Promise<void>;
  // For real-time messaging
  currentUserId?: string;
  otherUserId?: string;
}

export function ChatInterface({
  otherUser,
  jobTitle,
  onClose,
  onDelete,
  userType = 'freelancer',
  paymentStatus = 'matched',
  contractAmount = 0,
  onFundEscrow,
  onMarkComplete,
  onApproveRelease,
  showRatingModal = false,
  onRatingSubmit,
  onCloseRatingModal,
  // New dispute props
  matchId = '',
  match,
  revisionCount = 0,
  reviewDeadline = null,
  workSubmissions = [],
  dispute = null,
  onSubmitWork,
  onRequestRevision,
  onOpenDispute,
  onRespondToDispute,
  // Real-time messaging props
  currentUserId = '',
  otherUserId = '',
}: ChatInterfaceProps) {
  const { info: toastInfo, error: toastError } = useToast();
  // State for dispute modals
  const [showWorkSubmissionForm, setShowWorkSubmissionForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showDisputeResponse, setShowDisputeResponse] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // State for real messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Convert Supabase message to local Message format
  const convertToLocalMessage = (msg: MessageWithSender): Message => {
    const isCurrentUser = msg.sender_id === currentUserId;
    const senderType = msg.message_type !== 'message' ? 'system' : (isCurrentUser ? userType : (userType === 'freelancer' ? 'client' : 'freelancer'));

    const isAudio = !!msg.attachment_url && !!msg.attachment_type?.startsWith('audio');
    let voiceDuration = 0;
    if (isAudio && msg.attachment_type) {
      const match = msg.attachment_type.match(/duration=(\d+)/);
      voiceDuration = match ? parseInt(match[1], 10) : 0;
    }

    return {
      id: msg.id,
      sender: senderType as 'freelancer' | 'client' | 'system',
      text: msg.content,
      timestamp: new Date(msg.created_at),
      read: msg.read,
      type: msg.message_type as Message['type'],
      // Audio attachments render as playable voice notes; everything else is a file/image.
      voiceNote: isAudio ? { url: msg.attachment_url as string, duration: voiceDuration } : undefined,
      attachment: msg.attachment_url && !isAudio ? {
        type: msg.attachment_type?.startsWith('image') ? 'image' : 'file',
        url: msg.attachment_url,
        name: msg.attachment_type || 'file',
      } : undefined,
    };
  };

  // Fetch messages and subscribe to real-time updates
  useEffect(() => {
    if (!matchId || !currentUserId) {
      setIsLoadingMessages(false);
      return;
    }

    let isMounted = true;
    let channel: any = null;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      const { data, error } = await messagesService.getByMatch(
        matchId,
        currentUserId,
        userType || 'client'
      );

      if (isMounted) {
        if (data && !error) {
          setMessages(data.map(convertToLocalMessage));
          // Mark messages as read
          messagesService.markAsRead(matchId, currentUserId);
        }
        setIsLoadingMessages(false);
      }
    };

    const setupSubscription = () => {
      // Clean up old channel if exists
      if (channel) {
        messagesService.unsubscribe(channel);
      }

      // Subscribe to real-time messages
      channel = messagesService.subscribeToMatch(matchId, (newMessage) => {
        if (isMounted) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, convertToLocalMessage(newMessage)];
          });
          // Mark as read if from other user
          if (newMessage.sender_id !== currentUserId) {
            messagesService.markAsRead(matchId, currentUserId);
          }
        }
      });
    };

    fetchMessages();
    setupSubscription();

    // Poll typing status every 3s
    const typingPoll = setInterval(async () => {
      if (!matchId || !currentUserId) return;
      try {
        const res = await api.get<TypingResponse>(`/api/matches/${matchId}/typing?user_id=${currentUserId}`);
        if (isMounted && res.data) setOtherTyping(res.data.is_typing)
      } catch { /* ignore */ }
    }, 3000);

    return () => {
      isMounted = false;
      if (channel) {
        messagesService.unsubscribe(channel);
      }
      clearInterval(typingPoll);
    };
  }, [matchId, currentUserId]);

  // Note: Removed automatic refetch on visibility change - it was causing page freezes
  // The realtime subscription above already handles new messages
  // If manual sync is needed, add a pull-to-refresh or sync button instead

  const [otherOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingHbRef = useRef<NodeJS.Timeout | null>(null);

  // Show congratulations popup for freelancer when payment is completed
  const prevPaymentStatusRef = useRef(paymentStatus);
  useEffect(() => {
    if (prevPaymentStatusRef.current === 'completed') return;
    if (paymentStatus === 'completed' && userType === 'freelancer') {
      setShowFreelancerCongrats(true);
      if (otherUserId && matchId) {
        ratingsService.getRatingForMatch(matchId, otherUserId).then(res => {
          if (res.data) setFreelancerRating({ rating: res.data.rating, review: res.data.review || undefined });
        });
      }
    }
    prevPaymentStatusRef.current = paymentStatus;
  }, [paymentStatus, userType, otherUserId, matchId]);

  const broadcastTyping = () => {
    if (!matchId || !currentUserId || !userType) return;
    // Debounce: only send heartbeat every 3s max
    if (typingHbRef.current) return;
    typingHbRef.current = setTimeout(() => { typingHbRef.current = null; }, 3000);
    api.post(`/api/matches/${matchId}/typing`);
  };

  const [newMessage, setNewMessage] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingVoiceNote, setPlayingVoiceNote] = useState<string | null>(null);
  const [showFreelancerCongrats, setShowFreelancerCongrats] = useState(false);
  const [freelancerRating, setFreelancerRating] = useState<{ rating: number; review?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  // Upload a file to the chat-attachments bucket and send it as a message.
  const uploadAndSend = async (file: File, voiceDuration?: number) => {
    if (!matchId || !currentUserId) {
      toastInfo('Open a real conversation to share files.');
      return;
    }
    setIsSending(true);

    // Optimistic update for voice notes: show immediately
    const optimistic: Message | null = voiceDuration !== undefined ? {
      id: `opt-voice-${Date.now()}`,
      sender: userType,
      text: '',
      timestamp: new Date(),
      read: false,
      voiceNote: { url: '', duration: voiceDuration },
    } : null;
    if (optimistic) setMessages(prev => [...prev, optimistic!]);

    try {
      const uploaded = await storageService.uploadChatAttachment(matchId, currentUserId, file);
      if (!uploaded) {
        toastInfo('Upload failed. Please try again.');
        if (optimistic) setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        return;
      }
      const attachmentType = voiceDuration !== undefined
        ? `audio/webm;duration=${voiceDuration}`
        : (file.type || uploaded.type);
      const { data, error } = await messagesService.sendWithAttachment(
        matchId, currentUserId, '', uploaded.url, attachmentType
      );
      if (error) {
        toastInfo('Could not send attachment.');
        if (optimistic) setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        return;
      }
      // Replace optimistic voice note with real one from server
      if (optimistic && data) {
        const real = convertToLocalMessage(data);
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== optimistic.id);
          if (filtered.some(m => m.id === real.id)) return filtered;
          return [...filtered, real];
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const reportReasons = [
    'Harassment or inappropriate behavior',
    'Spam or scam',
    'Payment or billing issues',
    'Low quality work or service',
    'Unresponsive or unprofessional',
    'Fake profile or misrepresentation',
    'Other',
  ];

  const handleSubmitReport = async () => {
    if (!reportReason) return;
    if (!otherUserId) {
      toastError('Unable to report this user right now.');
      return;
    }

    const { error } = await reportsService.create({
      target_type: 'user',
      target_id: otherUserId,
      reason: reportReason,
      description: reportDescription || undefined,
    });

    if (error) {
      console.error('Error submitting report:', error);
      toastError('Failed to submit report. Please try again.');
      return;
    }

    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
      setReportReason('');
      setReportDescription('');
    }, 2000);
  };

  const handleSubmitRating = () => {
    if (selectedRating > 0) {
      setRatingSubmitted(true);
      if (onRatingSubmit) {
        onRatingSubmit(selectedRating, reviewText);
      }
      setTimeout(() => {
        setRatingSubmitted(false);
        setSelectedRating(0);
        setReviewText('');
        if (onCloseRatingModal) {
          onCloseRatingModal();
        }
      }, 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    if (matchId && currentUserId) {
      setIsSending(true);

      // Optimistic update: show message immediately
      const optimistic: Message = {
        id: `opt-${Date.now()}`,
        sender: userType,
        text: messageText,
        timestamp: new Date(),
        read: false,
      };
      setMessages(prev => [...prev, optimistic]);

      const { data, error } = await messagesService.send(matchId, currentUserId, messageText);
      setIsSending(false);

      if (error) {
        console.error('Failed to send message:', error);
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        setNewMessage(messageText);
        return;
      }
      // Remove optimistic message and add real one from server (if not already added by subscription)
      if (data) {
        const real = convertToLocalMessage(data);
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== optimistic.id);
          if (filtered.some(m => m.id === real.id)) return filtered;
          return [...filtered, real];
        });
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      }
    } else {
      // Fallback to local-only message (demo mode)
      const message: Message = {
        id: Date.now().toString(),
        sender: userType,
        text: messageText,
        timestamp: new Date(),
        read: false,
      };
      setMessages(prev => [...prev, message]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (type: 'image' | 'file') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : '*/*';
      fileInputRef.current.click();
    }
    setShowAttachmentMenu(false);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toastInfo('Voice recording is not supported on this device.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch {
      toastInfo('Microphone permission denied.');
    }
  };

  const stopRecorderTracks = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioStreamRef.current = null;
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    const duration = recordingTime;
    setIsRecording(false);
    if (!recorder) { stopRecorderTracks(); return; }
    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      stopRecorderTracks();
      setRecordingTime(0);
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      await uploadAndSend(file, duration);
    };
    recorder.stop();
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    stopRecorderTracks();
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayVoiceNote = (messageId: string, url?: string) => {
    // Stop whatever is currently playing.
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current = null;
    }

    if (playingVoiceNote === messageId || !url) {
      setPlayingVoiceNote(null);
      return;
    }

    const audio = new Audio(url);
    voiceAudioRef.current = audio;
    audio.onended = () => {
      setPlayingVoiceNote(null);
      voiceAudioRef.current = null;
    };
    audio.onerror = () => {
      setPlayingVoiceNote(null);
      voiceAudioRef.current = null;
      toastError('Could not play this voice note.');
    };
    audio.play().then(() => {
      setPlayingVoiceNote(messageId);
    }).catch(() => {
      setPlayingVoiceNote(null);
      voiceAudioRef.current = null;
    });
  };

  // Render payment status banner content
  const renderPaymentBanner = () => {
    if (contractAmount <= 0) return null;

    return (
      <div className="flex-shrink-0 sf-card2 px-4 py-3 border-b bd-purple">
        {/* Client: Needs to fund escrow */}
        {paymentStatus === 'matched' && userType === 'client' && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="w-5 h-5 tx-purple flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium tx-purple">Ready to start?</p>
                <p className="text-xs tx-purple truncate">Fund escrow to begin the project</p>
              </div>
            </div>
            <motion.button
              onClick={onFundEscrow}
              className="sf-purple hover-accent-bg text-white px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Wallet className="w-4 h-4" />
              Fund ₦{contractAmount.toLocaleString()}
            </motion.button>
          </div>
        )}

        {/* Freelancer: Waiting for client to fund */}
        {paymentStatus === 'matched' && userType === 'freelancer' && (
          <div className="flex flex-col gap-2 tx-amber sf-amber px-3 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Waiting for client to fund escrow (₦{contractAmount.toLocaleString()})</span>
            </div>
            <p className="text-xs font-semibold">
              ⚠️ Don't start work until escrow is funded — you're only protected once the client funds the project.
            </p>
          </div>
        )}

        {/* Freelancer: Escrow funded, can submit work */}
        {paymentStatus === 'funded' && userType === 'freelancer' && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 tx-green min-w-0">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium truncate">₦{contractAmount.toLocaleString()} secured in escrow</span>
            </div>
            <motion.button
              onClick={() => setShowWorkSubmissionForm(true)}
              className="accent-bg accent-hover-darken text-white px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FileText className="w-4 h-4" />
              Submit Work
            </motion.button>
          </div>
        )}

        {/* Freelancer: In progress, can submit work */}
        {paymentStatus === 'in_progress' && userType === 'freelancer' && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 tx-blue min-w-0">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                Work in progress {revisionCount > 0 && `(Revision ${revisionCount}/2)`}
              </span>
            </div>
            <motion.button
              onClick={() => setShowWorkSubmissionForm(true)}
              className="accent-bg accent-hover-darken text-white px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FileText className="w-4 h-4" />
              Submit Work
            </motion.button>
          </div>
        )}

        {/* Client: Escrow funded, work in progress */}
        {paymentStatus === 'funded' && userType === 'client' && (
          <div className="flex items-center gap-2 tx-green sf-green px-3 py-2 rounded-lg">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">₦{contractAmount.toLocaleString()} secured - Work in progress</span>
          </div>
        )}

        {/* Client: Freelancer submitted, needs approval. The full review UI
            (submission details + approve/revise/dispute actions) lives in
            ClientReviewPanel below. This is only a fallback shown while the
            submission details are still loading. */}
        {paymentStatus === 'pending_approval' && userType === 'client' && workSubmissions.length === 0 && (
          <div className="flex items-center gap-2 tx-purple sf-purple px-3 py-2 rounded-lg">
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Work submitted — loading review…</span>
          </div>
        )}

        {/* Freelancer: Waiting for client approval - Show what was submitted */}
        {paymentStatus === 'pending_approval' && userType === 'freelancer' && (
          <div className="sf-amber border-b bd-amber">
            <div className="flex items-center gap-2 tx-amber px-4 py-3">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">Waiting for client to approve and release ₦{contractAmount.toLocaleString()}</span>
            </div>
            {workSubmissions.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs tx-amber mb-2">Your submission:</p>
                <WorkSubmissionView submissions={workSubmissions.slice(-1)} />
              </div>
            )}
          </div>
        )}

        {/* Both: Job completed */}
        {paymentStatus === 'completed' && (
          <div className="flex items-center gap-2 tx-green sf-green px-3 py-2 rounded-lg">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Job completed - ₦{contractAmount.toLocaleString()} released</span>
          </div>
        )}

        {/* Disputed: Show dispute banner */}
        {paymentStatus === 'disputed' && dispute && (
          <DisputeStatusBanner
            dispute={dispute}
            userRole={userType}
            onRespond={userType === 'freelancer' && dispute.status === 'pending_response' ? () => setShowDisputeResponse(true) : undefined}
          />
        )}

        {/* Refunded: Show refund message */}
        {paymentStatus === 'refunded' && (
          <div className="flex items-center gap-2 tx-red sf-red px-3 py-2 rounded-lg">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Dispute resolved - Payment refunded to client</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col sf-card2 h-full"
    >
      {/* Chat Header - Fixed at top */}
      <div className="flex-shrink-0 sf-card border-b bd-line px-4 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 accent-grad rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold overflow-hidden">
              {typeof otherUser.avatar === 'string' && otherUser.avatar.startsWith('http') ? (
                <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full object-cover" />
              ) : (
                <span>{otherUser.avatar || otherUser.name[0]}</span>
              )}
            </div>
            {otherOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 sf-green-solid border-2 border-white rounded-full"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold tx-ink text-sm sm:text-base truncate">
              {otherUser.name}
            </h3>
            {jobTitle && !otherTyping && (
              <p className="text-xs sm:text-sm tx-soft truncate">{jobTitle}</p>
            )}
            {otherTyping ? (
              <p className="text-xs tx-purple font-medium flex items-center gap-1">
                <span className="inline-flex gap-0.5">
                  <span className="dx-typing-dot" />
                  <span className="dx-typing-dot" style={{ animationDelay: '0.15s' }} />
                  <span className="dx-typing-dot" style={{ animationDelay: '0.3s' }} />
                </span>
                typing…
              </p>
            ) : otherOnline ? (
              <p className="text-xs tx-green font-medium">Active now</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* More Menu Button */}
          <div className="relative">
            <motion.button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 hover-card2 rounded-full transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MoreVertical className="w-5 h-5 tx-soft" />
            </motion.button>

            {/* More Menu Dropdown */}
            <AnimatePresence>
              {showMoreMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMoreMenu(false)}
                    className="fixed inset-0 z-40"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute top-full right-0 mt-1 sf-card border bd-line rounded-xl shadow-lg z-50 overflow-hidden min-w-[160px]"
                  >
                    {(paymentStatus === 'matched' || paymentStatus === 'completed') && onDelete && (
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowDeleteModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover-red-bg tx-red text-sm font-medium transition-colors border-b bd-line"
                      >
                        <Trash2 className="w-4 h-4" />
                        {paymentStatus === 'completed' ? 'Delete Chat' : 'Clear Messages'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowReportModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover-red-bg tx-red text-sm font-medium transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                      Report User
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Close Button */}
          {onClose && (
            <motion.button
              onClick={onClose}
              className="p-2 hover-card2 rounded-full transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5 tx-soft" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Payment Status Banner */}
      {renderPaymentBanner()}

      {/* Client Review Panel - Show when work is submitted and client needs to review */}
      {paymentStatus === 'pending_approval' && userType === 'client' && match && workSubmissions.length > 0 && (
        <div className="flex-shrink-0 p-4 lg:px-8 border-b bd-line sf-card2">
          <div className="w-full max-w-2xl mx-auto">
            <ClientReviewPanel
              match={match}
              submissions={workSubmissions}
              onApprove={async () => {
                // Opens the confirmation modal (amount + irreversibility warning).
                setShowApprovalModal(true);
              }}
              onRequestRevision={async () => {
                if (onRequestRevision) {
                  await onRequestRevision();
                }
              }}
              onOpenDispute={() => setShowDisputeForm(true)}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Messages - Scrollable area that fills remaining space */}
      <div className="flex-1 overflow-y-auto p-4 lg:px-8 space-y-4 min-h-0">
        {/* Loading state */}
        {isLoadingMessages && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 tx-purple animate-spin" />
            <span className="ml-2 tx-muted">Loading messages...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoadingMessages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 sf-purple rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 tx-purple" />
            </div>
            <h3 className="text-lg font-semibold tx-ink mb-2">Start the conversation</h3>
            <p className="tx-muted text-sm max-w-xs">
              Send a message to {otherUser.name} to get started
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message, index) => {
            const isSystem = message.sender === 'system';
            const isCurrentUser = userType === message.sender;
            const showTimestamp = index === 0 ||
              Math.abs(messages[index - 1].timestamp.getTime() - message.timestamp.getTime()) > 300000;

            // System message rendering
            if (isSystem) {
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-center"
                >
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                    message.type === 'payment_funded' ? 'sf-green tx-green' :
                    message.type === 'work_submitted' ? 'sf-amber tx-amber' :
                    message.type === 'payment_released' ? 'sf-purple tx-purple' :
                    'sf-card2 tx-soft'
                  }`}>
                    {message.type === 'payment_funded' && <Wallet className="w-4 h-4" />}
                    {message.type === 'work_submitted' && <CheckCircle className="w-4 h-4" />}
                    {message.type === 'payment_released' && <CheckCircle className="w-4 h-4" />}
                    <span>{message.text}</span>
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-1"
              >
                {showTimestamp && (
                  <div className="flex justify-center">
                    <span className="text-xs tx-muted sf-card2 px-3 py-1 rounded-full">
                      {message.timestamp.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] lg:max-w-[60%] rounded-2xl px-4 py-2.5 sm:py-3 ${
                      isCurrentUser
                        ? 'sf-purple text-white'
                        : 'sf-card tx-ink border bd-line'
                    }`}
                  >
                    {message.attachment && (
                      <div className="mb-2">
                        {message.attachment.type === 'image' ? (
                          <img
                            src={message.attachment.url}
                            alt={message.attachment.name}
                            className="rounded-lg max-w-full h-auto"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 sf-card/10 rounded-lg">
                            <File className="w-5 h-5" />
                            <span className="text-sm">{message.attachment.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {message.voiceNote ? (
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <motion.button
                          onClick={() => togglePlayVoiceNote(message.id, message.voiceNote?.url)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCurrentUser
                              ? 'sf-card/20 hover:sf-card/30'
                              : 'sf-purple hover-accent-bg'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {playingVoiceNote === message.id ? (
                            <Pause className={`w-5 h-5 ${isCurrentUser ? 'text-white' : 'tx-purple'}`} />
                          ) : (
                            <Play className={`w-5 h-5 ${isCurrentUser ? 'text-white' : 'tx-purple'}`} />
                          )}
                        </motion.button>
                        <div className="flex-1">
                          <div className={`h-1 rounded-full overflow-hidden ${
                            isCurrentUser ? 'sf-card/30' : 'sf-card2'
                          }`}>
                            <motion.div
                              className={`h-full ${isCurrentUser ? 'sf-card' : 'sf-purple'}`}
                              initial={{ width: '0%' }}
                              animate={{
                                width: playingVoiceNote === message.id ? '100%' : '0%'
                              }}
                              transition={{
                                duration: message.voiceNote.duration || 3,
                                ease: 'linear'
                              }}
                            />
                          </div>
                          <span className={`text-xs mt-1 ${
                            isCurrentUser ? 'tx-muted' : 'tx-muted'
                          }`}>
                            {formatDuration(message.voiceNote.duration)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base break-words">{message.text}</p>
                    )}
                    {isCurrentUser && (
                      <div className="flex justify-end mt-1">
                        {message.read ? (
                          <CheckCheck className="w-4 h-4 tx-muted" />
                        ) : (
                          <Check className="w-4 h-4 tx-muted" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom with extra padding */}
      <div className="flex-shrink-0 sf-card border-t bd-line p-3 sm:p-4 lg:px-8 pb-6">
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3"
            >
              {/* Cancel Button */}
              <motion.button
                onClick={cancelRecording}
                className="p-2.5 sm:p-3 hover-card2 rounded-xl transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 tx-soft" />
              </motion.button>

              {/* Recording Indicator */}
              <div className="flex-1 flex items-center gap-3 px-4 py-3 sf-red rounded-xl border-2 bd-red">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-3 h-3 sf-red-solid rounded-full"
                />
                <span className="tx-red font-medium text-sm sm:text-base">
                  Recording... {formatDuration(recordingTime)}
                </span>
              </div>

              {/* Stop & Send Button */}
              <motion.button
                onClick={stopRecording}
                className="p-2.5 sm:p-3 rounded-xl text-white"
                style={{ backgroundColor: 'var(--bx-accent)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-end gap-2 sm:gap-3"
            >
              {/* Attachment Button */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className="p-2.5 sm:p-3 hover-card2 rounded-xl transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Paperclip className="w-5 h-5 sm:w-6 sm:h-6 tx-soft" />
                </motion.button>

                {/* Attachment Menu */}
                <AnimatePresence>
                  {showAttachmentMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-0 mb-2 sf-card rounded-xl shadow-xl border bd-line overflow-hidden"
                    >
                      <button
                        onClick={() => handleFileUpload('image')}
                        className="flex items-center gap-3 px-4 py-3 hover-accent-bg transition-colors w-full text-left"
                      >
                        <ImageIcon className="w-5 h-5 tx-purple" />
                        <span className="text-sm font-medium">Image</span>
                      </button>
                      <button
                        onClick={() => handleFileUpload('file')}
                        className="flex items-center gap-3 px-4 py-3 hover-accent-bg transition-colors w-full text-left border-t bd-line"
                      >
                        <File className="w-5 h-5 tx-purple" />
                        <span className="text-sm font-medium">File</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Message Input */}
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); broadcastTyping(); }}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 bd-line rounded-xl accent-focus-border focus:outline-none resize-none"
                  style={{ maxHeight: '120px' }}
                />
              </div>

              {/* Voice Note or Send Button */}
              {newMessage.trim() ? (
                <motion.button
                  onClick={handleSendMessage}
                  className="p-2.5 sm:p-3 rounded-xl text-white"
                  style={{ backgroundColor: 'var(--bx-accent)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={startRecording}
                  className="p-2.5 sm:p-3 rounded-xl text-white"
                  style={{ backgroundColor: 'var(--bx-accent)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadAndSend(file);
          e.target.value = '';
        }}
      />

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="sf-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
            >
              {reportSubmitted ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 sf-green rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 tx-green" />
                  </div>
                  <h3 className="text-xl font-bold tx-ink mb-2">Report Submitted</h3>
                  <p className="tx-soft">Thank you for your report. We'll review it shortly.</p>
                </div>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="p-4 sm:p-5 border-b bd-line flex items-center justify-between sticky top-0 sf-card z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sf-red rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 tx-red" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold tx-ink">Report {otherUser.name}</h3>
                        <p className="text-sm tx-soft">Help us keep the community safe</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="p-2 hover-card2 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 tx-muted" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium tx-soft mb-3">
                        What's the issue?
                      </label>
                      <div className="space-y-2">
                        {reportReasons.map((reason) => (
                          <button
                            key={reason}
                            onClick={() => setReportReason(reason)}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                              reportReason === reason
                                ? 'bd-red sf-red tx-red'
                                : 'bd-line accent-hover-border'
                            }`}
                          >
                            <span className="text-sm font-medium">{reason}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {reportReason && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <label className="block text-sm font-medium tx-soft mb-2">
                          Additional details (optional)
                        </label>
                        <textarea
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          placeholder="Tell us more about what happened..."
                          rows={3}
                          className="w-full px-4 py-3 border bd-line rounded-xl tx-ink ph-faint focus:outline-none focus:ring-2 accent-focus-ring focus:border-transparent resize-none"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 sm:p-5 border-t bd-line sf-card2">
                    <motion.button
                      onClick={handleSubmitReport}
                      disabled={!reportReason}
                      className="w-full py-3 sf-red-solid text-white rounded-xl font-bold hover-red-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      Submit Report
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating Modal - rendered directly without portal for reliability */}
      {console.log('ChatInterface showRatingModal:', showRatingModal)}
      {showRatingModal && (
        <div className="fixed inset-0 z-[9999]">
          {ratingSubmitted ? (
            /* Full Success Page with Confetti */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 sf-card flex flex-col items-center justify-center p-6"
            >
              <Confetti />
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 150, delay: 0.4 }}
                  className="w-24 h-24 sf-green rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-14 h-14 tx-green" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-3xl sm:text-4xl font-bold tx-ink mb-3"
                >
                  Thank You!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-lg tx-soft mb-8 max-w-sm"
                >
                  Job completed successfully! Payment has been released. Thank you for your feedback!
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  onClick={onCloseRatingModal}
                  className="px-8 py-4 rounded-xl text-white font-bold text-lg shadow-lg"
                  style={{ backgroundColor: 'var(--bx-accent)' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Back to Matches
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            /* Rating Form Modal */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={onCloseRatingModal}
            >
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="sf-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
              >
                    {/* Modal Header */}
                    <div className="p-4 sm:p-5 border-b bd-line text-center">
                      <div className="text-5xl mb-3">🎉</div>
                      <h3 className="text-xl font-bold tx-ink">Job Completed!</h3>
                      <p className="tx-soft text-sm mt-1">
                        How was your experience with {otherUser.name}?
                      </p>
                    </div>

                    {/* Modal Body */}
                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Star Rating */}
                      <div className="text-center">
                        <p className="text-sm font-medium tx-soft mb-3">Tap to rate</p>
                        <div className="flex justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <motion.button
                              key={star}
                              onClick={() => setSelectedRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1"
                            >
                              <Star
                                className={`w-10 h-10 transition-colors ${
                                  star <= (hoverRating || selectedRating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'tx-faint'
                                }`}
                              />
                            </motion.button>
                          ))}
                        </div>
                        {selectedRating > 0 && (
                          <motion.p
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm tx-soft mt-2"
                          >
                            {selectedRating === 5 && 'Excellent!'}
                            {selectedRating === 4 && 'Great!'}
                            {selectedRating === 3 && 'Good'}
                            {selectedRating === 2 && 'Fair'}
                            {selectedRating === 1 && 'Poor'}
                          </motion.p>
                        )}
                      </div>

                      {/* Review Text */}
                      <div>
                        <label className="block text-sm font-medium tx-soft mb-2">
                          Write a review (optional)
                        </label>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder={`Share your experience working with ${otherUser.name}...`}
                          rows={3}
                          className="w-full px-4 py-3 border bd-line rounded-xl tx-ink ph-faint focus:outline-none focus:ring-2 accent-focus-ring focus:border-transparent resize-none"
                        />
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 sm:p-5 border-t bd-line sf-card2 space-y-2">
                      <motion.button
                        onClick={handleSubmitRating}
                        disabled={selectedRating === 0}
                        className="w-full py-3 accent-bg text-white rounded-xl font-bold accent-hover-darken transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        Submit Review
                      </motion.button>
                      <button
                        onClick={onCloseRatingModal}
                        className="w-full py-3 tx-soft font-medium accent-hover-text transition-colors"
                      >
                        Maybe Later
                      </button>
                    </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      )}

      {/* Work Submission Modal - Freelancer submits work with evidence */}
      {showWorkSubmissionForm && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <WorkSubmissionForm
              matchId={matchId || 'demo-match'}
              freelancerId="demo-freelancer"
              currentRevisionCount={revisionCount || 0}
              onSubmit={async (notes, links, files) => {
                if (onSubmitWork) {
                  setIsSubmitting(true);
                  await onSubmitWork(notes, links, files);
                  setIsSubmitting(false);
                  setShowWorkSubmissionForm(false);
                } else {
                  // Fallback: just close the modal if no handler
                  setShowWorkSubmissionForm(false);
                }
              }}
              onCancel={() => setShowWorkSubmissionForm(false)}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Dispute Initiation Modal - Client opens dispute */}
      {showDisputeForm && (
        <div className="fixed inset-0 z-[9999] bg-black/50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
              <DisputeInitiationForm
                matchId={matchId}
                contractAmount={contractAmount}
                onSubmit={async (reason, explanation, evidence) => {
                  if (onOpenDispute) {
                    setIsSubmitting(true);
                    await onOpenDispute(reason, explanation, evidence);
                    setIsSubmitting(false);
                    setShowDisputeForm(false);
                  }
                }}
                onCancel={() => setShowDisputeForm(false)}
                isLoading={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dispute Response Modal - Freelancer responds to dispute */}
      {showDisputeResponse && dispute && (
        <div className="fixed inset-0 z-[9999] bg-black/50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
              <DisputeResponseForm
                dispute={dispute}
                matchId={matchId}
                onSubmit={async (response, evidence) => {
                  if (onRespondToDispute) {
                    setIsSubmitting(true);
                    await onRespondToDispute(response, evidence);
                    setIsSubmitting(false);
                    setShowDisputeResponse(false);
                  }
                }}
                onCancel={() => setShowDisputeResponse(false)}
                isLoading={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      <AnimatePresence>
        {showApprovalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ zIndex: 999999 }}
            onClick={() => setShowApprovalModal(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="sf-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto relative"
              style={{ zIndex: 1000000 }}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b bd-line flex items-center justify-between sticky top-0 sf-card z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sf-green rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 tx-green" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tx-ink">Approve & Release Payment</h3>
                    <p className="text-sm tx-soft">Confirm payment release</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="p-2 hover-card2 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 tx-muted" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5">
                <p className="tx-soft leading-relaxed">
                  Are you sure you want to approve the work and release <span className="font-bold tx-green">₦{contractAmount.toLocaleString()}</span> to <span className="font-semibold tx-ink">{otherUser.name}</span>?
                </p>
                <p className="tx-soft text-sm mt-3">
                  This action cannot be undone. Payment will be immediately transferred to the freelancer.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 pb-8 sm:pb-5 sf-card space-y-3 border-t bd-line">
                <motion.button
                  onClick={async () => {
                    setShowApprovalModal(false);
                    if (onApproveRelease) {
                      await onApproveRelease();
                    }
                  }}
                  className="w-full py-3.5 accent-bg text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirm & Release ₦{contractAmount.toLocaleString()}
                </motion.button>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="w-full py-3.5 sf-card border-2 bd-line tx-ink rounded-xl font-bold hover-card2 accent-hover-border transition-all text-base shadow-sm"
                >
                  Cancel
                </button>
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
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ zIndex: 999999 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="sf-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto relative"
              style={{ zIndex: 1000000 }}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b bd-line flex items-center justify-between sticky top-0 sf-card z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sf-red rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 tx-red" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tx-ink">{paymentStatus === 'completed' ? 'Delete Chat' : 'Clear Messages'}</h3>
                    <p className="text-sm tx-soft">{paymentStatus === 'completed' ? 'This cannot be undone' : 'You can still receive new messages'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 hover-card2 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 tx-muted" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5">
                <p className="tx-soft leading-relaxed">
                  {paymentStatus === 'completed'
                    ? `Are you sure you want to delete this completed chat with ${otherUser.name}? This will permanently remove all messages for both you and the freelancer.`
                    : `Are you sure you want to delete this chat with ${otherUser.name}? This will permanently remove all messages for both of you.`}
                </p>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 pb-8 sm:pb-5 sf-card space-y-3 border-t bd-line">
                <motion.button
                  onClick={() => {
                    setShowDeleteModal(false);
                    if (onDelete) {
                      onDelete();
                    }
                  }}
                  className="w-full sf-red-solid text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ filter: 'brightness(1.1)' }}
                >
                  <Trash2 className="w-5 h-5" />
                  {paymentStatus === 'completed' ? 'Delete Chat' : 'Clear Messages'}
                </motion.button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-3.5 sf-card border-2 bd-line tx-ink rounded-xl font-bold hover-card2 accent-hover-border transition-all text-base shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Freelancer Congratulations Popup */}
      <AnimatePresence>
        {showFreelancerCongrats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{ zIndex: 999999 }}
            onClick={() => setShowFreelancerCongrats(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="sf-card w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="accent-bg p-6 text-center text-white">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                  className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3"
                >
                  <span className="text-3xl">🎉</span>
                </motion.div>
                <h2 className="text-2xl font-bold">Congratulations!</h2>
                <p className="text-white/80 text-sm mt-1">Payment received successfully</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm tx-soft">Amount Earned</p>
                  <p className="text-3xl font-bold accent-text">₦{contractAmount.toLocaleString()}</p>
                </div>
                {freelancerRating && (
                  <>
                    <div className="bd-line border-t" />
                    <div className="text-center">
                      <p className="text-sm tx-soft mb-2">Rating Received</p>
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-6 h-6 ${star <= freelancerRating.rating ? 'fill-yellow-400 text-yellow-400' : 'tx-faint'}`}
                          />
                        ))}
                      </div>
                      {freelancerRating.review && (
                        <p className="text-sm tx-soft mt-2 italic">"{freelancerRating.review}"</p>
                      )}
                    </div>
                  </>
                )}
                <button
                  onClick={() => setShowFreelancerCongrats(false)}
                  className="w-full py-3 accent-bg text-white rounded-xl font-bold"
                >
                  Awesome!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  ChevronDown,
  Send,
  X,
  HelpCircle,
  Clock,
  CheckCircle,
  User,
  Bot,
  PhoneCall,
  Mail,
  ExternalLink
} from 'lucide-react';

interface SupportPageProps {
  onBack: () => void;
  userType: 'freelancer' | 'client' | 'admin';
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: Date;
  isTyping?: boolean;
}

const freelancerFAQs: FAQItem[] = [
  {
    id: '1',
    question: 'How do I get paid for completed work?',
    answer: 'Once you complete a project and the client approves the work, funds are automatically released from escrow to your linked bank account. Payments typically arrive within 1-3 business days. Make sure you have a verified bank account linked in your Wallet settings.',
    category: 'Payments'
  },
  {
    id: '2',
    question: 'How does the matching system work?',
    answer: 'Our matching system uses a Tinder-style swipe interface. When you swipe right on a job and the client has also shown interest in your profile, it\'s a match! You can then chat and discuss project details. The randomized browsing ensures fair discovery for all freelancers.',
    category: 'Getting Started'
  },
  {
    id: '3',
    question: 'What happens after I match with a client?',
    answer: 'After matching, you can chat with the client to discuss project requirements, timeline, and deliverables. Once you both agree, the client will fund the escrow. Only then should you begin work. This protects both parties and ensures payment security.',
    category: 'Projects'
  },
  {
    id: '4',
    question: 'How do I create multiple skill profiles?',
    answer: 'Go to "My Skills" from the menu. You can create up to 3 different skill profiles to showcase different services you offer. Each profile can have its own portfolio images, skills, and bio. Switch between active profiles using the skill switcher on your dashboard.',
    category: 'Profile'
  },
  {
    id: '5',
    question: 'What if a client doesn\'t pay?',
    answer: 'Never start work until the client has funded the escrow. Once escrow is funded, the payment is guaranteed. If there\'s a dispute, contact our support team and we\'ll help mediate. We always ensure freelancers get paid for completed work.',
    category: 'Payments'
  },
  {
    id: '6',
    question: 'How do I improve my visibility on the platform?',
    answer: 'Complete your profile 100%, add high-quality portfolio images, collect positive reviews, maintain a high response rate, and stay active on the platform. Our randomized discovery system gives everyone equal chances, so focus on quality over quantity.',
    category: 'Profile'
  },
];

const clientFAQs: FAQItem[] = [
  {
    id: '1',
    question: 'How does the escrow payment system work?',
    answer: 'When you match with a freelancer and agree on a project, you fund the escrow with the agreed amount. The money is held securely until the freelancer completes the work. Once you approve the deliverables, funds are released to the freelancer. This protects both parties.',
    category: 'Payments'
  },
  {
    id: '2',
    question: 'How do I find the right freelancer?',
    answer: 'Use our swipe-based discovery to browse freelancer profiles. Swipe right on profiles that interest you. When a freelancer also shows interest, you\'ll match and can chat. Our randomized system ensures you see a diverse range of talent, not just top-ranked profiles.',
    category: 'Getting Started'
  },
  {
    id: '3',
    question: 'Can I get a refund if the work isn\'t satisfactory?',
    answer: 'Yes! If the freelancer doesn\'t deliver or the work doesn\'t meet the agreed requirements, you can request a refund through our dispute resolution process. We review all disputes fairly and can issue partial or full refunds when appropriate.',
    category: 'Payments'
  },
  {
    id: '4',
    question: 'How do I post a job?',
    answer: 'Go to "My Jobs" from the menu and tap "Add New Job". Fill in the job title, description, required skills, budget, and deadline. Your job will be visible to relevant freelancers who can then show interest by swiping right on it.',
    category: 'Projects'
  },
  {
    id: '5',
    question: 'What payment methods are accepted?',
    answer: 'We accept all major debit and credit cards (Visa, Mastercard) as well as bank transfers. You can link your preferred payment method in the Wallet section. All transactions are secured with bank-level encryption.',
    category: 'Payments'
  },
  {
    id: '6',
    question: 'How do I communicate with freelancers?',
    answer: 'After matching with a freelancer, you can chat directly within the app. All communication is logged for your protection. You can share files, discuss requirements, and track project progress through the messaging interface.',
    category: 'Projects'
  },
];

const botResponses: { [key: string]: string } = {
  'hello': 'Hello! Welcome to Lowkey Gem support. How can I help you today?',
  'hi': 'Hi there! How can I assist you today?',
  'payment': 'For payment issues, please ensure your bank account or card is properly linked in Wallet settings. If funds haven\'t arrived within 3 business days, please call us at +234 800 123 4567.',
  'refund': 'For refunds, go to the disputed project in Messages, tap the menu, and select "Request Refund". Our team will review within 24-48 hours. For urgent cases, call +234 800 123 4567.',
  'match': 'Matching happens when both parties show interest. Keep swiping right on jobs/freelancers you like! Once matched, you can chat to discuss project details.',
  'escrow': 'Escrow protects both parties. Clients fund escrow before work begins, and funds are released only when work is approved. Never start work without funded escrow!',
  'account': 'For account issues like login problems or verification, please call us at +234 800 123 4567 or email support@lowkeygem.com.',
  'verification': 'To verify your account, go to Settings > Verification. You\'ll need to provide a valid ID and complete a short video verification. This typically takes 24-48 hours.',
  'agent': 'I\'ll connect you to a live agent. Please wait...',
  'default': 'I\'m not sure about that. Would you like to speak with a live agent? Just type "agent" or call us at +234 800 123 4567.'
};

export function SupportPage({ onBack, userType }: SupportPageProps) {
  const [activeTab, setActiveTab] = useState<'faq' | 'chat' | 'contact'>('faq');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m your support assistant. How can I help you today? You can ask me about payments, matching, escrow, or any other questions. Type "agent" to speak with a live person.',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnectingToAgent, setIsConnectingToAgent] = useState(false);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const faqs = userType === 'freelancer' ? freelancerFAQs : freelancerFAQs;
  const categories = ['All', ...Array.from(new Set(faqs.map(f => f.category)))];

  const filteredFAQs = selectedCategory === 'All'
    ? faqs
    : faqs.filter(f => f.category === selectedCategory);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageText = inputMessage.toLowerCase();
    setInputMessage('');

    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: 'typing',
        text: '',
        sender: 'bot',
        timestamp: new Date(),
        isTyping: true
      }]);
    }, 500);

    setTimeout(() => {
      setChatMessages(prev => prev.filter(m => m.id !== 'typing'));

      if (messageText.includes('agent') || messageText.includes('human') || messageText.includes('person')) {
        setIsConnectingToAgent(true);
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: 'Connecting you to a live agent... Please wait.',
          sender: 'bot',
          timestamp: new Date()
        }]);

        setTimeout(() => {
          setIsConnectingToAgent(false);
          setIsAgentConnected(true);
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: 'Hi! I\'m Sarah from Lowkey Gem support. How can I help you today?',
            sender: 'agent',
            timestamp: new Date()
          }]);
        }, 3000);
        return;
      }

      let response = botResponses.default;
      for (const [keyword, resp] of Object.entries(botResponses)) {
        if (messageText.includes(keyword)) {
          response = resp;
          break;
        }
      }

      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: response,
        sender: isAgentConnected ? 'agent' : 'bot',
        timestamp: new Date()
      }]);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCallSupport = () => {
    window.location.href = 'tel:+2348001234567';
  };

  const handleEmailSupport = () => {
    window.location.href = 'mailto:support@lowkeygem.com';
  };

  const handleWhatsAppSupport = () => {
    window.open('https://wa.me/2348001234567?text=Hello, I need help with Lowkey Gem', '_blank');
  };

  const tabs = [
    { id: 'faq' as const, label: 'FAQs', icon: HelpCircle },
    { id: 'chat' as const, label: 'Live Chat', icon: MessageCircle },
    { id: 'contact' as const, label: 'Contact', icon: Phone },
  ];

  const renderChat = () => (
    <motion.div
      className="bx"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, overflowY: 'auto', background: 'var(--bx-bg)', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bx-solid)', borderBottom: '1px solid var(--bx-line)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
      }}>
        <button onClick={() => setActiveTab('faq')}
          style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--bx-line)', background: 'var(--bx-card-2)', color: 'var(--bx-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center', flex: 'none' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div style={{ position: 'relative', flex: 'none' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: isAgentConnected ? 'var(--bx-grad)' : 'var(--bx-card-2)',
            border: '1px solid var(--bx-line)',
            display: 'grid', placeItems: 'center', color: isAgentConnected ? '#fff' : 'var(--bx-muted)',
          }}>
            {isAgentConnected ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
          </div>
          <div style={{
            position: 'absolute', bottom: 0, right: 0, width: 12, height: 12,
            borderRadius: '50%', border: '2px solid var(--bx-solid)',
            background: isConnectingToAgent ? 'var(--bx-amber)' : 'var(--bx-green)',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 750, color: 'var(--bx-ink)', fontSize: 15 }}>
            {isAgentConnected ? 'Sarah - Support Agent' : 'Support Assistant'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--bx-muted)', marginTop: 1 }}>
            {isConnectingToAgent ? 'Connecting...' : 'Online - Typically replies instantly'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {chatMessages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start' }}
          >
            {message.isTyping ? (
              <div style={{
                background: 'var(--bx-card)', borderRadius: 16, padding: '12px 18px',
                border: '1px solid var(--bx-line)', maxWidth: '80%',
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 150, 300].map((d, i) => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--bx-muted)',
                      animation: 'bounce 1.2s infinite',
                      animationDelay: `${d}ms`,
                    }} />
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                borderRadius: 18, padding: '12px 16px', maxWidth: '80%',
                boxShadow: 'var(--bx-shadow)',
                ...(message.sender === 'user'
                  ? { background: 'var(--bx-grad)', color: '#fff' }
                  : message.sender === 'agent'
                  ? { background: 'var(--bx-card-2)', color: 'var(--bx-ink)', border: '1px solid var(--bx-line)', borderLeft: '4px solid var(--bx-accent-2)' }
                  : { background: 'var(--bx-card)', color: 'var(--bx-ink)', border: '1px solid var(--bx-line)' }),
              }}>
                {message.sender !== 'user' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    {message.sender === 'agent' ? (
                      <User className="w-3 h-3" style={{ color: 'var(--bx-accent-2)' }} />
                    ) : (
                      <Bot className="w-3 h-3" style={{ color: 'var(--bx-muted)' }} />
                    )}
                    <span style={{ fontSize: 11, fontWeight: 600, color: message.sender === 'agent' ? 'var(--bx-accent-2)' : 'var(--bx-muted)' }}>
                      {message.sender === 'agent' ? 'Sarah' : 'Bot'}
                    </span>
                  </div>
                )}
                <p style={{ fontSize: 14, lineHeight: 1.5 }}>{message.text}</p>
                <p style={{
                  fontSize: 11, marginTop: 4,
                  color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--bx-faint)',
                }}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </motion.div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: '1px solid var(--bx-line)', padding: 16,
        background: 'var(--bx-solid)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 12, maxWidth: 640, margin: '0 auto' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="jb-input"
            style={{ borderRadius: 14, padding: '12px 16px' }}
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '12px 18px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(120deg, var(--bx-accent), var(--bx-accent-2))',
              color: '#fff', display: 'grid', placeItems: 'center',
              opacity: inputMessage.trim() ? 1 : 0.4,
              boxShadow: 'var(--bx-glow)',
            }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--bx-faint)', textAlign: 'center', marginTop: 8 }}>
          Type "agent" to speak with a live support person
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="bx" style={{ minHeight: '100%' }}>
      <div className="bx__wrap" style={{ paddingTop: 22, maxWidth: 1200 }}>
        {/* Header */}
        <motion.div className="bx__head" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <div className="bx__eyebrow">Support</div>
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
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <h1 className="bx__hi" style={{ fontSize: 'clamp(24px,3.6vw,34px)' }}>Help & Support</h1>
            </div>
            <div className="bx__sub">We're here to help</div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          style={{
            display: 'flex', gap: 4, marginBottom: 20,
            borderBottom: '1px solid var(--bx-line)',
            paddingBottom: 2,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', border: 'none', background: 'none',
                cursor: 'pointer', fontWeight: 650, fontSize: 14,
                borderBottom: activeTab === tab.id ? '2px solid var(--bx-accent)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--bx-accent)' : 'var(--bx-muted)',
                transition: 'color 0.2s, border-color 0.2s',
                marginBottom: -3,
              }}
            >
              <tab.icon className="w-4 h-4" />
              <span style={{ display: 'inline' }}>{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Category filters */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 16 }}>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: '7px 15px', borderRadius: 999, border: '1px solid var(--bx-line)',
                    background: selectedCategory === category ? 'var(--bx-grad)' : 'var(--bx-card-2)',
                    color: selectedCategory === category ? '#fff' : 'var(--bx-muted)',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: selectedCategory === category ? 'var(--bx-glow)' : 'none',
                    transition: 'all 0.18s var(--bx-ease)',
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* FAQ list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredFAQs.map((faq) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bx__tile"
                  style={{ padding: 0, overflow: 'hidden' }}
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    style={{
                      width: '100%', textAlign: 'left', border: 'none', background: 'none',
                      cursor: 'pointer', color: 'inherit', font: 'inherit',
                      padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: 14,
                    }}
                  >
                    <span style={{
                      width: 36, height: 36, borderRadius: 10, flex: 'none', marginTop: 1,
                      display: 'grid', placeItems: 'center',
                      background: 'rgba(151,7,71,0.12)', color: 'var(--bx-accent)',
                    }}>
                      <HelpCircle className="w-4 h-4" />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 650, color: 'var(--bx-ink)', fontSize: 14.5, lineHeight: 1.3 }}>
                        {faq.question}
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: 'var(--bx-accent)', marginTop: 4, display: 'inline-block',
                      }}>
                        {faq.category}
                      </span>
                    </div>
                    <ChevronDown className="w-5 h-5" style={{
                      color: 'var(--bx-faint)', flex: 'none', marginTop: 4,
                      transition: 'transform 0.22s var(--bx-ease)',
                      transform: expandedFAQ === faq.id ? 'rotate(-180deg)' : 'rotate(0deg)',
                    }} />
                  </button>

                  <AnimatePresence>
                    {expandedFAQ === faq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 22px 18px 72px' }}>
                          <p style={{ color: 'var(--bx-ink-soft)', fontSize: 14, lineHeight: 1.7 }}>
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Still need help CTA */}
            <motion.div
              className="bx__tile bx__tile--grad"
              style={{ marginTop: 20, padding: 26, border: 'none' }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center', color: '#fff', marginBottom: 14 }}>
                <HelpCircle className="w-6 h-6" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 6 }}>Still need help?</div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 18, lineHeight: 1.5 }}>
                Can't find what you're looking for? Chat with our support team or give us a call.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button
                  onClick={() => setActiveTab('chat')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    flex: 1, padding: '13px 0', borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: '#fff', color: 'var(--bx-accent)', fontWeight: 700, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <MessageCircle className="w-4 h-4" /> Live Chat
                </motion.button>
                <motion.button
                  onClick={handleCallSupport}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    flex: 1, padding: '13px 0', borderRadius: 13, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Phone className="w-4 h-4" /> Call Us
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Phone */}
            <div className="bx__tile" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flex: 'none',
                display: 'grid', placeItems: 'center', background: 'rgba(15,157,118,0.14)', color: 'var(--bx-green)',
              }}>
                <PhoneCall className="w-6 h-6" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--bx-ink)' }}>Call Us</div>
                <div style={{ fontSize: 13, color: 'var(--bx-muted)', marginTop: 2 }}>Speak directly with our support team</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--bx-accent)', marginTop: 10 }}>
                  +234 800 123 4567
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--bx-muted)', marginTop: 6, marginBottom: 14 }}>
                  <Clock className="w-4 h-4" /> 24/7 Support Available
                </div>
                <motion.button
                  onClick={handleCallSupport}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: 'var(--bx-green)', color: '#fff', fontWeight: 700, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Phone className="w-5 h-5" /> Call Now
                </motion.button>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bx__tile" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flex: 'none',
                display: 'grid', placeItems: 'center', background: 'rgba(15,157,118,0.14)', color: 'var(--bx-green)',
              }}>
                <MessageCircle className="w-6 h-6" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--bx-ink)' }}>WhatsApp</div>
                <div style={{ fontSize: 13, color: 'var(--bx-muted)', marginTop: 2 }}>Chat with us for quick responses</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--bx-accent)', marginTop: 10 }}>
                  +234 800 123 4567
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--bx-muted)', marginTop: 6, marginBottom: 14 }}>
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--bx-green)' }} /> Usually responds within 5 minutes
                </div>
                <motion.button
                  onClick={handleWhatsAppSupport}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: 'var(--bx-green)', color: '#fff', fontWeight: 700, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <ExternalLink className="w-5 h-5" /> Open WhatsApp
                </motion.button>
              </div>
            </div>

            {/* Email */}
            <div className="bx__tile" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flex: 'none',
                display: 'grid', placeItems: 'center', background: 'rgba(37,99,235,0.14)', color: 'var(--bx-blue)',
              }}>
                <Mail className="w-6 h-6" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--bx-ink)' }}>Email Support</div>
                <div style={{ fontSize: 13, color: 'var(--bx-muted)', marginTop: 2 }}>Send us detailed inquiries</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--bx-accent)', marginTop: 10, wordBreak: 'break-all' }}>
                  support@lowkeygem.com
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--bx-muted)', marginTop: 6, marginBottom: 14 }}>
                  <Clock className="w-4 h-4" /> Response within 24 hours
                </div>
                <motion.button
                  onClick={handleEmailSupport}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: 'var(--bx-blue)', color: '#fff', fontWeight: 700, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Mail className="w-5 h-5" /> Send Email
                </motion.button>
              </div>
            </div>

            {/* Office Hours */}
            <div className="bx__tile">
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--bx-ink)', marginBottom: 16 }}>Office Hours</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { day: 'Monday - Friday', hours: '8:00 AM - 10:00 PM WAT' },
                  { day: 'Saturday', hours: '9:00 AM - 6:00 PM WAT' },
                  { day: 'Sunday', hours: '10:00 AM - 4:00 PM WAT' },
                ].map((row) => (
                  <div key={row.day} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: 12, borderBottom: '1px solid var(--bx-line)',
                    fontSize: 14,
                  }}>
                    <span style={{ color: 'var(--bx-muted)' }}>{row.day}</span>
                    <span style={{ fontWeight: 650, color: 'var(--bx-ink)' }}>{row.hours}</span>
                  </div>
                ))}
              </div>
              <p style={{
                fontSize: 12, color: 'var(--bx-faint)', marginTop: 14,
                background: 'var(--bx-card-2)', padding: '10px 14px', borderRadius: 10,
              }}>
                * Phone support is available 24/7 for urgent issues
              </p>
            </div>

            {/* Emergency notice */}
            <div className="bx__tile" style={{
              background: 'rgba(217,138,0,0.10)',
              borderColor: 'rgba(217,138,0,0.3)',
              flexDirection: 'row', alignItems: 'flex-start', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flex: 'none',
                display: 'grid', placeItems: 'center',
                background: 'rgba(217,138,0,0.22)', color: 'var(--bx-amber)',
                fontWeight: 800, fontSize: 20,
              }}>
                !
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bx-ink)', marginBottom: 4 }}>For urgent payment issues</div>
                <p style={{ fontSize: 13.5, color: 'var(--bx-muted)', lineHeight: 1.6 }}>
                  If you're experiencing an urgent payment problem or suspect fraud, please call our priority line immediately at <strong style={{ color: 'var(--bx-ink)' }}>+234 800 999 9999</strong>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Chat overlay */}
      <AnimatePresence>
        {activeTab === 'chat' && renderChat()}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Bell, Menu, X, User, Sparkles, Wallet, HelpCircle, Settings,
  LogOut, Home, Zap, MessageSquare, Bookmark, type LucideIcon,
} from 'lucide-react'
import { Logo } from './Logo'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import { useNavigate } from 'react-router-dom'
import { notificationsService } from '../services/notifications'

interface FreelancerLayoutProps {
  activeView: string
  onLogout?: () => void
  children: React.ReactNode
}

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  time: Date
  read: boolean
  avatar: string
}

function getTimeAgo(date: Date) {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(diffMs / 3600000)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(diffMs / 86400000)}d ago`
}

const navLinks: { icon: LucideIcon; view: string; href: string }[] = [
  { icon: Home, view: 'dashboard', href: '/freelancer/dashboard' },
  { icon: Zap, view: 'discover', href: '/freelancer/discover' },
  { icon: MessageSquare, view: 'matches', href: '/freelancer/matches' },
  { icon: Bookmark, view: 'saved', href: '/freelancer/saved' },
]

const menuLinks: { icon: LucideIcon; label: string; href: string | null }[] = [
  { icon: User, label: 'Profile', href: '/freelancer/my-profile' },
  { icon: Sparkles, label: 'My Skills', href: '/freelancer/my-skills' },
  { icon: Wallet, label: 'Wallet', href: '/freelancer/wallet' },
  { icon: HelpCircle, label: 'Help & Support', href: '/freelancer/support' },
  { icon: Settings, label: 'Settings', href: '/freelancer/my-profile' },
]

export function FreelancerLayout({ activeView, onLogout, children }: FreelancerLayoutProps) {
  const { user } = useAuth()
  const { info: toastInfo } = useToast()
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const unreadCount = notifications.filter(n => !n.read).length

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data, error } = await notificationsService.getByUser(user.id)
    if (!error && data) {
      setNotifications(data.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        time: new Date(n.created_at),
        read: n.read,
        avatar: n.type === 'match' ? '🤝' : n.type === 'message' ? '💬' : n.type === 'payment' ? '💰' : n.type === 'job' ? '📋' : '📋',
      })))
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await notificationsService.markAsRead(id)
  }

  const markAllAsRead = async () => {
    if (!user?.id) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await notificationsService.markAllAsRead(user.id)
  }

  const routeNavigate = useNavigate()
  const handleNavigate = (href: string) => {
    setShowMenu(false)
    setShowNotifications(false)
    routeNavigate(href)
  }

  const handleLogout = () => {
    if (onLogout) {
      setShowMenu(false)
      onLogout()
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-effra)' }}>
      {/* Header */}
      <header className={`sticky top-0 z-40 ${activeView === 'discover' ? 'hidden sm:block' : ''}`}
        style={{ background: 'var(--bx-card)', borderBottom: '1px solid var(--bx-line)', backdropFilter: 'blur(14px) saturate(150%)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <motion.button
            onClick={() => setShowMenu(true)}
            style={{ padding: 8, borderRadius: '50%', color: 'var(--bx-ink)', background: 'none', border: 'none', cursor: 'pointer' }}
            whileHover={{ scale: 1.05, background: 'var(--bx-card-2)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu size={20} />
          </motion.button>

          <Logo textColor="var(--bx-ink)" />

          <motion.button
            onClick={() => setShowNotifications(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, position: 'relative' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell size={24} strokeWidth={1.5} style={{ color: 'var(--bx-ink-soft)' }} />
            {unreadCount > 0 && (
              <div
                style={{
                  position: 'absolute', top: -4, right: -6, minWidth: 18, height: 18,
                  padding: '0 5px', borderRadius: '50%', background: 'var(--bx-accent-3)',
                  border: '2px solid var(--bx-card)', color: '#fff', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span>{unreadCount}</span>
              </div>
            )}
          </motion.button>
        </div>

        {/* Notifications Panel */}
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
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%',
                maxWidth: 384, zIndex: 1000, background: 'var(--bx-card)',
                boxShadow: 'var(--bx-shadow-lg)', overflow: 'hidden',
              }}
              className="sm:top-16 sm:bottom-auto sm:rounded-2xl sm:max-w-md"
            >
              <div style={{ padding: 16, borderBottom: '1px solid var(--bx-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bx-card-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="sm:hidden"
                    style={{ padding: 8, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--bx-muted)' }}
                  >
                    <X size={20} />
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
                    <Bell size={48} style={{ color: 'var(--bx-faint)', margin: '0 auto 12px' }} />
                    <p style={{ color: 'var(--bx-muted)' }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                      <motion.a
                        key={n.id}
                        href={n.type === 'job' ? '/freelancer/discover' : '/freelancer/matches'}
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); markAsRead(n.id); setShowNotifications(false); handleNavigate(n.type === 'job' ? '/freelancer/discover' : '/freelancer/matches') }}
                        style={{
                          width: '100%', padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12,
                          textAlign: 'left', textDecoration: 'none',
                          borderBottom: '1px solid var(--bx-line)',
                          background: !n.read ? 'rgba(151,7,71,0.05)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bx-card-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                          {n.avatar}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: !n.read ? 'var(--bx-ink)' : 'var(--bx-ink-soft)' }}>
                              {n.title}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--bx-muted)', flexShrink: 0 }}>
                              {getTimeAgo(n.time)}
                            </span>
                          </div>
                          <p style={{ fontSize: 14, color: !n.read ? 'var(--bx-ink-soft)' : 'var(--bx-muted)' }}>
                            {n.message}
                          </p>
                        </div>
                        {!n.read && (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bx-accent)', flexShrink: 0, marginTop: 8 }} />
                        )}
                      </motion.a>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu Panel */}
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
              className="bx-glasspanel"
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0,
                width: 320, maxWidth: '85vw', zIndex: 1000,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: 24, borderBottom: '1px solid var(--bx-line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Logo textColor="var(--bx-ink)" />
                    <button
                      onClick={() => setShowMenu(false)}
                      style={{ padding: 8, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--bx-ink)' }}
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--bx-ink)' }}>Freelancer Account</h3>
                    <p style={{ fontSize: 14, color: 'var(--bx-muted)' }}>Manage your profile</p>
                  </div>
                </div>

                <div style={{ padding: 16, flex: 1 }}>
                  <div className="bx__list">
                    {menuLinks.map((item) =>
                      item.href ? (
                        <a
                          key={item.label}
                          href={item.href}
                          className="bx__listrow"
                          onClick={(e) => { e.preventDefault(); handleNavigate(item.href!) }}
                          style={{
                            textDecoration: 'none',
                            background: activeView === item.href.replace('/freelancer/', '') ? 'rgba(151,7,71,0.08)' : 'none',
                          }}
                        >
                          <span className="bx__av" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 14 }}>
                            <item.icon size={16} />
                          </span>
                          <span className="bx__lr-main">
                            <span className="bx__lr-title">{item.label}</span>
                          </span>
                        </a>
                      ) : (
                        <button
                          key={item.label}
                          className="bx__listrow"
                          onClick={() => toastInfo('Settings are coming soon.')}
                        >
                          <span className="bx__av" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 14 }}>
                            <item.icon size={16} />
                          </span>
                          <span className="bx__lr-main">
                            <span className="bx__lr-title">{item.label}</span>
                          </span>
                        </button>
                      )
                    )}
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bx-line)' }}>
                    <button
                      onClick={handleLogout}
                      className="bx__listrow"
                      style={{ color: 'var(--bx-accent-3)' }}
                    >
                      <span className="bx__av" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 14, background: 'rgba(225,29,107,0.16)', boxShadow: 'none' }}>
                        <LogOut size={16} style={{ color: 'var(--bx-accent-3)' }} />
                      </span>
                      <span className="bx__lr-main">
                        <span className="bx__lr-title" style={{ color: 'var(--bx-accent-3)' }}>Logout</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main
        className={`flex-1 ${activeView === 'profileDetail' ? 'overflow-y-auto' : 'overflow-hidden'} ${activeView === 'discover' ? 'sm:flex-1 fixed inset-x-0 top-0 sm:relative z-30' : ''}`}
        style={{ background: 'var(--bx-bg)', ...(activeView === 'discover' ? { bottom: '58px' } : {}) }}
      >
        <div className="h-full relative overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bx-glassnav">
        {navLinks.map((item) => {
          const active = activeView === item.view
          return (
            <a
              key={item.view}
              href={item.href}
              className={`bx-glassnav__item ${active ? 'on' : ''}`}
              aria-label={item.view}
              onClick={(e) => { e.preventDefault(); handleNavigate(item.href) }}
            >
              <item.icon size={24} strokeWidth={2.2} />
            </a>
          )
        })}
      </nav>
    </div>
  )
}

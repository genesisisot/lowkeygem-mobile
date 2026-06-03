import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Bell, Menu, X, Settings, LogOut, LayoutDashboard, FileCheck,
  Briefcase, Sparkles, Users, FileText, UserCheck, CreditCard,
  Scale, Flag, HelpCircle, type LucideIcon,
} from 'lucide-react'
import { Logo } from './Logo'
import { useNavigate } from 'react-router-dom'

interface AdminLayoutProps {
  activeView: string
  onLogout?: () => void
  children: React.ReactNode
}

const navItems: { id: string; label: string; icon: LucideIcon; href: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { id: 'kyc', label: 'KYC Reviews', icon: FileCheck, href: '/admin/kyc' },
  { id: 'professions', label: 'Professions', icon: Briefcase, href: '/admin/professions' },
  { id: 'skills', label: 'Skills', icon: Sparkles, href: '/admin/skills' },
  { id: 'users', label: 'Users', icon: Users, href: '/admin/users' },
  { id: 'jobs', label: 'Job Postings', icon: FileText, href: '/admin/jobs' },
  { id: 'skillProfiles', label: 'Skill Profiles', icon: UserCheck, href: '/admin/skill-profiles' },
  { id: 'payments', label: 'Payments', icon: CreditCard, href: '/admin/payments' },
  { id: 'disputes', label: 'Disputes', icon: Scale, href: '/admin/disputes' },
  { id: 'reports', label: 'Reports', icon: Flag, href: '/admin/reports' },
  { id: 'support', label: 'Support Tickets', icon: HelpCircle, href: '/admin/support' },
]

export function AdminLayout({ activeView, onLogout, children }: AdminLayoutProps) {
  const [showMenu, setShowMenu] = useState(false)

  const routeNavigate = useNavigate()
  const handleNavigate = (href: string) => {
    setShowMenu(false)
    routeNavigate(href)
  }

  const handleLogout = () => {
    if (onLogout) {
      setShowMenu(false)
      onLogout()
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-effra)', background: 'var(--bx-bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--bx-card)', borderBottom: '1px solid var(--bx-line)', position: 'sticky', top: 0, zIndex: 40 }}>
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

          <div style={{ width: 36 }} />
        </div>

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
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0,
                width: 320, maxWidth: '85vw', zIndex: 1000,
                background: 'var(--bx-card)', boxShadow: 'var(--bx-shadow-lg)',
                overflowY: 'auto',
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
                    <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--bx-ink)' }}>Admin Portal</h3>
                    <p style={{ fontSize: 14, color: 'var(--bx-muted)' }}>Manage your platform</p>
                  </div>
                </div>

                <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
                  <div className="bx__list">
                    {navItems.map((item) => {
                      const active = activeView === item.id
                      return (
                        <a
                          key={item.id}
                          href={item.href}
                          className="bx__listrow"
                          onClick={(e) => { e.preventDefault(); handleNavigate(item.href) }}
                          style={{
                            textDecoration: 'none',
                            background: active ? 'rgba(151,7,71,0.08)' : 'none',
                          }}
                        >
                          <span className="bx__av" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 14 }}>
                            <item.icon size={16} />
                          </span>
                          <span className="bx__lr-main">
                            <span className="bx__lr-title" style={{ color: active ? 'var(--bx-accent)' : 'var(--bx-ink)' }}>
                              {item.label}
                            </span>
                          </span>
                        </a>
                      )
                    })}
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bx-line)' }}>
                    <a
                      href="/admin/dashboard"
                      className="bx__listrow"
                      onClick={(e) => { e.preventDefault(); handleNavigate('/admin/dashboard') }}
                    >
                      <span className="bx__av" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 14 }}>
                        <Settings size={16} />
                      </span>
                      <span className="bx__lr-main">
                        <span className="bx__lr-title">Settings</span>
                      </span>
                    </a>
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
      <main className="flex-1 overflow-y-auto">
        <div style={{ padding: '16px 16px 24px', maxWidth: 1280, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}

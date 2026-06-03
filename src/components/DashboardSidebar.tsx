import { motion } from 'motion/react';
import { LogOut, type LucideIcon } from 'lucide-react';
import { Logo } from './Logo';

export interface SidebarItem {
  icon: LucideIcon;
  label: string;
  view: string;
  badge?: number;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  activeView: string;
  onSelect: (view: string) => void;
  userName?: string;
  userSub?: string;
  avatarUrl?: string | null;
  onLogout?: () => void;
}

/**
 * Persistent desktop sidebar shell shared by the client / freelancer / admin
 * portals. Hidden under 1024px (the floating bottom bar takes over on mobile);
 * the page content is offset by .dx-shell. Purely presentational — the portals
 * own the routing via onSelect.
 */
export function DashboardSidebar({
  items,
  activeView,
  onSelect,
  userName,
  userSub,
  avatarUrl,
  onLogout,
}: DashboardSidebarProps) {
  const initial = (userName || '?').trim().charAt(0).toUpperCase();
  return (
    <aside className="dx-sidebar">
      <div className="dx-sidebar__brand">
        <Logo textColor="text-black" />
      </div>

      <nav className="dx-sidebar__nav">
        {items.map((item) => {
          const active = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onSelect(item.view)}
              className={`dx-sidebar__item ${active ? 'on' : ''}`}
            >
              {active && (
                <motion.span layoutId="dx-sidebar-pill" className="dx-sidebar__pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
              )}
              <item.icon className="dx-sidebar__icon" strokeWidth={2} />
              <span className="dx-sidebar__label">{item.label}</span>
              {item.badge ? <span className="dx-sidebar__badge">{item.badge > 99 ? '99+' : item.badge}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="dx-sidebar__foot">
        <div className="dx-sidebar__user">
          <div className="dx-sidebar__avatar">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : initial}
          </div>
          <div className="dx-sidebar__user-main">
            <div className="dx-sidebar__user-name">{userName || 'Account'}</div>
            {userSub && <div className="dx-sidebar__user-sub">{userSub}</div>}
          </div>
          {onLogout && (
            <button onClick={onLogout} className="dx-sidebar__logout" aria-label="Log out" title="Log out">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

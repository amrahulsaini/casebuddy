'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Sparkles,
  Image,
  Grid,
  Settings,
  HelpCircle,
  BookOpen,
  Zap,
  Crown,
  User,
} from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import styles from './Sidebar.module.css';

const navigation = [
  {
    section: 'Tools',
    items: [
      { name: 'AI Generator', href: '/tool', icon: Sparkles },
      { name: 'Image Editor', href: '/editor', icon: Image },
      { name: 'Gallery', href: '/gallery', icon: Grid },
    ],
  },
  {
    section: 'Resources',
    items: [
      { name: 'Templates', href: '/templates', icon: Zap },
      { name: 'Documentation', href: '/docs', icon: BookOpen },
      { name: 'Help Center', href: '/help', icon: HelpCircle },
    ],
  },
  {
    section: 'Account',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Upgrade', href: '/upgrade', icon: Crown, badge: 'Pro' },
    ],
  },
];

export default function Sidebar() {
  const { isOpen, toggleSidebar, closeSidebar } = useSidebar();
  const pathname = usePathname();

  return (
    <>
      {/* Menu Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={styles.menuToggle}
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className={styles.menuToggleIcon} />
        ) : (
          <Menu className={styles.menuToggleIcon} />
        )}
      </button>

      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.visible : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        {/* Logo */}
        <div className={styles.sidebarLogo}>
          <div className={styles.logoIcon}>CB</div>
          <div className={styles.logoText}>
            <div className={styles.logoTitle}>CaseBuddy</div>
            <div className={styles.logoSubtitle}>AI Studio</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.sidebarNav}>
          {navigation.map((section, idx) => (
            <div key={idx} className={styles.navSection}>
              <div className={styles.navSectionTitle}>{section.section}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeSidebar}
                    className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  >
                    <Icon className={styles.navItemIcon} />
                    <span className={styles.navItemText}>{item.name}</span>
                    {item.badge && (
                      <span className={styles.navItemBadge}>{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.footerUser}>
            <div className={styles.userAvatar}>
              <User size={20} />
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>Guest User</div>
              <div className={styles.userRole}>Free Plan</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

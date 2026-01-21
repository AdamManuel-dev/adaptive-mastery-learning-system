/**
 * @fileoverview Main layout component with navigation and content area
 * @lastmodified 2026-01-16T18:00:00Z
 *
 * Features: Application header, navigation links, main content outlet, skip navigation link
 * Main APIs: Outlet from react-router-dom for nested route rendering
 * Constraints: Navigation links must match defined routes in App.tsx
 * Patterns: Responsive layout with mobile-friendly navigation, Lucide React icons, WCAG 2.1 AA compliant
 */

import { Brain, LayoutDashboard, BookOpen, BarChart3, Folder, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import styles from './Layout.module.css'

import type { LucideIcon } from 'lucide-react'


/**
 * Navigation link item definition
 */
interface NavItem {
  to: string
  label: string
  Icon: LucideIcon
}

/**
 * Navigation items configuration
 */
const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/review', label: 'Review', Icon: BookOpen },
  { to: '/analytics', label: 'Analytics', Icon: BarChart3 },
  { to: '/concepts', label: 'Concepts', Icon: Folder },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

/**
 * Main layout component providing consistent structure across all pages
 * Includes header with navigation and main content area
 * Provides skip navigation link for keyboard accessibility (WCAG 2.4.1)
 */
function Layout(): React.JSX.Element {
  return (
    <div className={styles.layout}>
      {/* Skip navigation link for keyboard users - WCAG 2.4.1 */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>
              <Brain size={20} strokeWidth={2.5} />
            </span>
            <h1 className={styles.logoText}>Adaptive Mastery</h1>
          </div>
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
                end={item.to === '/'}
              >
                <span className={styles.navIcon}>
                  <item.Icon size={16} />
                </span>
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content" className={styles.main} tabIndex={-1}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout

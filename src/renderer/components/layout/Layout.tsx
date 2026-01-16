/**
 * @fileoverview Main layout component with navigation and content area
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Application header, navigation links, main content outlet
 * Main APIs: Outlet from react-router-dom for nested route rendering
 * Constraints: Navigation links must match defined routes in App.tsx
 * Patterns: Responsive layout with mobile-friendly navigation
 */

import { NavLink, Outlet } from 'react-router-dom'

import styles from './Layout.module.css'

/**
 * Navigation link item definition
 */
interface NavItem {
  to: string
  label: string
  icon: string
}

/**
 * Navigation items configuration
 */
const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'D' },
  { to: '/review', label: 'Review', icon: 'R' },
  { to: '/concepts', label: 'Concepts', icon: 'C' },
  { to: '/settings', label: 'Settings', icon: 'S' },
]

/**
 * Main layout component providing consistent structure across all pages
 * Includes header with navigation and main content area
 */
function Layout(): React.JSX.Element {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>A</span>
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
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout

import { NavLink } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="navbar">
      <NavItem to="/dashboard" iconClass="nav-icon-home" label="홈" />
      <NavItem to="/transfer" iconClass="nav-icon-send" label="송금" />
      <NavItem to="/history" iconClass="nav-icon-history" label="내역" />
      <NavItem to="/notifications" iconClass="nav-icon-bell" label="알림" />
    </nav>
  )
}

function NavItem({ to, iconClass, label }: { to: string; iconClass: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) =>
        `navbar-item${isActive ? ' navbar-item--active' : ''}`
      }
    >
      <span className="navbar-icon">
        <span className={iconClass} />
      </span>
      <span className="navbar-label">{label}</span>
    </NavLink>
  )
}

export default Navbar

import { NavLink } from 'react-router-dom'

function Navbar() {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      background: 'white',
      borderBottom: '1px solid #e5e8eb',
      display: 'flex',
      justifyContent: 'center',
      gap: 8,
      padding: '10px 16px',
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    }}>
      <NavItem to="/" icon="🏠" label="홈" />
      <NavItem to="/transfer" icon="💸" label="송금" />
      <NavItem to="/notifications" icon="🔔" label="알림" />
    </nav>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        textDecoration: 'none',
        color: isActive ? '#3182f6' : '#8b95a1',
        fontSize: 14,
        fontWeight: isActive ? 700 : 500,
        padding: '8px 20px',
        borderRadius: 24,
        background: isActive ? '#e8f0fe' : 'transparent',
        transition: 'all 0.2s',
      })}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export default Navbar

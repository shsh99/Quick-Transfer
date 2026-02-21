import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav style={{
      background: 'white',
      padding: '16px 24px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#3182f6', fontWeight: 700, fontSize: 20 }}>
        Quick Transfer
      </Link>
      <div style={{ display: 'flex', gap: 16 }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#333' }}>대시보드</Link>
        <Link to="/transfer" style={{ textDecoration: 'none', color: '#333' }}>송금</Link>
        <Link to="/notifications" style={{ textDecoration: 'none', color: '#333' }}>알림</Link>
      </div>
    </nav>
  )
}

export default Navbar

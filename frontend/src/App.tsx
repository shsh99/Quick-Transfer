import { Routes, Route, useLocation } from 'react-router-dom'
import { NotificationProvider } from './context/NotificationContext'
import Navbar from './components/common/Navbar'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import TransferPage from './pages/TransferPage'
import TransferDetailPage from './pages/TransferDetailPage'
import NotificationsPage from './pages/NotificationsPage'

function AppContent() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <div className="app">
      {!isLanding && <Navbar />}
      {isLanding ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      ) : (
        <main className="container">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/transfer/:transferId" element={<TransferDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Routes>
        </main>
      )}
    </div>
  )
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  )
}

export default App

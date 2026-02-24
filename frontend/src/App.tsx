import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { NotificationProvider, useNotifications } from './context/NotificationContext'
import Navbar from './components/common/Navbar'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import TransferPage from './pages/TransferPage'
import TransferDetailPage from './pages/TransferDetailPage'
import NotificationsPage from './pages/NotificationsPage'
import AccountDetailPage from './pages/AccountDetailPage'
import HistoryPage from './pages/HistoryPage'

function ToastNotification() {
  const { toast, dismissToast } = useNotifications()
  const navigate = useNavigate()

  if (!toast) return null

  const isSuccess = toast.type === 'TRANSFER_COMPLETED'

  return (
    <div className={`toast toast--visible ${isSuccess ? 'toast--success' : 'toast--error'}`} onClick={() => { dismissToast(); navigate('/notifications') }}>
      <div className="toast__icon">
        <span className={`css-icon ${isSuccess ? 'icon-check' : 'icon-close'}`} />
      </div>
      <div className="toast__body">
        <div className="toast__title">{isSuccess ? '송금 완료' : '송금 실패'}</div>
        <div className="toast__message">{toast.message}</div>
      </div>
    </div>
  )
}

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
            <Route path="/account/:accountNumber" element={<AccountDetailPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/transfer/:transferId" element={<TransferDetailPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Routes>
        </main>
      )}
      {!isLanding && <ToastNotification />}
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

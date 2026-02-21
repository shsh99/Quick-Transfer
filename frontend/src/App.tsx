import { Routes, Route } from 'react-router-dom'
import Navbar from './components/common/Navbar'
import DashboardPage from './pages/DashboardPage'
import TransferPage from './pages/TransferPage'
import TransferDetailPage from './pages/TransferDetailPage'
import NotificationsPage from './pages/NotificationsPage'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/transfer/:transferId" element={<TransferDetailPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

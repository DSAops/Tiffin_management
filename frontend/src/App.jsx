import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import HistoryPage from './pages/HistoryPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white text-black">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="history" element={<HistoryPage />} />
            </Route>
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#000',
                color: '#fff',
                border: '1px solid #374151',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500'
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

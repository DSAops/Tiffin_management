import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

function AuthDebug() {
  const { user, token, isAuthenticated } = useAuth()

  const testAuth = async () => {
    try {
      console.log('Testing auth with token:', token ? `${token.substring(0, 20)}...` : 'null')
      console.log('Axios default headers:', axios.defaults.headers.common)
      const response = await axios.get('/api/debug/auth')
      console.log('Auth test response:', response.data)
      toast.success('Auth test successful!')
    } catch (error) {
      console.error('Auth test failed:', error)
      console.error('Error response:', error.response)
      toast.error('Auth test failed: ' + (error.response?.data?.error || error.message))
    }
  }

  const checkLocalStorage = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    console.log('LocalStorage contents:')
    console.log('- Token:', storedToken ? `${storedToken.substring(0, 20)}...` : 'null')
    console.log('- User:', storedUser)
    console.log('- Axios headers:', axios.defaults.headers.common)
  }

  return (
    <div className="card p-6 mb-6 bg-yellow-50 border-yellow-200">
      <h3 className="text-lg font-semibold text-black mb-4">🔧 Auth Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <p><strong>Is Authenticated:</strong> {isAuthenticated ? '✅' : '❌'}</p>
        <p><strong>Has Token:</strong> {token ? '✅' : '❌'}</p>
        <p><strong>User Object:</strong></p>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
        <p><strong>User ID (id):</strong> {user?.id || 'undefined'}</p>
        <p><strong>User ID (_id):</strong> {user?._id || 'undefined'}</p>
        <p><strong>User ID (userId):</strong> {user?.userId || 'undefined'}</p>
        <p><strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'undefined'}</p>
      </div>
      
      <button
        onClick={testAuth}
        className="mt-4 btn-secondary mr-2"
      >
        Test Auth Endpoint
      </button>
      
      <button
        onClick={checkLocalStorage}
        className="mt-4 btn-secondary"
      >
        Check LocalStorage
      </button>
    </div>
  )
}

export default AuthDebug

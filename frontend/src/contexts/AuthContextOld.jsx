import React, { createContext, useContext, useReducer, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false
}

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token
      }
    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null
      }
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Configure axios interceptor
  useEffect(() => {
    if (state.token) {
      console.log('Setting axios auth header with token:', state.token?.substring(0, 20) + '...')
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
      localStorage.setItem('token', state.token)
      localStorage.setItem('user', JSON.stringify(state.user))
    } else {
      console.log('Removing axios auth header')
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }, [state.token])

  // Check for existing auth on app start
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    console.log('Checking localStorage on startup:')
    console.log('- Token exists:', !!token)
    console.log('- User exists:', !!user)
    console.log('- Token value:', token ? `${token.substring(0, 20)}...` : 'null')
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user)
        console.log('Restored user from localStorage:', parsedUser) // Debug log
        console.log('Restored token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null')
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            token,
            user: parsedUser
          }
        })
      } catch (error) {
        console.error('Error parsing stored user:', error)
        dispatch({ type: 'AUTH_ERROR' })
      }
    } else {
      console.log('No token or user found in localStorage')
      dispatch({ type: 'AUTH_ERROR' })
    }
  }, [])

  const login = async (email, password) => {
    try {
      dispatch({ type: 'AUTH_START' })
      
      const response = await axios.post('/api/users/login', {
        email,
        password
      })

      const { user, token } = response.data
      console.log('Login response user:', user) // Debug log
      console.log('Login response token:', token) // Debug log

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      })

      toast.success(`Welcome back, ${user.name}!`)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed'
      dispatch({ type: 'AUTH_ERROR' })
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const signup = async (name, email, password) => {
    try {
      dispatch({ type: 'AUTH_START' })
      
      const response = await axios.post('/api/users/signup', {
        name,
        email,
        password
      })

      const { user, token } = response.data

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      })

      toast.success(`Welcome, ${user.name}!`)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Signup failed'
      dispatch({ type: 'AUTH_ERROR' })
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out successfully')
  }

  const value = {
    ...state,
    login,
    signup,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

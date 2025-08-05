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
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
      localStorage.setItem('token', state.token)
      localStorage.setItem('user', JSON.stringify(state.user))
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }, [state.token])

  // Check for existing auth on app start
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (token && user) {
      try {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            token,
            user: JSON.parse(user)
          }
        })
      } catch (error) {
        dispatch({ type: 'AUTH_ERROR' })
      }
    } else {
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

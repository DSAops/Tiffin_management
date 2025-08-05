import React, { createContext, useContext, useReducer, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

const initialState = {
  user: null,
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
        user: action.payload.user
      }
    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null
      }
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for existing user on app start (no token needed)
  useEffect(() => {
    const user = localStorage.getItem('user')
    
    if (user) {
      try {
        const parsedUser = JSON.parse(user)
        console.log('Restored user from localStorage:', parsedUser)
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: parsedUser }
        })
      } catch (error) {
        console.error('Error parsing stored user:', error)
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

      const { user } = response.data
      console.log('Login response user:', user)

      // Store user in localStorage (no token needed)
      localStorage.setItem('user', JSON.stringify(user))

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user }
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

      const { user } = response.data

      // Store user in localStorage (no token needed)
      localStorage.setItem('user', JSON.stringify(user))

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user }
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
    localStorage.removeItem('user')
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

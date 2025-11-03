import { useState, useCallback } from 'react'
import { authAPI, User } from '@/lib/api'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setLoading(false)
        return
      }

      const userData = await authAPI.me()
      setUser(userData)
    } catch (error) {
      localStorage.removeItem('access_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authAPI.login(email, password)
    const userData = await authAPI.me()
    setUser(userData)
    return response
  }, [])

  const register = useCallback(async (
    email: string,
    password: string,
    username?: string,
    fullName?: string
  ) => {
    await authAPI.register(email, password, username, fullName)
    const response = await authAPI.login(email, password)
    const userData = await authAPI.me()
    setUser(userData)
    return response
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setUser(null)
  }, [])

  return {
    user,
    loading,
    checkAuth,
    login,
    register,
    logout,
  }
}

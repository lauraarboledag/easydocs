import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (tokenData, userData, refreshToken) => {
    localStorage.setItem('token', tokenData)
    localStorage.setItem('user', JSON.stringify(userData))
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    }
    setToken(tokenData)
    setUser(userData)
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      try {
        const api = (await import('../services/api')).default
        await api.post('/auth/logout', { refresh_token: refreshToken })
      } catch {
        // silencioso
      }
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
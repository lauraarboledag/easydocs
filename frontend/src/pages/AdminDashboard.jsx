import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  LayoutDashboard, Building2, FileText, CreditCard,
  ArrowLeftRight, Settings, LogOut, Bell, TrendingUp,
  Users, CheckCircle, Clock, XCircle, ChevronRight,
  Shield, AlertCircle
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Instituciones', icon: Building2, path: '/admin/instituciones' },
  { label: 'Plantillas', icon: FileText, path: '/admin/plantillas' },
  { label: 'Planes', icon: CreditCard, path: '/admin/planes' },
  { label: 'Transacciones', icon: ArrowLeftRight, path: '/admin/transacciones' },
]

const TRANSACTION_STATUS = {
  pending: { label: 'Pendiente', style: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Confirmado', style: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rechazado', style: 'bg-red-100 text-red-600', icon: XCircle },
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [institutions, setInstitutions] = useState([])
  const [transactions, setTransactions] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instRes, transRes, plansRes] = await Promise.all([
          api.get('/institutions/'),
          api.get('/transactions/'),
          api.get('/plans/'),
        ])
        setInstitutions(instRes.data)
        setTransactions(transRes.data)
        setPlans(plansRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const pendingTransactions = transactions.filter(t => t.status === 'pending')
  const confirmedTransactions = transactions.filter(t => t.status === 'confirmed')

  const handleConfirmTransaction = async (transactionId) => {
    try {
      await api.patch(`/transactions/${transactionId}/confirm`, { notes: 'Confirmado desde panel admin' })
      const res = await api.get('/transactions/')
      setTransactions(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Sidebar */}
      <aside className="w-56 bg-[#1a2b4a] flex flex-col fixed h-full">
        <div className="p-6 border-b border-blue-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-[#1a2b4a]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm">EasyDocs</p>
              <p className="text-yellow-300 text-xs font-medium">Panel Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                location.pathname === path
                  ? 'bg-blue-800 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-900 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-blue-800 hover:text-white transition-colors">
            <Settings size={16} /> Configuración
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-red-800 hover:text-white transition-colors"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="ml-56 flex-1 flex flex-col">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Panel de Administración</h1>
            <p className="text-xs text-gray-400">EduDynamis — Vista global de la plataforma</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell size={20} />
              {pendingTransactions.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Shield size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{user?.full_name}</p>
                <p className="text-xs text-yellow-600 font-medium">Superadmin</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8">

          {/* Banner */}
          <div className="rounded-2xl p-8 mb-8 flex items-center justify-between" style={{background: 'linear-gradient(to right, #1a2b4a, #2952cc)'}}>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Bienvenido, {user?.full_name?.split(' ')[0]}
              </h2>
              <p className="text-blue-200">
                Tienes <strong className="text-white">{pendingTransactions.length}</strong> transacciones pendientes de confirmación.
              </p>
            </div>
            {pendingTransactions.length > 0 && (
              <button
                onClick={() => navigate('/admin/transacciones')}
                className="bg-white text-[#1a2b4a] font-semibold px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <AlertCircle size={18} />
                Revisar ahora
              </button>
            )}
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Instituciones</span>
                <Building2 size={14} className="text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{institutions.length}</p>
              <p className="text-xs text-gray-400 mt-1">Registradas</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Planes</span>
                <CreditCard size={14} className="text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{plans.length}</p>
              <p className="text-xs text-gray-400 mt-1">Disponibles</p>
            </div>

            <div className={`bg-white rounded-xl p-5 border ${pendingTransactions.length > 0 ? 'border-yellow-200' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Transacciones</span>
                {pendingTransactions.length > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                    Alerta
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900">{pendingTransactions.length}</p>
              <p className="text-xs text-gray-400 mt-1">Pendientes</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Confirmadas</span>
                <TrendingUp size={14} className="text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{confirmedTransactions.length}</p>
              <p className="text-xs text-gray-400 mt-1">Este período</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Transacciones pendientes */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-800">Transacciones Pendientes</h3>
                <button
                  onClick={() => navigate('/admin/transacciones')}
                  className="text-sm text-[#2952cc] hover:underline"
                >
                  Ver todas
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Cargando...</div>
              ) : pendingTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Todo al día</p>
                  <p className="text-gray-400 text-sm mt-1">No hay transacciones pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Clock size={16} className="text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            ${(transaction.amount / 100).toLocaleString('es-CO')} COP
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(transaction.created_at).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                          Pendiente
                        </span>
                        <button
                          onClick={() => handleConfirmTransaction(transaction.id)}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                        >
                          <CheckCircle size={12} />
                          Confirmar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instituciones recientes */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-800">Instituciones</h3>
                <button
                  onClick={() => navigate('/admin/instituciones')}
                  className="text-sm text-[#2952cc] hover:underline"
                >
                  Ver todas
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Cargando...</div>
              ) : institutions.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Sin instituciones aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {institutions.slice(0, 5).map((inst) => (
                    <div key={inst.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 size={14} className="text-[#2952cc]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-32">{inst.name}</p>
                          <p className="text-xs text-gray-400">{inst.municipality}</p>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${inst.is_active ? 'bg-green-400' : 'bg-gray-300'}`} />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => navigate('/admin/instituciones')}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Ver todas las instituciones
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* EduBot flotante */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#1a2b4a] hover:bg-[#2952cc] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    </div>
  )
}
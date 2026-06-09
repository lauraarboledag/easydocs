import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  FileText, ChevronLeft, Download, CheckCircle,
  AlertCircle, LayoutDashboard, Users, GraduationCap,
  ClipboardList, CreditCard, Settings, LogOut,
  Bell, MessageSquare, ChevronRight
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Documentos', icon: FileText, path: '/documentos' },
  { label: 'Usuarios', icon: Users, path: '/usuarios' },
  { label: 'Estudiantes', icon: GraduationCap, path: '/estudiantes' },
  { label: 'Matrículas', icon: ClipboardList, path: '/matriculas' },
  { label: 'Suscripción', icon: CreditCard, path: '/suscripcion' },
]

const FIELD_LABELS = {
  nombre_estudiante: 'Nombre del estudiante',
  documento_estudiante: 'Documento de identidad',
  tipo_documento: 'Tipo de documento',
  lugar_expedicion: 'Lugar de expedición',
  nombre_programa: 'Nombre del programa',
  nombre_curso: 'Nombre del curso',
  duracion_horas: 'Duración en horas',
  total_horas: 'Total de horas',
  resolucion_programa: 'Resolución del programa',
  numero_libro: 'Número del libro',
  folio: 'Folio',
  fecha_registro: 'Fecha de registro',
  numero_matricula: 'Número de matrícula',
  folio_matricula: 'Folio de matrícula',
  anio_inicio: 'Año de inicio',
  filas_modulos: 'Módulos (separados por coma)',
  filas_modulos_curso: 'Módulos en curso',
  filas_calificaciones: 'Calificaciones',
  filas_recuperacion: 'Recuperaciones',
  filas_certificados: 'Certificados',
  filas_plan_mejoramiento: 'Plan de mejoramiento',
  nombre_director: 'Nombre del director',
  documento_director: 'Documento del director',
  numero_acta: 'Número de acta',
  nombre_estamento: 'Nombre del estamento',
  lugar: 'Lugar de reunión',
  hora_inicio: 'Hora de inicio',
  hora_fin: 'Hora de finalización',
  asistentes: 'Asistentes',
  ausentes: 'Ausentes',
  proposito: 'Propósito de la reunión',
  punto_3: 'Punto 3 del orden del día',
  punto_4: 'Punto 4 del orden del día',
  punto_5: 'Punto 5 del orden del día',
  desarrollo: 'Desarrollo de la reunión',
  acuerdos: 'Acuerdos y propuestas',
  compromisos: 'Compromisos',
  mision: 'Misión institucional',
  vision: 'Visión institucional',
  principios_fines: 'Principios y fines',
  programas_registrados: 'Programas registrados',
  estrategia_pedagogica: 'Estrategia pedagógica',
  organizacion_administrativa: 'Organización administrativa',
  reglamento: 'Reglamento de estudiantes y formadores',
  autoevaluacion: 'Autoevaluación institucional',
  periodo: 'Período',
  resultados_autoevaluacion: 'Resultados de autoevaluación',
  fortalezas: 'Fortalezas identificadas',
  debilidades: 'Debilidades identificadas',
  seguimiento_plan: 'Seguimiento al plan anterior',
  tipo_registro: 'Tipo de registro (DUPLICADO / MODIFICACIÓN)',
  numero_registro: 'Número del registro inicial',
  observaciones: 'Observaciones',
  total_estudiantes: 'Total de estudiantes',
  primer_nombre: 'Primer nombre en el registro',
  ultimo_nombre: 'Último nombre en el registro',
  codigo_matricula: 'Código de matrícula',
  barrio: 'Barrio',
  comuna: 'Comuna',
  telefono_estudiante: 'Teléfono del estudiante',
  tipo_certificado: 'Tipo de certificado que otorga',
  direccion: 'Dirección de residencia',
  dia: 'Día',
  mes: 'Mes',
  anio: 'Año',
}

const MULTILINE_FIELDS = [
  'asistentes', 'ausentes', 'proposito', 'desarrollo', 'acuerdos',
  'compromisos', 'mision', 'vision', 'principios_fines', 'programas_registrados',
  'estrategia_pedagogica', 'organizacion_administrativa', 'reglamento',
  'autoevaluacion', 'resultados_autoevaluacion', 'fortalezas', 'debilidades',
  'seguimiento_plan', 'observaciones', 'filas_modulos', 'filas_modulos_curso',
  'filas_calificaciones', 'filas_recuperacion', 'filas_certificados',
  'filas_plan_mejoramiento', 'punto_3', 'punto_4', 'punto_5',
]

export default function DocumentNew() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [formData, setFormData] = useState({})
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [createdDoc, setCreatedDoc] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/templates/').then(res => setTemplates(res.data))
  }, [])

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template)
    const initial = {}
    template.required_fields.forEach(f => { initial[f] = '' })
    setFormData(initial)
    setStep(2)
    setError('')
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleCreate = async () => {
    const empty = selectedTemplate.required_fields.filter(f => !formData[f])
    if (empty.length > 0) {
      setError(`Completa los campos obligatorios: ${empty.map(f => FIELD_LABELS[f] || f).join(', ')}`)
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/documents/', {
        template_id: selectedTemplate.id,
        document_data: formData,
      })
      setCreatedDoc(res.data)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear el documento.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!createdDoc) return
    setDownloading(true)
    try {
      const res = await api.get(`/documents/${createdDoc.id}/pdf`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${selectedTemplate.name}_${createdDoc.id.split('-')[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error al generar el PDF.')
    } finally {
      setDownloading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
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
              <p className="text-blue-300 text-xs">Gestión Institucional</p>
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

      {/* Contenido */}
      <main className="ml-56 flex-1 flex flex-col">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => step === 1 ? navigate('/documentos') : setStep(step - 1)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Nuevo documento</h1>
              <p className="text-xs text-gray-400">
                {step === 1 && 'Selecciona el tipo de documento'}
                {step === 2 && selectedTemplate?.name}
                {step === 3 && 'Documento generado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2952cc] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-800">{user?.full_name}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-8">
            {['Tipo de documento', 'Datos del documento', 'Descargar PDF'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 ${i + 1 <= step ? 'text-[#2952cc]' : 'text-gray-400'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > i + 1 ? 'bg-green-500 text-white' :
                    step === i + 1 ? 'bg-[#2952cc] text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{label}</span>
                </div>
                {i < 2 && <ChevronRight size={14} className="text-gray-300 mx-1" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Paso 1 — Selección de plantilla */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Selecciona el tipo de documento</h2>
              <p className="text-gray-500 text-sm mb-6">Elige la plantilla reglamentaria que necesitas generar.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-xl hover:border-[#2952cc] hover:bg-blue-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                        <FileText size={18} className="text-[#2952cc]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{template.name}</p>
                        {template.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{template.description}</p>
                        )}
                        <p className="text-xs text-blue-500 mt-1">
                          {template.required_fields.length} campos requeridos
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-[#2952cc] flex-shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 2 — Formulario */}
          {step === 2 && selectedTemplate && (
            <div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                <FileText size={18} className="text-[#2952cc] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#1a2b4a]">{selectedTemplate.name}</p>
                  <p className="text-xs text-blue-600 mt-0.5">{selectedTemplate.description}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Datos del documento</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Los datos de tu institución se incluirán automáticamente. Completa los campos específicos del documento.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {selectedTemplate.required_fields.map((field) => {
                    const isMultiline = MULTILINE_FIELDS.includes(field)
                    const label = FIELD_LABELS[field] || field
                    return (
                      <div key={field} className={isMultiline ? 'md:col-span-2' : ''}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {label} *
                        </label>
                        {isMultiline ? (
                          <textarea
                            value={formData[field] || ''}
                            onChange={e => handleChange(field, e.target.value)}
                            rows={3}
                            placeholder={`Ingresa ${label.toLowerCase()}...`}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={formData[field] || ''}
                            onChange={e => handleChange(field, e.target.value)}
                            placeholder={`Ingresa ${label.toLowerCase()}...`}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc]"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => setStep(1)}
                    className="text-gray-500 hover:text-gray-700 font-medium flex items-center gap-2 transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Cambiar plantilla
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-300 text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {loading ? 'Creando...' : (
                      <>
                        Crear documento
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3 — Descarga */}
          {step === 3 && createdDoc && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-500" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Documento creado!</h2>
              <p className="text-gray-500 mb-2">{selectedTemplate?.name}</p>
              <p className="text-xs text-gray-400 font-mono mb-8">ID: {createdDoc.id}</p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-300 text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {downloading ? 'Generando PDF...' : (
                    <>
                      <Download size={18} />
                      Descargar PDF
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate('/documentos')}
                  className="border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Ver historial
                </button>
                <button
                  onClick={() => {
                    setStep(1)
                    setSelectedTemplate(null)
                    setFormData({})
                    setCreatedDoc(null)
                    setError('')
                  }}
                  className="text-[#2952cc] font-medium hover:underline py-3 px-4"
                >
                  Generar otro
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* EduBot flotante */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#1a2b4a] hover:bg-[#2952cc] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50">
        <MessageSquare size={22} />
      </button>
    </div>
  )
}
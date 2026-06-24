import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Plus,
  Home,
  MessageCircle,
  Phone,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  ChevronLeft,
  Mail,
  Clock,
  ExternalLink,
  BookOpen,
  FileText,
  GraduationCap,
  Users,
  CreditCard,
  Shield,
} from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "¿Qué es el LR001 y cómo se diligencia?",
  "¿Qué firmas requiere el libro de matrículas?",
  "¿Cuánto tiempo debo conservar los libros reglamentarios?",
];

const ARTICLE_CATEGORIES = [
  {
    id: "primeros-pasos",
    label: "Primeros pasos",
    icon: Home,
    articles: [
      {
        id: "primer-documento",
        title: "¿Cómo genero mi primer documento reglamentario?",
        content:
          'Ve a Documentos en el menú lateral y haz clic en "Nuevo documento". Selecciona la plantilla que necesitas (por ejemplo, una Constancia de Asistencia o el LR001), completa los campos solicitados y haz clic en "Generar". Los datos de tu institución se incluyen automáticamente. Una vez generado, puedes descargarlo en PDF desde el historial de documentos.',
      },
      {
        id: "plan-free",
        title: "¿Qué incluye el plan Free y cuándo necesito actualizar?",
        content:
          "El plan Free incluye acceso a los libros reglamentarios LR001-LR009, 1 usuario y un límite de 10 documentos por mes. Si tu institución necesita generar certificados del Capítulo II, agregar más usuarios o superar el límite mensual de documentos, te recomendamos actualizar a un plan superior desde la sección Suscripción.",
      },
      {
        id: "verificar-institucion",
        title: "¿Cómo verifico el estado de mi institución?",
        content:
          'Ve a Configuración → Institución para ver y editar todos los datos registrados: nombre, código DANE, ubicación, resolución y datos de contacto. El estado "activo" significa que tu institución puede operar normalmente en la plataforma; "verificado" indica que el equipo de EduDynamis confirmó la validez de tus datos institucionales.',
      },
    ],
  },
  {
    id: "documentos",
    label: "Documentos",
    icon: FileText,
    articles: [
      {
        id: "estados-documento",
        title: "¿Qué significa cada estado de un documento?",
        content:
          '"Borrador" es un documento creado pero no descargado aún. "Generado" significa que ya descargaste el PDF al menos una vez. "Borrador IA" indica contenido sugerido por EduBot pendiente de tu revisión. "Cancelado" es un documento que invalidaste y ya no debe usarse oficialmente.',
      },
      {
        id: "editar-documento",
        title: "¿Puedo editar un documento después de generarlo?",
        content:
          "No directamente. Una vez generado el PDF, debes crear un nuevo documento con los datos corregidos y cancelar el anterior desde el historial. Esto mantiene la trazabilidad exigida en la normativa de gestión documental ETDH.",
      },
      {
        id: "descargar-documento",
        title: "¿Cómo descargo un documento ya generado?",
        content:
          'Ve a Documentos en el menú lateral, busca el documento en el historial usando el buscador o los filtros por estado, y haz clic en el botón "PDF" junto al documento. Se descargará automáticamente a tu computador.',
      },
    ],
  },
  {
    id: "matriculas",
    label: "Matrículas y estudiantes",
    icon: GraduationCap,
    articles: [
      {
        id: "flujo-matriculas",
        title: "¿Cómo registro programas, estudiantes y matrículas?",
        content:
          "El orden recomendado es: 1) Crea el programa en la sección Programas con su resolución, horas y tipo de certificado. 2) Registra el estudiante en Estudiantes con sus datos personales. 3) Ve a Matrículas y vincula al estudiante con el programa. Esto genera automáticamente el LR002 con los datos correspondientes.",
      },
      {
        id: "importar-excel",
        title: "¿Cómo importo estudiantes masivamente desde Excel?",
        content:
          'En la sección Estudiantes, descarga la "Plantilla xlsx" de EasyDocs, complétala con los datos de tus estudiantes (incluyendo el nombre exacto del programa) y súbela con el botón "Importar xlsx". El sistema creará automáticamente los estudiantes y sus matrículas correspondientes.',
      },
      {
        id: "programa-no-existe",
        title: "¿Qué pasa si el programa no existe al importar estudiantes?",
        content:
          "Si incluyes los datos completos del programa en la plantilla (nombre, tipo de certificado, horas, resolución), EasyDocs lo creará automáticamente. Si solo escribes el nombre sin más datos y el programa no existe, esa fila se omitirá y aparecerá en el reporte de errores.",
      },
      {
        id: "lr002-automatico",
        title: "¿Cómo genero el LR002 automáticamente desde una matrícula?",
        content:
          'En la sección Matrículas, busca la matrícula del estudiante y haz clic en el botón "LR002". Se abrirá un formulario con los datos ya autocompletados desde la matrícula y el estudiante. Puedes editar cualquier campo antes de descargar el PDF final.',
      },
    ],
  },
  {
    id: "equipo",
    label: "Usuarios y equipo",
    icon: Users,
    articles: [
      {
        id: "agregar-usuarios",
        title: "¿Cómo agrego docentes o personal de secretaría?",
        content:
          'Ve a Usuarios en el menú lateral y haz clic en "Nuevo usuario". Completa el nombre, correo y contraseña, y selecciona el rol correspondiente (Docente o Secretaría). El nuevo usuario podrá iniciar sesión inmediatamente con esas credenciales.',
      },
      {
        id: "roles-permisos",
        title: "¿Qué puede hacer cada rol?",
        content:
          "El Representante tiene acceso completo a su institución, incluyendo usuarios, suscripción y configuración. Docentes y Secretaría pueden generar y consultar documentos, pero no gestionan usuarios ni la suscripción institucional.",
      },
    ],
  },
  {
    id: "plantillas",
    label: "Plantillas reglamentarias",
    icon: BookOpen,
    articles: [
      {
        id: "libros-reglamentarios",
        title: "¿Qué son los libros reglamentarios LR001 a LR009?",
        content:
          "Son los registros obligatorios definidos por la Secretaría de Educación para instituciones ETDH: desde el Proyecto Educativo Institucional (LR001) hasta los registros especiales de duplicados (LR009). Cada uno documenta un aspecto distinto de la gestión académica y administrativa de tu institución.",
      },
      {
        id: "certificado-vs-constancia",
        title: "¿Cuál es la diferencia entre un certificado y una constancia?",
        content:
          "El certificado de aptitud ocupacional se expide al completar un programa técnico laboral, con validez para efectos laborales. La constancia de asistencia se expide para cursos de educación informal de menos de 160 horas y no otorga aptitud ocupacional.",
      },
      {
        id: "logo-institucional",
        title: "¿Cómo personalizo el logo institucional en mis documentos?",
        content:
          'Ve a Configuración → Institución y haz clic en "Subir logo". Una vez cargado, el logo aparecerá automáticamente en el encabezado de todos los documentos PDF que generes a partir de ese momento.',
      },
    ],
  },
  {
    id: "suscripcion",
    label: "Suscripción y pagos",
    icon: CreditCard,
    articles: [
      {
        id: "cambiar-plan",
        title: "¿Cómo cambio de plan?",
        content:
          'Ve a Suscripción en el menú lateral, revisa los planes disponibles y haz clic en "Solicitar upgrade" en el plan que desees. Para el plan Free, la activación es inmediata. Para planes de pago, sigue las instrucciones de transferencia que aparecen en pantalla.',
      },
      {
        id: "confirmar-pago",
        title: "¿Cómo se confirma un pago?",
        content:
          "Después de realizar la transferencia según las instrucciones, envía el comprobante al correo indicado. El equipo de EduDynamis confirmará tu pago y activará el plan en menos de 24 horas hábiles.",
      },
      {
        id: "plan-vencido",
        title: "¿Qué pasa si mi plan vence?",
        content:
          "Cuando tu plan vence, tu institución mantiene acceso de solo lectura a sus documentos, pero no podrás generar nuevos documentos hasta renovar la suscripción. Te recomendamos renovar antes de la fecha de vencimiento que aparece en Suscripción.",
      },
    ],
  },
  {
    id: "cuenta",
    label: "Cuenta y seguridad",
    icon: Shield,
    articles: [
      {
        id: "cambiar-contrasena",
        title: "¿Cómo cambio mi contraseña?",
        content:
          "Ve a Configuración → Mi cuenta y completa el formulario de cambio de contraseña. Debes ingresar tu contraseña actual y la nueva, que debe cumplir con los requisitos de seguridad mostrados en pantalla.",
      },
      {
        id: "sesion-automatica",
        title: "¿Por qué se cierra mi sesión automáticamente?",
        content:
          "Por seguridad, EasyDocs cierra tu sesión después de 30 minutos de inactividad. Recibirás una advertencia 2 minutos antes con la opción de continuar tu sesión activa.",
      },
    ],
  },
];

const TAB_BAR = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "chat", label: "Mensajes", icon: MessageCircle },
  { id: "contact", label: "Contacto", icon: Phone },
];

export default function EduBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeArticle, setActiveArticle] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState({});

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (open && activeTab === "chat" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, activeTab]);

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `¡Hola${user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}! Soy **EduBot**, tu asistente normativo ETDH.\n\n¿En qué puedo orientarte hoy?`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSend = async (text) => {
    const message = text || input.trim();
    if (!message || loading) return;

    const userMsg = { role: "user", content: message, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await api.post("/edubot/chat", { message, history });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.reply,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setError("No se pudo conectar con EduBot. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "¡Nueva consulta iniciada! ¿En qué puedo orientarte sobre normativa ETDH?",
        timestamp: new Date(),
      },
    ]);
    setError("");
  };

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  };

  const handleFeedback = (articleId, helpful) => {
    setFeedbackGiven((prev) => ({ ...prev, [articleId]: helpful }));
  };

  const goHome = () => {
    setActiveCategory(null);
    setActiveArticle(null);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors z-50 text-white"
        style={{ backgroundColor: "var(--color-sidebar)" }}
        title="Abrir EduBot"
      >
        <MessageSquare size={22} />
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 w-96 rounded-2xl shadow-2xl border flex flex-col z-50"
          style={{
            height: "560px",
            maxHeight: "80vh",
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between flex-shrink-0"
            style={{ backgroundColor: "var(--color-sidebar)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">EduBot</p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Centro de ayuda EasyDocs
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 text-white/70 hover:text-white rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Contenido según tab */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* TAB: INICIO */}
            {activeTab === "home" && (
              <div
                className="flex-1 overflow-y-auto"
                style={{ backgroundColor: "var(--bg-primary)" }}
              >
                {!activeCategory && (
                  <div className="p-4">
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      ¡Hola
                      {user?.full_name
                        ? `, ${user.full_name.split(" ")[0]}`
                        : ""}
                      !
                    </p>
                    <p
                      className="text-xs mb-4"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Explora artículos rápidos organizados por tema.
                    </p>

                    <div className="space-y-2">
                      {ARTICLE_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat)}
                            className="w-full flex items-center justify-between p-3 rounded-xl border transition-colors hover:shadow-sm"
                            style={{
                              backgroundColor: "var(--bg-secondary)",
                              borderColor: "var(--border-color)",
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: "var(--color-primary-light)",
                                }}
                              >
                                <Icon
                                  size={15}
                                  style={{ color: "var(--color-icon)" }}
                                />
                              </div>
                              <div className="text-left">
                                <p
                                  className="text-xs font-semibold"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {cat.label}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {cat.articles.length} artículos
                                </p>
                              </div>
                            </div>
                            <ChevronRight
                              size={14}
                              style={{ color: "var(--text-secondary)" }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeCategory && !activeArticle && (
                  <div className="p-4">
                    <button
                      onClick={goHome}
                      className="flex items-center gap-1.5 text-xs font-medium mb-4"
                      style={{ color: "var(--color-primary)" }}
                    >
                      <ChevronLeft size={14} /> Volver
                    </button>
                    <p
                      className="text-sm font-semibold mb-3"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {activeCategory.label}
                    </p>
                    <div className="space-y-2">
                      {activeCategory.articles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => setActiveArticle(article)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors hover:shadow-sm"
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            borderColor: "var(--border-color)",
                          }}
                        >
                          <p
                            className="text-xs font-medium pr-2"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {article.title}
                          </p>
                          <ChevronRight
                            size={14}
                            className="flex-shrink-0"
                            style={{ color: "var(--text-secondary)" }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeArticle && (
                  <div className="p-4">
                    <button
                      onClick={() => setActiveArticle(null)}
                      className="flex items-center gap-1.5 text-xs font-medium mb-4"
                      style={{ color: "var(--color-primary)" }}
                    >
                      <ChevronLeft size={14} /> Volver
                    </button>
                    <div
                      className="rounded-xl border p-4"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      <p
                        className="text-sm font-bold mb-3"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {activeArticle.title}
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {activeArticle.content}
                      </p>
                    </div>

                    <div className="mt-4 text-center">
                      {feedbackGiven[activeArticle.id] === undefined ? (
                        <>
                          <p
                            className="text-xs mb-2"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            ¿Te sirvió esta información?
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() =>
                                handleFeedback(activeArticle.id, true)
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                              style={{
                                borderColor: "var(--border-color)",
                                color: "var(--text-primary)",
                              }}
                            >
                              <ThumbsUp size={12} /> Sí
                            </button>
                            <button
                              onClick={() =>
                                handleFeedback(activeArticle.id, false)
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                              style={{
                                borderColor: "var(--border-color)",
                                color: "var(--text-primary)",
                              }}
                            >
                              <ThumbsDown size={12} /> No
                            </button>
                          </div>
                        </>
                      ) : (
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {feedbackGiven[activeArticle.id]
                            ? "¡Gracias por tu feedback!"
                            : "Gracias por avisarnos. Prueba preguntarle a EduBot en Mensajes."}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: MENSAJES (chat) */}
            {activeTab === "chat" && (
              <>
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                >
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: "var(--color-sidebar)" }}
                        >
                          <Bot size={13} className="text-white" />
                        </div>
                      )}
                      <div
                        className="max-w-xs rounded-2xl px-3 py-2 text-sm"
                        style={{
                          backgroundColor:
                            msg.role === "user"
                              ? "var(--color-primary)"
                              : "var(--bg-secondary)",
                          color:
                            msg.role === "user"
                              ? "#ffffff"
                              : "var(--text-primary)",
                          border:
                            msg.role === "assistant"
                              ? "1px solid var(--border-color)"
                              : "none",
                        }}
                      >
                        <p
                          dangerouslySetInnerHTML={{
                            __html: formatMessage(msg.content),
                          }}
                          className="leading-relaxed"
                        />
                        <p className="text-xs mt-1" style={{ opacity: 0.7 }}>
                          {msg.timestamp?.toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {msg.role === "user" && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: "var(--color-primary)" }}
                        >
                          <User size={13} className="text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-2 justify-start">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "var(--color-sidebar)" }}
                      >
                        <Bot size={13} className="text-white" />
                      </div>
                      <div
                        className="rounded-2xl px-4 py-3 border"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          borderColor: "var(--border-color)",
                        }}
                      >
                        <div
                          className="flex items-center gap-2"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <Loader2 size={14} className="animate-spin" />
                          <span className="text-xs">
                            EduBot está escribiendo...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {messages.length <= 1 && (
                  <div
                    className="px-4 py-2 border-t flex-shrink-0"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-secondary)",
                    }}
                  >
                    <p
                      className="text-xs mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Preguntas frecuentes:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(q)}
                          className="text-xs px-2 py-1 rounded-lg transition-colors text-left"
                          style={{
                            backgroundColor: "var(--color-primary-light)",
                            color: "var(--color-primary)",
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className="p-3 border-t flex-shrink-0"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                >
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Pregunta sobre normativa ETDH..."
                      rows={1}
                      className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
                      style={{
                        minHeight: "40px",
                        maxHeight: "80px",
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-primary)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || loading}
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 text-white disabled:opacity-40"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)", opacity: 0.7 }}
                    >
                      EduBot orienta pero no reemplaza la ley
                    </p>
                    <button
                      onClick={handleNewChat}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "var(--color-primary)" }}
                    >
                      <Plus size={11} /> Nueva consulta
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* TAB: CONTACTO */}
            {activeTab === "contact" && (
              <div
                className="flex-1 overflow-y-auto p-4"
                style={{ backgroundColor: "var(--bg-primary)" }}
              >
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  ¿Necesitas más ayuda?
                </p>
                <p
                  className="text-xs mb-5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Nuestro equipo de soporte está disponible para resolver tus
                  dudas directamente.
                </p>

                <a
                  href="https://wa.me/573223424648"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl mb-3 transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#22c55e" }}
                >
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      Escríbenos por WhatsApp
                    </p>
                    <p className="text-xs text-white/80">
                      Respuesta en minutos, horario laboral
                    </p>
                  </div>
                  <ExternalLink
                    size={14}
                    className="text-white/80 flex-shrink-0"
                  />
                </a>

                <a
                  href="mailto:soporte@edudynamis.com"
                  className="flex items-center gap-3 p-4 rounded-xl border mb-3 transition-colors hover:shadow-sm"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--color-primary-light)" }}
                  >
                    <Mail size={18} style={{ color: "var(--color-icon)" }} />
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      edudynamis1@gmail.com
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Respuesta en 24 horas hábiles
                    </p>
                  </div>
                </a>

                <div
                  className="rounded-xl border p-4 flex items-start gap-3"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <Clock
                    size={16}
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <div>
                    <p
                      className="text-xs font-semibold mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Horario de atención
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Lunes a viernes, 8:00 a.m. — 5:00 p.m.
                      <br />
                      Hora Colombia (COT)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tab bar inferior */}
          <div
            className="flex border-t flex-shrink-0"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-secondary)",
            }}
          >
            {TAB_BAR.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  if (id === "home") goHome();
                }}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors"
                style={{
                  color:
                    activeTab === id
                      ? "var(--color-primary)"
                      : "var(--text-secondary)",
                }}
              >
                <Icon size={18} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

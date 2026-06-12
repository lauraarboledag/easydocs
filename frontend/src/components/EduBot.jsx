import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { MessageSquare, X, Send, Bot, User, Loader2, Plus } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "¿Qué es el LR001 y cómo se diligencia?",
  "¿Qué firmas requiere el libro de matrículas?",
  "¿Cuánto tiempo debo conservar los libros reglamentarios?",
  "¿Cuál es la diferencia entre LR003 y LR004?",
  "¿Cómo expido un duplicado de certificado?",
];

export default function EduBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
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
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `¡Hola${user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}! Soy **EduBot**, tu asistente normativo ETDH.\n\nPuedo ayudarte con preguntas sobre los libros reglamentarios (LR001–LR009), certificados, el Decreto 1075 de 2015 y la gestión documental de tu institución.\n\n¿En qué puedo orientarte hoy?`,
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
      const res = await api.post("/edubot/chat", {
        message,
        history,
      });
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

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#1a2b4a] hover:bg-[#2952cc] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
        title="Abrir EduBot"
      >
        <MessageSquare size={22} />
      </button>

      {/* Panel del chat */}
      {open && (
        <div
          className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden"
          style={{ height: "520px" }}
        >
          {/* Header */}
          <div className="bg-[#1a2b4a] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">EduBot</p>
                <p className="text-blue-300 text-xs">
                  Asistente Normativo ETDH
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewChat}
                className="p-1.5 text-blue-300 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
                title="Nueva consulta"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-blue-300 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 bg-[#1a2b4a] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={13} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-[#2952cc] text-white rounded-tr-sm"
                      : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
                  }`}
                >
                  <p
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(msg.content),
                    }}
                    className="leading-relaxed"
                  />
                  <p
                    className={`text-xs mt-1 ${msg.role === "user" ? "text-blue-200" : "text-gray-400"}`}
                  >
                    {msg.timestamp?.toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 bg-[#2952cc] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={13} className="text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 bg-[#1a2b4a] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={13} className="text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs">EduBot está escribiendo...</span>
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

          {/* Sugerencias */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-white flex-shrink-0">
              <p className="text-xs text-gray-400 mb-2">
                Preguntas frecuentes:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded-lg transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregunta sobre normativa ETDH..."
                rows={1}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2952cc] resize-none"
                style={{ minHeight: "40px", maxHeight: "80px" }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-[#2952cc] hover:bg-[#1e3fa8] disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-300 text-center mt-1.5">
              EduBot orienta pero no reemplaza la responsabilidad legal
            </p>
          </div>
        </div>
      )}
    </>
  );
}

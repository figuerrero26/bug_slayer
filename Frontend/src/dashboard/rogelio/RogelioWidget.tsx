import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRogelio } from "../../hooks/useRogelio";
import "./rogelio.css";

interface Props {
  userId: number | null;
}

export default function RogelioWidget({ userId }: Props) {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const bottomRef             = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLTextAreaElement>(null);

  const { messages, isTyping, sendMessage, resetChat } = useRogelio(userId);

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Foco en el input al abrir
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleNewChat = () => {
    resetChat();
  };

  return (
    <>
      {/* ── Panel del chat ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="rogelio-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.92, y: 20  }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="rogelio-header">
              <div className="rogelio-avatar-sm">R</div>
              <div className="rogelio-header-info">
                <span className="rogelio-name">Rogelio</span>
                <span className="rogelio-status">Asistente CONIITI 2026</span>
              </div>
              <div className="rogelio-header-actions">
                <button
                  className="rogelio-icon-btn"
                  onClick={handleNewChat}
                  title="Nueva conversación"
                  aria-label="Nueva conversación"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
                <button
                  className="rogelio-icon-btn"
                  onClick={handleClose}
                  title="Cerrar"
                  aria-label="Cerrar chat"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div className="rogelio-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`rogelio-msg rogelio-msg--${msg.role}`}>
                  {msg.role === "assistant" && (
                    <div className="rogelio-msg-avatar">R</div>
                  )}
                  <div className="rogelio-msg-bubble">
                    <RenderContent content={msg.content} />
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="rogelio-msg rogelio-msg--assistant">
                  <div className="rogelio-msg-avatar">R</div>
                  <div className="rogelio-msg-bubble rogelio-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="rogelio-input-area">
              <textarea
                ref={inputRef}
                className="rogelio-input"
                placeholder="Escribe tu pregunta…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                disabled={isTyping}
                aria-label="Mensaje para Rogelio"
              />
              <button
                className="rogelio-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                aria-label="Enviar mensaje"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Burbuja flotante (FAB) ── */}
      <motion.button
        className={`rogelio-fab ${open ? "rogelio-fab--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? "Cerrar asistente Rogelio" : "Abrir asistente Rogelio"}
        title="Rogelio — Asistente CONIITI"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0,   opacity: 1 }}
              exit={{    rotate:  90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </motion.span>
          ) : (
            <motion.span
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0,  opacity: 1 }}
              exit={{    rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="rogelio-fab-content"
            >
              <span className="rogelio-fab-letter">R</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}

// Renderiza negritas básicas (**texto**) sin librerías adicionales
function RenderContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

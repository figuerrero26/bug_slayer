import React, { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRogelio } from "../../hooks/useRogelio";
import "./rogelio.css";

interface Props {
  userId: number | null;
}

const SUGGESTIONS = [
  "¿Cuándo es CONIITI 2026?",
  "¿Cómo me inscribo a una conferencia?",
  "¿Dónde es el evento?",
  "¿Qué conferencias hay disponibles?",
];

const MAX_CHARS = 2000;

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export default function RogelioWidget({ userId }: Props) {
  const [open, setOpen]               = useState(false);
  const [input, setInput]             = useState("");
  const [hasUnread, setHasUnread]     = useState(false);
  const bottomRef                     = useRef<HTMLDivElement>(null);
  const inputRef                      = useRef<HTMLTextAreaElement>(null);
  const prevCountRef                  = useRef(1);

  const { messages, isTyping, sendMessage, resetChat } = useRogelio(userId);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Unread badge cuando el chat está cerrado y llega respuesta nueva
  useEffect(() => {
    if (!open && messages.length > prevCountRef.current) {
      const last = messages[messages.length - 1];
      if (last.role === "assistant" && last.id !== "welcome") setHasUnread(true);
    }
    prevCountRef.current = messages.length;
  }, [messages, open]);

  // Limpiar badge y enfocar input al abrir
  useEffect(() => {
    if (open) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Auto-resize del textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  }, [input]);

  const handleSend = useCallback((text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isTyping) return;
    sendMessage(msg);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  }, [input, isTyping, sendMessage]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isWelcomeOnly = messages.length === 1 && messages[0].id === "welcome";
  const charWarn = input.length > MAX_CHARS * 0.85;

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
                <span className="rogelio-status">
                  <span className="rogelio-online-dot" />
                  Asistente CONIITI 2026
                </span>
              </div>
              <div className="rogelio-header-actions">
                <button
                  className="rogelio-icon-btn"
                  onClick={resetChat}
                  title="Nueva conversación"
                  aria-label="Nueva conversación"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
                <button
                  className="rogelio-icon-btn"
                  onClick={() => setOpen(false)}
                  title="Cerrar"
                  aria-label="Cerrar chat"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div className="rogelio-messages">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`rogelio-msg rogelio-msg--${msg.role}`}
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0,  scale: 1 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {msg.role === "assistant" && (
                      <div className="rogelio-msg-avatar">R</div>
                    )}
                    <div className="rogelio-msg-bubble">
                      <RenderContent content={msg.content} />
                      <span className="rogelio-msg-time">{formatTime(msg.createdAt)}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Chips de sugerencia — solo estado bienvenida */}
              {isWelcomeOnly && !isTyping && (
                <motion.div
                  className="rogelio-suggestions"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      className="rogelio-chip"
                      onClick={() => handleSend(s)}
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Indicador de escritura */}
              {isTyping && (
                <motion.div
                  className="rogelio-msg rogelio-msg--assistant"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="rogelio-msg-avatar">R</div>
                  <div className="rogelio-msg-bubble rogelio-typing">
                    <span /><span /><span />
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="rogelio-input-area">
              <div className="rogelio-input-wrapper">
                <textarea
                  ref={inputRef}
                  className="rogelio-input"
                  placeholder="Escribe tu pregunta…"
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={handleKey}
                  rows={1}
                  disabled={isTyping}
                  aria-label="Mensaje para Rogelio"
                />
                {input.length > 80 && (
                  <span className={`rogelio-char-count ${charWarn ? "rogelio-char-count--warn" : ""}`}>
                    {input.length}/{MAX_CHARS}
                  </span>
                )}
              </div>
              <button
                className="rogelio-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                aria-label="Enviar mensaje"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB flotante ── */}
      <motion.button
        className={`rogelio-fab ${open ? "rogelio-fab--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? "Cerrar asistente Rogelio" : "Abrir asistente Rogelio"}
        title="Rogelio — Asistente CONIITI"
      >
        {hasUnread && !open && <span className="rogelio-unread-dot" aria-label="Mensaje nuevo" />}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0,   opacity: 1 }}
              exit={{    rotate:  90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

// ── Renderizador de Markdown ligero ───────────────────────────────────────────

function RenderContent({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/);

  return (
    <div className="rogelio-content">
      {blocks.filter(Boolean).map((block, bi) => {
        const lines = block.split("\n").filter(Boolean);
        const listCount = lines.filter((l) => /^\s*[-*•]\s/.test(l)).length;

        if (listCount > 0 && listCount >= Math.ceil(lines.length * 0.5)) {
          return (
            <ul key={bi} className="rogelio-list">
              {lines.map((line, li) => {
                const m = line.trimStart().match(/^[-*•]\s+(.*)/);
                return m ? (
                  <li key={li}><InlineMd text={m[1]} /></li>
                ) : line.trim() ? (
                  <li key={li}><InlineMd text={line} /></li>
                ) : null;
              })}
            </ul>
          );
        }

        return (
          <p key={bi} className="rogelio-para">
            {lines.map((line, li) => (
              <React.Fragment key={li}>
                <InlineMd text={line} />
                {li < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function InlineMd({ text }: { text: string }) {
  const tokens = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g);
  return (
    <>
      {tokens.map((t, i) => {
        if (/^\*\*.*\*\*$/.test(t)) return <strong key={i}>{t.slice(2, -2)}</strong>;
        if (/^\*.*\*$/.test(t))    return <em key={i}>{t.slice(1, -1)}</em>;
        return <React.Fragment key={i}>{t}</React.Fragment>;
      })}
    </>
  );
}

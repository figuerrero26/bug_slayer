import { useState, useCallback, useRef } from "react";
import { ASSISTANT_URL } from "../services/api";
import type { ChatMessage, AskResponse } from "../interfaces/chat";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "¡Hola! Soy **Rogelio**, tu asistente de CONIITI 2026. " +
    "Puedo ayudarte con conferencias, inscripciones, horarios y más. ¿En qué te puedo ayudar?",
  createdAt: new Date(),
};

export function useRogelio(userId: number | null) {
  const [messages, setMessages]         = useState<ChatMessage[]>([WELCOME]);
  const [isTyping, setIsTyping]         = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text.trim(),
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetch(`${ASSISTANT_URL}/assistant/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId ?? 0,
            conversation_id: conversationId,
            message: text.trim(),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error("Error del servidor");

        const data: AskResponse = await res.json();

        if (!conversationId) setConversationId(data.conversation_id);

        const botMsg: ChatMessage = {
          id: `a-${data.message_id}`,
          role: "assistant",
          content: data.reply,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        const errMsg: ChatMessage = {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: "Lo siento, tuve un problema al responder. Intenta de nuevo en un momento.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [userId, conversationId],
  );

  const resetChat = useCallback(() => {
    setMessages([WELCOME]);
    setConversationId(null);
    setIsTyping(false);
  }, []);

  return { messages, isTyping, sendMessage, resetChat };
}

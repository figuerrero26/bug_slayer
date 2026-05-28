export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface AskResponse {
  conversation_id: number;
  reply: string;
  message_id: number;
}

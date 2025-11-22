/**
 * Shared types for Redux store
 */

export interface ToolUse {
  name: string
  input: any
  id: string
}

export interface Message {
  content: string
  role: "user" | "assistant"
  toolUses?: ToolUse[]
  interrupted?: boolean // Flag for messages interrupted by page refresh
}

export interface MessagesState {
  messages: Message[]
}

export interface ChatUIState {
  input: string
  isStreaming: boolean
  toolActivity: string
}

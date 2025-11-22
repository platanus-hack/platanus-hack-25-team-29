/**
 * Shared types for Redux store
 */

export type ToolStatus = "pending" | "executing" | "completed" | "error"

export interface ToolUse {
  name: string
  input: any
  id: string
  status?: ToolStatus
  timestamp?: number
  duration?: number
  summary?: string
  result?: any
  error?: string
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

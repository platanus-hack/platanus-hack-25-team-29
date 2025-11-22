import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Message, MessagesState, ToolUse } from '../types'

const initialState: MessagesState = {
  messages: [],
}

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // Add a new message to the chat
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload)
    },

    // Update the last message's content (used during streaming)
    updateLastMessageContent: (state, action: PayloadAction<string>) => {
      if (state.messages.length > 0) {
        const lastMessage = state.messages[state.messages.length - 1]
        lastMessage.content = action.payload
      }
    },

    // Add tool uses to the last message
    addToolUsesToLastMessage: (state, action: PayloadAction<ToolUse[]>) => {
      if (state.messages.length > 0) {
        const lastMessage = state.messages[state.messages.length - 1]
        lastMessage.toolUses = action.payload
      }
    },

    // Update last message with both content and tool uses
    updateLastMessage: (state, action: PayloadAction<{ content: string; toolUses: ToolUse[] }>) => {
      if (state.messages.length > 0) {
        const lastMessage = state.messages[state.messages.length - 1]
        lastMessage.content = action.payload.content
        lastMessage.toolUses = action.payload.toolUses
      }
    },

    // Mark the last assistant message as interrupted (used when page refreshes during streaming)
    markLastMessageAsInterrupted: (state) => {
      // Find the last assistant message and mark it as interrupted
      for (let i = state.messages.length - 1; i >= 0; i--) {
        if (state.messages[i].role === 'assistant') {
          state.messages[i].interrupted = true
          break
        }
      }
    },

    // Clear all messages
    clearAllMessages: (state) => {
      state.messages = []
    },

    // Set messages (useful for bulk operations or migrations)
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload
    },
  },
})

export const {
  addMessage,
  updateLastMessageContent,
  addToolUsesToLastMessage,
  updateLastMessage,
  markLastMessageAsInterrupted,
  clearAllMessages,
  setMessages,
} = messagesSlice.actions

export default messagesSlice.reducer

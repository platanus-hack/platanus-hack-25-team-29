/**
 * Export all slices and their actions
 */

export { default as messagesReducer } from './messagesSlice'
export {
  addMessage,
  updateLastMessageContent,
  addToolUsesToLastMessage,
  updateLastMessage,
  markLastMessageAsInterrupted,
  clearAllMessages,
  setMessages,
} from './messagesSlice'

export { default as chatUIReducer } from './chatUISlice'
export {
  setInput,
  clearInput,
  setIsStreaming,
  setToolActivity,
  clearToolActivity,
  resetChatUI,
} from './chatUISlice'

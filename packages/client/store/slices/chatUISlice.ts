import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { ChatUIState } from '../types'

const initialState: ChatUIState = {
  input: '',
  isStreaming: false,
  toolActivity: '',
}

const chatUISlice = createSlice({
  name: 'chatUI',
  initialState,
  reducers: {
    // Set the input text
    setInput: (state, action: PayloadAction<string>) => {
      state.input = action.payload
    },

    // Clear the input text
    clearInput: (state) => {
      state.input = ''
    },

    // Set streaming status
    setIsStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload
    },

    // Set tool activity message
    setToolActivity: (state, action: PayloadAction<string>) => {
      state.toolActivity = action.payload
    },

    // Clear tool activity message
    clearToolActivity: (state) => {
      state.toolActivity = ''
    },

    // Reset all UI state to initial values
    resetChatUI: (state) => {
      state.input = ''
      state.isStreaming = false
      state.toolActivity = ''
    },
  },
})

export const {
  setInput,
  clearInput,
  setIsStreaming,
  setToolActivity,
  clearToolActivity,
  resetChatUI,
} = chatUISlice.actions

export default chatUISlice.reducer

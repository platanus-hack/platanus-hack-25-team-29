"use client"
import { useRef, useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  addMessage,
  updateLastMessage,
  markLastMessageAsInterrupted,
  clearAllMessages,
  setInput,
  clearInput,
  setIsStreaming,
  setToolActivity,
  clearToolActivity,
  resetChatUI,
} from "@/store"
import type { Message, ToolUse } from "@/store/types"

export function ChatView() {
  // Redux state selectors
  const dispatch = useAppDispatch()
  const messages = useAppSelector((state) => state.messages.messages)
  const input = useAppSelector((state) => state.chatUI.input)
  const isStreaming = useAppSelector((state) => state.chatUI.isStreaming)
  const toolActivity = useAppSelector((state) => state.chatUI.toolActivity)

  // Local UI state (not persisted)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Handle streaming interruption detection on mount
  useEffect(() => {
    // If isStreaming was true when the page was refreshed, mark the last message as interrupted
    if (isStreaming) {
      dispatch(markLastMessageAsInterrupted())
      dispatch(setIsStreaming(false))
      dispatch(clearToolActivity())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - dispatch is stable, isStreaming value checked from persisted state

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const handleClearChat = () => {
    if (showClearConfirm) {
      // User confirmed, clear everything
      dispatch(clearAllMessages())
      dispatch(resetChatUI())
      setShowClearConfirm(false)
    } else {
      // First click, show confirmation
      setShowClearConfirm(true)
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowClearConfirm(false), 3000)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage: Message = { role: 'user', content: input }
    dispatch(addMessage(userMessage))
    const currentInput = input // Store input before clearing
    dispatch(clearInput())
    dispatch(setIsStreaming(true))
    dispatch(clearToolActivity())

    // Local state tracking for streaming (don't rely on Redux state during streaming)
    let currentAssistantMessage = ''
    let currentToolUses: ToolUse[] = []
    let assistantMessageCreated = false // Track if we've created the assistant message

    try {
      const response = await fetch("http://localhost:8000/api/agent", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentInput,
          systemPrompt: 'You are a helpful AI assistant with access to tools.',
          maxTurns: 10
        })
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while(true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === "text") {
                currentAssistantMessage += parsed.content

                // Use local tracking instead of checking Redux state
                if (assistantMessageCreated) {
                  // Update existing assistant message (pass a copy of the array)
                  dispatch(updateLastMessage({
                    content: currentAssistantMessage,
                    toolUses: [...currentToolUses], // Copy array to avoid freezing issues
                  }))
                } else {
                  // Create new assistant message (first time only)
                  dispatch(addMessage({
                    role: 'assistant',
                    content: currentAssistantMessage,
                    toolUses: [...currentToolUses], // Copy array to avoid freezing issues
                  }))
                  assistantMessageCreated = true
                }
              } else if (parsed.type === "tool_use") {
                const toolUse: ToolUse = {
                  name: parsed.name,
                  input: parsed.input,
                  id: parsed.id || `tool-${Date.now()}`,
                };
                currentToolUses.push(toolUse);

                // Update the message with the new tool use
                if (assistantMessageCreated) {
                  dispatch(updateLastMessage({
                    content: currentAssistantMessage,
                    toolUses: [...currentToolUses], // Copy array
                  }))
                }

                dispatch(setToolActivity(`🔧 Using tool: ${parsed.name}`))
              } else if (parsed.type === "tool_result") {
                dispatch(setToolActivity('✅ Tool completed'))
                setTimeout(() => dispatch(clearToolActivity()), 2000);
              } else if (parsed.type === "done") {
                dispatch(clearToolActivity())
              } else if (parsed.type === "error") {
                console.error("Agent error: ", parsed.error)
                dispatch(setToolActivity(`❌ Error: ${parsed.error}`))
              }
            } catch (e) {
              console.error("Parse error: ", e)
            }
          }
        }

      }
    } catch (e) {
      console.error("Fetch error: ", e)
      dispatch(addMessage({
        role: 'assistant',
        content: 'Sorry, an error occurred while processing your request.',
      }))

    } finally {
      dispatch(setIsStreaming(false))
      dispatch(clearToolActivity())
    }
  }

  return (
    <div className="flex flex-col h-screen w-full mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-[80%]'
                : 'bg-gray-100 mr-auto max-w-[80%]'
            }`}
          >
            <div className="font-semibold mb-1">
              {msg.role === 'user' ? 'You' : '🤖 Agent'}
              {msg.interrupted && (
                <span className="ml-2 text-xs text-orange-600 font-normal">
                  ⚠️ Interrupted
                </span>
              )}
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>

            {msg.toolUses && msg.toolUses.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-300">
                <div className="text-sm text-gray-600">Tools used:</div>
                {msg.toolUses.map((tool, i) => (
                  <div key={i} className="text-xs bg-gray-200 p-2 mt-1 rounded">
                    <span className="font-mono">{tool.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {toolActivity && (
        <div className="mb-2 text-sm text-gray-600 animate-pulse">
          {toolActivity}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => dispatch(setInput(e.target.value))}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask the agent something..."
          className="flex-1 p-3 border rounded-lg"
          disabled={isStreaming}
        />
        <button
          onClick={sendMessage}
          disabled={isStreaming}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600"
        >
          {isStreaming ? '⏳' : 'Send'}
        </button>
        <button
          onClick={handleClearChat}
          disabled={isStreaming}
          className={`px-6 py-3 rounded-lg disabled:opacity-50 transition-colors ${
            showClearConfirm
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
          }`}
          title={showClearConfirm ? 'Click again to confirm' : 'Clear chat'}
        >
          {showClearConfirm ? '⚠️ Confirm?' : '🗑️'}
        </button>
      </div>
    </div>
  )
}

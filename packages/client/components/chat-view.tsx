"use client"

import React, { useRef, useEffect, useState } from "react"
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

// UI Libraries
import { AnimatePresence, motion } from "framer-motion"
import {
  Send,
  Trash2,
  Bot,
  User,
  StopCircle,
  Sparkles
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// Enhanced tool components
import { EnhancedToolCard } from "./enhanced-tool-card"
import { InlineToolStatus } from "./inline-tool-status"

// API Configuration
// NEXT_PUBLIC_AGENT_API_URL: Dedicated agent streaming server URL
// Falls back to NEXT_PUBLIC_API_URL for backward compatibility
// Falls back to main server URL if neither is set
const AGENT_API_URL = 'https://agent.kenobi.dev'

// --- 1. Smooth Cursor ---
const SmoothCursor = () => (
  <motion.span
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ repeat: Infinity, duration: 0.5, repeatType: "reverse" }}
    className="inline-block w-[3px] h-5 bg-teal-500 ml-1 align-bottom rounded-full"
  />
)

const ThinkingBubble = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="flex w-full justify-start mb-6"
  >
    <div className="flex gap-3 max-w-[90%] md:max-w-[85%]">
      <div className="shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
         <Sparkles size={16} className="text-teal-500" />
      </div>
      <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3">
        <span className="flex gap-1.5">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.span 
              key={i}
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.1, 1] }} 
              transition={{ repeat: Infinity, duration: 1.2, delay }}
              className="w-1.5 h-1.5 bg-teal-500 rounded-full" 
            />
          ))}
        </span>
        <span className="text-xs text-gray-400 font-medium tracking-wide">Analizando solicitud</span>
      </div>
    </div>
  </motion.div>
)

// --- 3. Message Component (Responsive Layout Logic) ---
const MessageBubble = ({
  msg,
  isLast,
  isStreaming
}: {
  msg: Message;
  isLast: boolean;
  isStreaming: boolean
}) => {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex flex-col w-full mb-6 ${isUser ? 'items-end' : 'items-start'}`}>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex w-full gap-3 ${isUser ? 'flex-row-reverse justify-start' : 'flex-row justify-start'}`}
      >
        {/* Avatar */}
        <div className="shrink-0 flex flex-col pt-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm border
            ${isUser
              ? 'bg-[#5CB1A9] border-[#4a9c94] text-white'
              : 'bg-white border-gray-200 text-teal-600'
            }`}>
            {isUser ? <User size={16} /> : <Bot size={18} />}
          </div>
        </div>

        {/* BUBBLE CONTENT */}
        <div className={`flex flex-col min-w-0 max-w-[95%] md:max-w-[85%] lg:max-w-[80%]
            ${isUser ? 'items-end' : 'items-start w-full'}`
        }>
          
          {/* Name & Status */}
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {isUser ? 'Tú' : 'Lucas'}
            </span>
            {msg.interrupted && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md uppercase font-bold">
                Interrumpido
              </span>
            )}
          </div>

          {/* 
             Agent Logic: 
             Render ToolChain above text. No debug prints.
          */}
          {!isUser && msg.toolUses && msg.toolUses.length > 0 && (
            <ToolChain tools={msg.toolUses} />
          )}

          {/* THE TEXT BUBBLE */}
          <div className={`relative px-4 py-3 md:px-6 md:py-4 text-sm md:text-base leading-relaxed shadow-sm
            ${isUser
              ? 'bg-[#e0f5f3] border border-[#bce3de] text-slate-800 rounded-2xl rounded-tr-sm'
              : 'bg-white border border-gray-200 text-slate-900 rounded-2xl rounded-tl-sm w-full overflow-hidden' 
            }`}>

            {/* Content */}
            {isUser ? (
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            ) : (
              <div className={`markdown-body w-full ${msg.content ? '' : 'min-h-[20px]'}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 className="text-xl font-bold mb-3 mt-4 text-slate-800">{children}</h1>,
                    h2: ({children}) => <h2 className="text-lg font-semibold mb-2 mt-4 text-slate-800">{children}</h2>,
                    p: ({children}) => <p className="mb-3 last:mb-0 text-slate-700 leading-7">{children}</p>,
                    a: ({href, children}) => <a href={href} className="text-teal-600 font-medium hover:underline break-all" target="_blank" rel="noreferrer">{children}</a>,
                    code: ({className, children}) => {
                      const isInline = !className;
                      return isInline
                        ? <code className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded text-xs md:text-sm font-mono border border-slate-200">{children}</code>
                        : <div className="w-full overflow-x-auto my-3 rounded-lg border border-slate-200 bg-slate-50">
                            <code className="block p-3 min-w-full font-mono text-xs md:text-sm text-slate-800 whitespace-pre">{children}</code>
                          </div>
                    },
                    ul: ({children}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-700">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-slate-700">{children}</ol>,
                    table: ({children}) => (
                      <div className="w-full overflow-x-auto my-4 rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">{children}</table>
                      </div>
                    ),
                    th: ({children}) => <th className="px-3 py-2 bg-gray-50 text-left font-semibold text-gray-600 whitespace-nowrap">{children}</th>,
                    td: ({children}) => <td className="px-3 py-2 border-t border-gray-50 text-gray-600 min-w-[100px]">{children}</td>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
                {isLast && isStreaming && <SmoothCursor />}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// --- 4. Main Chat View ---

export function ChatView() {
  const dispatch = useAppDispatch()
  const messages = useAppSelector((state) => state.messages.messages)
  const input = useAppSelector((state) => state.chatUI.input)
  const isStreaming = useAppSelector((state) => state.chatUI.isStreaming)
  
  const [hasReceivedFirstToken, setHasReceivedFirstToken] = useState(false)
  const [userScrolledUp, setUserScrolledUp] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  useEffect(() => {
    if (isStreaming) {
      dispatch(markLastMessageAsInterrupted())
      dispatch(setIsStreaming(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Scrolling Logic ---
  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" })
    setUserScrolledUp(false)
    setShowScrollButton(false)
  }, [])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    
    if (!isAtBottom) {
      setUserScrolledUp(true)
      setShowScrollButton(true)
    } else {
      setUserScrolledUp(false)
      setShowScrollButton(false)
    }
  }

  // Auto-scroll effects
  useEffect(() => {
    if (isStreaming && !userScrolledUp) {
      scrollToBottom('smooth')
    } else if (!isStreaming && !userScrolledUp) {
      scrollToBottom('smooth')
    }
  }, [messages.length, isStreaming, userScrolledUp, scrollToBottom])

  useEffect(() => {
     if (isStreaming && hasReceivedFirstToken && !userScrolledUp) {
         scrollToBottom('auto') 
     }
  }, [messages, isStreaming, hasReceivedFirstToken, userScrolledUp, scrollToBottom])


  const handleClearChat = () => {
    if (showClearConfirm) {
      dispatch(clearAllMessages())
      dispatch(resetChatUI())
      setShowClearConfirm(false)
    } else {
      setShowClearConfirm(true)
      setTimeout(() => setShowClearConfirm(false), 3000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage: Message = { role: 'user', content: input }
    dispatch(addMessage(userMessage))
    const currentInput = input
    dispatch(clearInput())
    dispatch(setIsStreaming(true))
    dispatch(clearToolActivity())
    setHasReceivedFirstToken(false)
    setUserScrolledUp(false)

    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setTimeout(() => scrollToBottom(), 100)

    let currentAssistantMessage = ''
    let currentToolUses: ToolUse[] = []
    let assistantMessageCreated = false

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 600000) 

    try {
      const response = await fetch(`${AGENT_API_URL}/api/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentInput,
          systemPrompt: 'You are a helpful AI assistant.',
          maxTurns: 10
        }),
        signal: controller.signal
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

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
              setHasReceivedFirstToken(true); 

              if (parsed.type === "text") {
                // Mark pending tools as completed if we start receiving text
                currentToolUses = currentToolUses.map(tool => {
                  if (tool.status === "executing") {
                    return { ...tool, status: "completed" as const, duration: tool.timestamp ? Date.now() - tool.timestamp : undefined }
                  }
                  return tool
                })
                currentAssistantMessage += parsed.content
                
                if (assistantMessageCreated) {
                  dispatch(updateLastMessage({ content: currentAssistantMessage, toolUses: [...currentToolUses] }))
                } else {
                  dispatch(addMessage({ role: 'assistant', content: currentAssistantMessage, toolUses: [...currentToolUses] }))
                  assistantMessageCreated = true
                }
              } else if (parsed.type === "tool_use") {
                const toolUse: ToolUse = {
                  name: parsed.name,
                  input: parsed.input,
                  id: parsed.id || `tool-${Date.now()}`,
                  status: "executing",
                  timestamp: Date.now()
                };
                currentToolUses.push(toolUse);
                
                if (!assistantMessageCreated) {
                    dispatch(addMessage({ role: 'assistant', content: '', toolUses: [...currentToolUses] }))
                    assistantMessageCreated = true
                } else {
                    dispatch(updateLastMessage({ content: currentAssistantMessage, toolUses: [...currentToolUses] }))
                }
              } else if (parsed.type === "tool_complete") {
                const toolIndex = currentToolUses.findIndex(t => t.id === parsed.id)
                if (toolIndex !== -1) {
                  currentToolUses[toolIndex] = { 
                    ...currentToolUses[toolIndex], 
                    status: "completed", 
                    duration: currentToolUses[toolIndex].timestamp ? Date.now() - currentToolUses[toolIndex].timestamp! : undefined 
                  }
                  dispatch(updateLastMessage({ content: currentAssistantMessage, toolUses: [...currentToolUses] }))
                }
              }
            } catch (e) { console.error(e) }
          }
        }
      }
    } catch (e) {
       dispatch(addMessage({ role: 'assistant', content: 'Lo siento, hubo un error de conexión.' }))
    } finally {
      clearTimeout(timeoutId)
      dispatch(setIsStreaming(false))
      setHasReceivedFirstToken(false)
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-50 font-sans text-slate-900 relative">
      
      {/* Header */}
      <div className="flex items-center justify-center py-4 bg-slate-50/90 backdrop-blur-sm z-10 sticky top-0 border-b border-slate-200/50">
        <h2 className="text-lg font-bold text-slate-700 tracking-tight">
          Asistente Financiero
        </h2>
        <button
          onClick={handleClearChat}
          className={`absolute right-4 p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors`}
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        <div className="w-full max-w-3xl lg:max-w-4xl mx-auto px-3 md:px-6 pt-4 flex flex-col min-h-full">
          
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50 pb-20">
              <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Bot className="text-teal-600 w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium text-sm">¿Cómo puedo ayudarte con tus finanzas?</p>
            </div>
          )}

          {messages.map((msg, idx) => (
             <MessageBubble 
                key={idx} 
                msg={msg} 
                isLast={idx === messages.length - 1} 
                isStreaming={isStreaming} 
             />
          ))}

          <AnimatePresence>
            {isStreaming && !hasReceivedFirstToken && <ThinkingBubble />}
          </AnimatePresence>
          
          <div ref={messagesEndRef} className="h-[160px] md:h-[120px]" />
        </div>
      </div>

      {/* Scroll to bottom floating button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-44 md:bottom-28 left-1/2 -translate-x-1/2 bg-slate-800 text-white shadow-lg rounded-full p-2 z-30 flex items-center gap-2 px-4 text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            <ArrowDown size={14} />
            <span>Ver últimos mensajes</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="fixed left-0 right-0 bottom-20 md:bottom-0 bg-slate-50/80 backdrop-blur-md z-40 border-t border-slate-200">
        <div className="w-full max-w-3xl lg:max-w-4xl mx-auto px-4 py-3 md:py-6">
          <div className="relative flex items-end gap-2 bg-white border border-slate-300 rounded-[24px] p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-teal-100 focus-within:border-teal-400 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => dispatch(setInput(e.target.value))}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              disabled={isStreaming}
              className="flex-1 bg-transparent border-none outline-0 focus:ring-0 py-3 px-4 min-h-[44px] max-h-[140px] resize-none text-slate-800 placeholder-slate-400 text-base"
              rows={1}
            />
            <div className="pb-1 pr-1">
              {isStreaming ? (
                <button
                  onClick={() => { dispatch(setIsStreaming(false)); dispatch(markLastMessageAsInterrupted()) }}
                  className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <StopCircle size={20} />
                </button>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="p-3 bg-teal-600 text-white rounded-2xl disabled:opacity-50 disabled:bg-slate-200 hover:bg-teal-700 transition-all shadow-sm"
                >
                  <Send size={18} />
                </button>
              )}
            </div>
          </div>
          {/* Spacer */}
          <div className="hidden md:block h-12" />
        </div>
      </div>

    </div>
  )
}

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

// --- 1. Smooth Cursor ---
const SmoothCursor = () => (
  <motion.span
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ repeat: Infinity, duration: 0.5, repeatType: "reverse" }}
    className="inline-block w-[3px] h-5 bg-blue-500 ml-1 align-bottom rounded-full"
  />
)

// --- 2. Thinking Bubble (Immediate Feedback) ---
const ThinkingBubble = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="flex w-full justify-start mb-6"
  >
    <div className="flex items-start max-w-[90%] md:max-w-[80%] gap-3">
      <div className="flex-shrink-0 w-8 h-8 mt-1 rounded-full bg-white border border-gray-200 flex items-center justify-center text-purple-600 shadow-sm">
        <Sparkles size={16} />
      </div>
      <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3">
        <span className="flex gap-1.5">
          <motion.span 
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
            className="w-2 h-2 bg-blue-400 rounded-full" 
          />
          <motion.span 
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
            className="w-2 h-2 bg-blue-400 rounded-full" 
          />
          <motion.span 
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
            className="w-2 h-2 bg-blue-400 rounded-full" 
          />
        </span>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Processing</span>
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

  // Find currently executing tool for inline status
  const executingTool = isLast && isStreaming && msg.toolUses
    ? msg.toolUses.find(t => t.status === "executing")
    : null

  return (
    <>
      {/* Inline tool status (ChatGPT/Claude style) for executing tools */}
      {!isUser && executingTool && (
        <AnimatePresence>
          <InlineToolStatus tool={executingTool} />
        </AnimatePresence>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {/*
           RESPONSIVE WIDTH LOGIC:
           - max-w-[88%]: On mobile, bubble takes up most of the screen (avoiding thin columns).
           - md:max-w-[80%]: On desktop, slightly restricted to keep distinct 'chat' feel.
        */}
        <div className={`flex max-w-[88%] md:max-w-[80%] gap-2 md:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

          {/* Avatar - Hidden on very small screens for User to save space, optional */}
          <div className={`flex-shrink-0 w-7 h-7 md:w-9 md:h-9 mt-0.5 rounded-full flex items-center justify-center shadow-sm transition-all
            ${isUser
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-purple-600'
            }`}>
            {isUser ? <User size={15} className="md:w-5 md:h-5" /> : <Bot size={16} className="md:w-5 md:h-5" />}
          </div>

          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full min-w-0`}>
            {/* Name Label */}
            <div className="flex items-baseline gap-2 mb-1 px-1">
              <span className="text-xs font-medium text-gray-500 opacity-0 md:opacity-100 transition-opacity">
                {isUser ? 'You' : 'Agent'}
              </span>
              {msg.interrupted && (
                <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md uppercase tracking-wider font-bold">
                  Interrupted
                </span>
              )}
            </div>

            {/*
               BUBBLE BODY STYLING
               - Using break-words to ensure long URLs or strings don't break layout on mobile.
            */}
            <div className={`relative px-4 py-3 md:px-6 md:py-4 shadow-sm text-sm md:text-base leading-relaxed w-full break-words
              ${isUser
                ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm'
              }`}>

              {/* Render Tools (Enhanced Cards) */}
              {msg.toolUses && msg.toolUses.length > 0 && (
                 <div className="mb-4 flex flex-col gap-2 w-full">
                   {msg.toolUses.map((tool, i) => (
                     <EnhancedToolCard key={tool.id || i} tool={tool} autoCollapse={true} />
                   ))}
                 </div>
              )}

              {/* Render Content */}
              {isUser ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <div className={`markdown-body w-full ${msg.content ? '' : 'min-h-[20px]'}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({children}) => <p className="mb-3 last:mb-0">{children}</p>,
                      a: ({href, children}) => <a href={href} className="text-blue-500 hover:underline break-all" target="_blank">{children}</a>,
                      // Code block styling
                      code: ({className, children}) => {
                        const isInline = !className;
                        return isInline
                          ? <code className="bg-gray-100 text-red-500 px-1 py-0.5 rounded font-mono text-xs md:text-sm border border-gray-200">{children}</code>
                          : <code className="block bg-gray-900 text-gray-100 p-3 md:p-4 rounded-lg my-3 overflow-x-auto font-mono text-xs md:text-sm shadow-inner">{children}</code>
                      },
                      // Lists
                      ul: ({children}) => <ul className="list-disc pl-4 md:pl-6 mb-2 space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal pl-4 md:pl-6 mb-2 space-y-1">{children}</ol>,
                      // Tables (crucial for responsiveness)
                      table: ({children}) => <div className="overflow-x-auto my-3 rounded-lg border border-gray-200"><table className="min-w-full divide-y divide-gray-200">{children}</table></div>,
                      th: ({children}) => <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>,
                      td: ({children}) => <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 border-t border-gray-100">{children}</td>
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {isLast && isStreaming && <SmoothCursor />}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// --- Main Chat View ---

export function ChatView() {
  const dispatch = useAppDispatch()
  const messages = useAppSelector((state) => state.messages.messages)
  const input = useAppSelector((state) => state.chatUI.input)
  const isStreaming = useAppSelector((state) => state.chatUI.isStreaming)
  
  const [hasReceivedFirstToken, setHasReceivedFirstToken] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isStreaming, hasReceivedFirstToken])

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

    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    let currentAssistantMessage = ''
    let currentToolUses: ToolUse[] = []
    let assistantMessageCreated = false

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentInput,
          systemPrompt: 'You are a helpful AI assistant.',
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
              setHasReceivedFirstToken(true); 

              if (parsed.type === "text") {
                // Mark any executing tools as completed when text arrives (heuristic)
                currentToolUses = currentToolUses.map(tool => {
                  if (tool.status === "executing") {
                    const duration = tool.timestamp ? Date.now() - tool.timestamp : undefined
                    return { ...tool, status: "completed" as const, duration }
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
                  status: "executing", // Set status to executing when tool is first used
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
                // Handle tool completion (when backend sends this event)
                const toolIndex = currentToolUses.findIndex(t => t.id === parsed.id)
                if (toolIndex !== -1) {
                  const completedTool = currentToolUses[toolIndex]
                  const duration = completedTool.timestamp ? Date.now() - completedTool.timestamp : undefined
                  currentToolUses[toolIndex] = {
                    ...completedTool,
                    status: "completed",
                    duration
                  }
                  dispatch(updateLastMessage({ content: currentAssistantMessage, toolUses: [...currentToolUses] }))
                }
              } else if (parsed.type === "error") {
                // Handle tool errors
                if (parsed.tool_id) {
                  const toolIndex = currentToolUses.findIndex(t => t.id === parsed.tool_id)
                  if (toolIndex !== -1) {
                    currentToolUses[toolIndex] = {
                      ...currentToolUses[toolIndex],
                      status: "error",
                      error: parsed.error
                    }
                    dispatch(updateLastMessage({ content: currentAssistantMessage, toolUses: [...currentToolUses] }))
                  }
                } else {
                  dispatch(setToolActivity(`Error: ${parsed.error}`))
                }
              }
            } catch (e) { console.error(e) }
          }
        }
      }
    } catch (e) {
      dispatch(addMessage({ role: 'assistant', content: 'Connection error.' }))
    } finally {
      dispatch(setIsStreaming(false))
      setHasReceivedFirstToken(false)
    }
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 font-sans text-slate-900">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <span className="font-semibold text-slate-700">Chat con Lucas</span>
        </div>
        <button
          onClick={handleClearChat}
          className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs md:text-sm font-medium
            ${showClearConfirm ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages Area - WIDER CONTAINER ON DESKTOP */}
      <div className="flex-1 overflow-y-auto p-1 md:p-6 scroll-smooth">
        <div className="w-full max-w-4xl lg:max-w-5xl mx-auto flex flex-col">
          
          {messages.length === 0 && (
            <div className="mt-24 flex flex-col items-center justify-center opacity-60 px-4 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-slate-100">
                <Bot className="text-blue-500 w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">How can I help?</h2>
              <p className="text-sm text-slate-500">I'm ready to assist.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <MessageBubble key={idx} msg={msg} isLast={idx === messages.length - 1} isStreaming={isStreaming} />
          ))}

          <AnimatePresence>
            {isStreaming && !hasReceivedFirstToken && <ThinkingBubble />}
          </AnimatePresence>
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area - MATCHING WIDTH */}
      <div className="p-3 md:p-6 bg-white/80 backdrop-blur-md border-t border-slate-200">
        <div className="w-full max-w-4xl lg:max-w-5xl mx-auto relative">
          <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => dispatch(setInput(e.target.value))}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              disabled={isStreaming}
              className="flex-1 bg-transparent border-none focus:ring-0 p-3 min-h-[44px] max-h-[150px] resize-none text-slate-800 placeholder-slate-400 text-base"
              rows={1}
            />
            <div className="pb-1 pr-1">
              {isStreaming ? (
                 <button onClick={() => { dispatch(setIsStreaming(false)); dispatch(markLastMessageAsInterrupted()) }} className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-colors"><StopCircle size={20} /></button>
              ) : (
                <button onClick={sendMessage} disabled={!input.trim()} className="p-2 bg-blue-600 text-white rounded-xl disabled:opacity-50 hover:bg-blue-700 shadow-sm transition-all hover:scale-105 active:scale-95"><Send size={20} /></button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

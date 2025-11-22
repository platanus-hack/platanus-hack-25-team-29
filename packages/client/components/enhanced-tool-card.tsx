"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Check, AlertCircle, Loader2 } from "lucide-react"
import { getToolMetadata } from "@/lib/tool-metadata"
import { formatToolInput } from "@/lib/tool-formatters"
import type { ToolUse } from "@/store/types"

interface EnhancedToolCardProps {
  tool: ToolUse
  autoCollapse?: boolean // Auto-collapse after completion
}

/**
 * Enhanced tool card with status indicators, animations, and collapsible design
 */
export function EnhancedToolCard({ tool, autoCollapse = true }: EnhancedToolCardProps) {
  const metadata = getToolMetadata(tool.name)
  const [isExpanded, setIsExpanded] = useState(true)
  const [shouldAutoCollapse, setShouldAutoCollapse] = useState(false)

  const status = tool.status || "pending"
  const summary = tool.summary || formatToolInput(tool.name, tool.input || {})

  // Auto-collapse logic: collapse 2 seconds after completion
  useEffect(() => {
    if (autoCollapse && status === "completed" && !shouldAutoCollapse) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
        setShouldAutoCollapse(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [status, autoCollapse, shouldAutoCollapse])

  // Status icon component
  const StatusIcon = () => {
    switch (status) {
      case "executing":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 size={14} className={metadata.color.icon} />
          </motion.div>
        )
      case "completed":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Check size={14} className="text-green-600" />
          </motion.div>
        )
      case "error":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <AlertCircle size={14} className="text-red-600" />
          </motion.div>
        )
      default:
        return (
          <div className={`w-2 h-2 rounded-full ${metadata.color.icon.replace("text-", "bg-")} opacity-50`} />
        )
    }
  }

  // Status border color
  const getBorderColor = () => {
    switch (status) {
      case "executing":
        return metadata.color.border
      case "completed":
        return "border-green-200"
      case "error":
        return "border-red-200"
      default:
        return metadata.color.border
    }
  }

  // Status background color
  const getBgColor = () => {
    switch (status) {
      case "executing":
        return metadata.color.bg
      case "completed":
        return "bg-green-50/50"
      case "error":
        return "bg-red-50"
      default:
        return metadata.color.bg
    }
  }

  const Icon = metadata.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-2 w-full border rounded-lg overflow-hidden ${getBorderColor()} ${getBgColor()}`}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-black/5 transition-colors"
      >
        {/* Tool icon */}
        <div className={`p-1 rounded ${metadata.color.icon} opacity-80`}>
          <Icon size={14} />
        </div>

        {/* Tool name */}
        <span className={`text-xs font-semibold ${metadata.color.text} flex-1 text-left truncate`}>
          {metadata.displayName}
        </span>

        {/* Status icon */}
        <div className="flex items-center gap-2">
          <StatusIcon />

          {/* Expand/collapse chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} className="text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-2">
              {/* Summary */}
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">
                  Parámetros
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  {summary}
                </div>
              </div>

              {/* Error message */}
              {status === "error" && tool.error && (
                <div>
                  <div className="text-[10px] text-red-500 uppercase font-bold mb-1 tracking-wider">
                    Error
                  </div>
                  <div className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                    {tool.error}
                  </div>
                </div>
              )}

              {/* Duration (if available) */}
              {tool.duration && status === "completed" && (
                <div className="text-[10px] text-slate-400 italic">
                  Completado en {tool.duration}ms
                </div>
              )}

              {/* Raw input (collapsed by default, for debugging) */}
              {process.env.NODE_ENV === "development" && (
                <details className="text-[10px]">
                  <summary className="text-slate-400 uppercase font-bold tracking-wider cursor-pointer hover:text-slate-600">
                    Input (Debug)
                  </summary>
                  <code className="block mt-1 text-slate-600 font-mono whitespace-pre-wrap break-all bg-slate-100 p-2 rounded">
                    {JSON.stringify(tool.input, null, 2)}
                  </code>
                </details>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle animation for executing status */}
      {status === "executing" && (
        <motion.div
          className="h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      )}
    </motion.div>
  )
}

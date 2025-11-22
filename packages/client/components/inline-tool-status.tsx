"use client"

import React from "react"
import { motion } from "framer-motion"
import { getToolMetadata } from "@/lib/tool-metadata"
import { formatInlineStatus } from "@/lib/tool-formatters"
import type { ToolUse } from "@/store/types"

interface InlineToolStatusProps {
  tool: ToolUse
}

/**
 * Inline tool status component (ChatGPT/Claude style)
 * Shows a compact, animated status message for currently executing tools
 */
export function InlineToolStatus({ tool }: InlineToolStatusProps) {
  const metadata = getToolMetadata(tool.name)
  const statusText = tool.summary || formatInlineStatus(tool.name, tool.input || {})

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex w-full justify-start mb-3"
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-white/50 backdrop-blur-sm border border-slate-200/50 rounded-lg shadow-sm">
        {/* Animated emoji/icon */}
        <motion.span
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-base"
        >
          {metadata.emoji}
        </motion.span>

        {/* Status text */}
        <span className="text-sm text-slate-600 font-medium">
          {statusText}
        </span>

        {/* Animated dots */}
        <span className="flex gap-1 ml-1">
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
            className="w-1 h-1 bg-slate-400 rounded-full"
          />
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            className="w-1 h-1 bg-slate-400 rounded-full"
          />
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            className="w-1 h-1 bg-slate-400 rounded-full"
          />
        </span>
      </div>
    </motion.div>
  )
}

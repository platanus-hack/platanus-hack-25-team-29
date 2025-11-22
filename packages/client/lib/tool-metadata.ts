/**
 * Tool metadata configuration
 * Maps technical tool names to user-friendly display information
 */

import {
  Calendar,
  Search,
  BarChart3,
  ArrowLeftRight,
  Calculator,
  TrendingUp,
  Database,
  FileText,
  type LucideIcon
} from "lucide-react"

export type ToolCategory = "data" | "analysis" | "calculation" | "system"

export interface ToolMetadata {
  displayName: string
  icon: LucideIcon
  category: ToolCategory
  color: {
    bg: string      // Background color
    border: string  // Border color
    icon: string    // Icon color
    text: string    // Text color
  }
  emoji: string     // For inline status display
}

export const TOOL_METADATA: Record<string, ToolMetadata> = {
  // Data Retrieval Tools
  "mcp__Tools__get_date": {
    displayName: "Verificando fecha actual",
    icon: Calendar,
    category: "data",
    color: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      text: "text-blue-700"
    },
    emoji: "📅"
  },

  "mcp__Tools__list_movements": {
    displayName: "Buscando movimientos",
    icon: Search,
    category: "data",
    color: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      text: "text-blue-700"
    },
    emoji: "🔍"
  },

  "mcp__Tools__get_movements_schema": {
    displayName: "Consultando estructura de datos",
    icon: FileText,
    category: "system",
    color: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      icon: "text-slate-600",
      text: "text-slate-700"
    },
    emoji: "📋"
  },

  // Analysis Tools
  "mcp__Tools__aggregate_by_description": {
    displayName: "Analizando patrones de gasto",
    icon: BarChart3,
    category: "analysis",
    color: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "text-purple-600",
      text: "text-purple-700"
    },
    emoji: "📊"
  },

  "mcp__Tools__aggregate_transfers_by_holder": {
    displayName: "Analizando transferencias",
    icon: ArrowLeftRight,
    category: "analysis",
    color: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "text-purple-600",
      text: "text-purple-700"
    },
    emoji: "💸"
  },

  // Calculation Tools
  "mcp__Tools__calculate": {
    displayName: "Calculando",
    icon: Calculator,
    category: "calculation",
    color: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "text-green-600",
      text: "text-green-700"
    },
    emoji: "🧮"
  },

  "mcp__Tools__compound_interest": {
    displayName: "Calculando interés compuesto",
    icon: TrendingUp,
    category: "calculation",
    color: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "text-green-600",
      text: "text-green-700"
    },
    emoji: "📈"
  },

  // System Tools
  "mcp__Tools__execute_query": {
    displayName: "Ejecutando consulta",
    icon: Database,
    category: "system",
    color: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "text-amber-600",
      text: "text-amber-700"
    },
    emoji: "⚡"
  }
}

/**
 * Get metadata for a tool by its technical name
 * Falls back to default metadata if tool is unknown
 */
export function getToolMetadata(toolName: string): ToolMetadata {
  return TOOL_METADATA[toolName] || {
    displayName: toolName.replace(/mcp__Tools__/g, "").replace(/_/g, " "),
    icon: Database,
    category: "system",
    color: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      icon: "text-gray-600",
      text: "text-gray-700"
    },
    emoji: "🔧"
  }
}

/**
 * Strip technical prefix from tool name
 */
export function stripToolPrefix(toolName: string): string {
  return toolName.replace(/^mcp__Tools__/, "")
}

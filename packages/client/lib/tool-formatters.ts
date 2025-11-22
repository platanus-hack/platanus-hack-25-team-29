/**
 * Tool input formatters
 * Convert JSON tool inputs to human-readable Spanish summaries
 */

import { stripToolPrefix } from "./tool-metadata"

type ToolInput = Record<string, any>

/**
 * Format a date string to Spanish readable format
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const months = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ]
    return `${date.getDate()} de ${months[date.getMonth()]}`
  } catch {
    return dateStr
  }
}

/**
 * Format boolean to Spanish
 */
function formatBoolean(value: boolean): string {
  return value ? "Sí" : "No"
}

/**
 * Format number with thousand separators
 */
function formatNumber(value: number): string {
  return value.toLocaleString("es-ES")
}

/**
 * Tool-specific formatters
 */
const TOOL_FORMATTERS: Record<string, (input: ToolInput) => string> = {
  "list_movements": (input) => {
    const parts: string[] = []

    if (input.since && input.until) {
      parts.push(`Del ${formatDate(input.since)} al ${formatDate(input.until)}`)
    } else if (input.since) {
      parts.push(`Desde ${formatDate(input.since)}`)
    } else if (input.until) {
      parts.push(`Hasta ${formatDate(input.until)}`)
    }

    if (input.confirmed_only !== undefined) {
      parts.push(`Solo confirmados: ${formatBoolean(input.confirmed_only)}`)
    }

    if (input.page && input.page > 1) {
      parts.push(`Página ${input.page}`)
    }

    if (input.per_page) {
      parts.push(`Mostrando ${input.per_page} por página`)
    }

    return parts.length > 0 ? parts.join(" • ") : "Todos los movimientos"
  },

  "aggregate_by_description": (input) => {
    const parts: string[] = []

    if (input.since && input.until) {
      parts.push(`Período: ${formatDate(input.since)} - ${formatDate(input.until)}`)
    } else if (input.since) {
      parts.push(`Desde ${formatDate(input.since)}`)
    } else if (input.until) {
      parts.push(`Hasta ${formatDate(input.until)}`)
    }

    if (input.min_count && input.min_count > 1) {
      parts.push(`Mínimo ${input.min_count} ocurrencias`)
    }

    if (input.confirmed_only !== undefined) {
      parts.push(`Solo confirmados: ${formatBoolean(input.confirmed_only)}`)
    }

    return parts.length > 0 ? parts.join(" • ") : "Agrupando gastos"
  },

  "aggregate_transfers_by_holder": (input) => {
    const parts: string[] = []

    if (input.since && input.until) {
      parts.push(`Período: ${formatDate(input.since)} - ${formatDate(input.until)}`)
    } else if (input.since) {
      parts.push(`Desde ${formatDate(input.since)}`)
    } else if (input.until) {
      parts.push(`Hasta ${formatDate(input.until)}`)
    }

    if (input.min_count && input.min_count > 1) {
      parts.push(`Mínimo ${input.min_count} transferencias`)
    }

    return parts.length > 0 ? parts.join(" • ") : "Agrupando transferencias"
  },

  "calculate": (input) => {
    if (input.expression) {
      return `Expresión: ${input.expression}`
    }
    return "Realizando cálculo"
  },

  "compound_interest": (input) => {
    const parts: string[] = []

    if (input.principal) {
      parts.push(`Capital: $${formatNumber(input.principal)}`)
    }
    if (input.rate) {
      parts.push(`Tasa: ${(input.rate * 100).toFixed(2)}%`)
    }
    if (input.time) {
      parts.push(`${input.time} años`)
    }

    return parts.length > 0 ? parts.join(" • ") : "Calculando interés"
  },

  "execute_query": (input) => {
    if (input.query) {
      const query = input.query.trim()
      // Extract table name if possible
      const tableMatch = query.match(/FROM\s+(\w+)/i)
      if (tableMatch) {
        return `Consultando tabla: ${tableMatch[1]}`
      }
      return "Ejecutando consulta SQL"
    }
    return "Consulta personalizada"
  },

  "get_date": () => {
    return "Obteniendo fecha actual"
  },

  "get_movements_schema": () => {
    return "Consultando estructura de la base de datos"
  }
}

/**
 * Generate a human-readable summary for tool input
 */
export function formatToolInput(toolName: string, input: ToolInput): string {
  const simpleName = stripToolPrefix(toolName)
  const formatter = TOOL_FORMATTERS[simpleName]

  if (formatter) {
    try {
      return formatter(input)
    } catch (error) {
      console.error(`Error formatting tool input for ${simpleName}:`, error)
    }
  }

  // Fallback: show key parameters
  const keys = Object.keys(input || {})
  if (keys.length === 0) return "Sin parámetros"

  const params = keys
    .slice(0, 3) // Show max 3 params
    .map(key => {
      const value = input[key]
      if (typeof value === "boolean") return `${key}: ${formatBoolean(value)}`
      if (typeof value === "number") return `${key}: ${formatNumber(value)}`
      if (typeof value === "string" && value.length > 30) {
        return `${key}: ${value.slice(0, 30)}...`
      }
      return `${key}: ${value}`
    })
    .join(" • ")

  return params
}

/**
 * Generate a concise inline status message for currently executing tool
 */
export function formatInlineStatus(toolName: string, input: ToolInput): string {
  const simpleName = stripToolPrefix(toolName)

  // Special cases for more natural inline messages
  switch (simpleName) {
    case "list_movements":
      if (input.since && input.until) {
        return `Buscando movimientos de ${formatDate(input.since).replace(" de ", " ")}...`
      }
      return "Buscando tus movimientos..."

    case "aggregate_by_description":
      return "Analizando patrones de gasto..."

    case "aggregate_transfers_by_holder":
      return "Analizando tus transferencias..."

    case "calculate":
      return "Calculando..."

    case "compound_interest":
      return "Calculando rendimientos..."

    case "execute_query":
      return "Consultando base de datos..."

    case "get_date":
      return "Verificando fecha..."

    case "get_movements_schema":
      return "Consultando estructura..."

    default:
      return "Procesando..."
  }
}



import { Movement } from "@/lib/types"

/**
 * Identifica gastos fijos mensuales a partir de una lista de movimientos.
 * Retorna el último Movement (por fecha) de cada grupo de gastos que ocurren una vez al mes.
 */
export function getMonthlyFixedExpenses({movements, getFixes=true}: {movements: Movement[], getFixes?: boolean}): Movement[] {

  // Filtrar solo gastos (amount negativo) y que tengan campos necesarios
  const gastos = movements.filter(
    (mov) =>
      typeof mov.amount === "number" &&
      mov.amount < 0 &&
      !!mov.description &&
      !!mov.post_date
  )

  // Agrupar por descripción normalizada
  const groups: Record<string, Movement[]> = {}
  for (const g of gastos) {
    // Normalizar: quitar acentos, espacios extra y poner lowercase
    const desc = (g.description || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()

    if (!groups[desc]) groups[desc] = []
    groups[desc].push(g)
  }

  const result: Movement[] = []

  for (const desc in groups) {
    const group = groups[desc]
    // Ordenar por fecha
    group.sort((a, b) =>
      new Date(a.post_date!).getTime() - new Date(b.post_date!).getTime()
    )

    // Si hay al menos 3 gastos en meses distintos y ocurre solo una vez por mes
    const meses: Record<string, Movement[]> = {}

    for (const mov of group) {
      // Mes formato: yyyy-MM (para agrupar)
      const mes = mov.post_date ? mov.post_date.slice(0, 7) : ""
      if (!meses[mes]) meses[mes] = []
      meses[mes].push(mov)
    }

    const mesesUnicos = Object.keys(meses)
    // Al menos 3 meses y SOLO un gasto por mes en cada mes
    const esMensual = mesesUnicos.length >= 5 && mesesUnicos.every(m => meses[m].length === 1)
    if (esMensual) {
      // Tomar el gasto más reciente
      const ultimo = group[group.length - 1]
      result.push(ultimo)
    }
  }

  if (getFixes) {
    return result
  } else {
    return movements.filter(
      mov =>
        !result.some(fijo => fijo.id === mov.id && fijo.description) &&
        !(mov.description || "").toLowerCase().includes("transferencia") &&
        !(mov.description || "").toLowerCase().includes("depósito")
    )
  }
}

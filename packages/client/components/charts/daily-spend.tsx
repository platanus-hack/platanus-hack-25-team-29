"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Movement } from "@/lib/types"
import { getDaysInMonth, startOfMonth, isSameMonth } from "date-fns"
import { getMonthlyFixedExpenses } from "@/lib/filterFixes"
import { memo, useMemo, useState, useEffect } from "react"

const chartConfig = {
  daily: {
    label: "Target Diario",
    color: "white",
  },
  accumulated: {
    label: "Gasto Acumulado",
    color: "white",
  },
  target: {
    label: "Target Acumulado",
    color: "white",
  },
} satisfies ChartConfig

function getCurrentMonthChartData(movements: Movement[], budget: number) {
  const today = new Date()
  const currentDay = today.getDate()
  const daysInMonth = getDaysInMonth(today)
  const startMonth = startOfMonth(today)

  // Inicializar arrays para gastos diarios
  const dailySpend: Record<number, number> = {}

  const fixedExpenses = getMonthlyFixedExpenses({movements, getFixes: false})

  // Solo tomar gastos del mes actual y monto negativo
  for (const mov of fixedExpenses || []) {
    if (!mov.post_date) continue
    const dateObj = new Date(mov.post_date)
    if (isNaN(dateObj.getTime())) continue
    if (!isSameMonth(dateObj, startMonth)) continue

    // Solo gastos
    if (typeof mov.amount === "number" && mov.amount < 0) {
      const day = dateObj.getDate()
      dailySpend[day] = (dailySpend[day] || 0) + Math.abs(mov.amount)
    }
  }

  // Calcular el valor diario teórico para llegar a 1 millón al final del mes
  const dailyTarget = Math.round(Number(budget) / daysInMonth)

  // Crear datos para el gráfico
  const chartData: {
    day: string
    daily: number
    accumulated: number | null
    target: number
  }[] = []

  let accumulated = 0
  let targetAccumulated = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const spend = dailySpend[d] || 0
    accumulated += spend
    targetAccumulated += dailyTarget
    chartData.push({
      day: d.toString(), // sólo el número de día
      daily: dailyTarget, // línea fija diaria para llegar a 1M
      accumulated: d <= currentDay ? accumulated : null, // solo hasta el día actual
      target: targetAccumulated, // objetivo acumulado
    })
  }

  return chartData
}

export const DailySpend = memo(function DailySpend({ movements, transparent = false }: { movements: Movement[], transparent?: boolean }) {
  // Move localStorage access to state with useEffect to avoid SSR issues
  const [budget, setBudget] = useState(500000)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("budget")
      if (stored) {
        setBudget(Number(stored))
      }
    }
  }, [])

  // Memoize chart data to avoid expensive recalculation on every render
  const chartData = useMemo(() =>
    getCurrentMonthChartData(movements, budget),
    [movements, budget]
  )

  return (
    <Card className={`h-full w-full border-none ${transparent ? 'bg-transparent shadow-none' : 'bg-teal-600'} text-white`}>
      <CardHeader className={transparent ? 'px-2 py-0' : ''}>
        <CardTitle>Gasto Acumulado (mes actual)</CardTitle>
        <CardDescription className="text-white">
          Comparación entre gasto real acumulado y objetivo mensual
        </CardDescription>
      </CardHeader>
      <CardContent className={`text-white ${transparent ? 'px-2 py-2' : 'pt-2'}`}>
        <ChartContainer config={chartConfig} className="[&_.recharts-cartesian-axis-tick_text]:fill-background h-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} stroke="white" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
            />
            <YAxis
              height={300}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tickFormatter={(value) => `$${(value / 1000).toLocaleString()}k`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelKey="day"
                  labelFormatter={(value) => `Día ${value}`}
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  className="text-white gap-2"
                />
              }
            />
            <Line
              dataKey="target"
              type="linear"
              stroke="var(--color-target)"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              dataKey="accumulated"
              type="monotone"
              stroke="var(--color-accumulated)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
})


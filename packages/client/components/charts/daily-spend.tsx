"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Movement } from "@/lib/types"
import { getDaysInMonth, startOfMonth, isSameMonth } from "date-fns"

const chartConfig = {
  daily: {
    label: "Target Diario",
    color: "var(--chart-1)",
  },
  accumulated: {
    label: "Gasto Acumulado",
    color: "var(--chart-2)",
  },
  target: {
    label: "Target Acumulado",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

function getCurrentMonthChartData(movements: Movement[]) {
  const today = new Date()
  const currentDay = today.getDate()
  const daysInMonth = getDaysInMonth(today)
  const startMonth = startOfMonth(today)

  // Inicializar arrays para gastos diarios
  const dailySpend: Record<number, number> = {}

  // Solo tomar gastos del mes actual y monto negativo
  for (const mov of movements || []) {
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
  const ONE_MILLION = 4000000
  const dailyTarget = Math.round(ONE_MILLION / daysInMonth)

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

export function DailySpend({ movements }: { movements: Movement[] }) {
  const chartData = getCurrentMonthChartData(movements)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gasto Acumulado (mes actual)</CardTitle>
        <CardDescription>
          Comparación entre gasto real acumulado y objetivo mensual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              tickFormatter={(value) => `${value}`}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000).toLocaleString()}k`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelKey="day"
                  labelFormatter={(value) => `Día ${value}`}
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />
              }
            />
            <Line
              dataKey="target"
              type="linear"
              stroke="var(--color-target)"
              strokeWidth={2}
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
}


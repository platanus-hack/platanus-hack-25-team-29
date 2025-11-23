"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Movement } from "@/lib/types"
import { subMonths, format, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { memo, useMemo } from "react"

const chartConfig = {
  amount: {
    label: "Gasto Mensual",
    color: "white",
  },
} satisfies ChartConfig

export const SpendInTime = memo(function SpendInTime({ movements, transparent = false }: { movements: Movement[], transparent?: boolean }) {
  // Memoize months array to avoid recreation on every render
  const months = useMemo(() => {
    const today = new Date()
    const monthsArray: Date[] = []

    for (let i = 11; i >= 0; i--) {
      monthsArray.push(startOfMonth(subMonths(today, i)))
    }

    return monthsArray
  }, [])

  // Memoize chart data processing to avoid recomputing on every render
  const chartData = useMemo(() => {
    // Agrupar los movimientos por mes y sumar los gastos
    const spendByMonth: Record<string, number> = {}

    for (const mov of movements || []) {
      if (!mov.post_date) continue
      const dateObj = new Date(mov.post_date)
      if (isNaN(dateObj.getTime())) continue

      // Solo considerar los gastos (amount < 0)
      if (typeof mov.amount === 'number' && mov.amount < 0) {
        const monthKey = format(dateObj, 'yyyy-MM')
        spendByMonth[monthKey] = (spendByMonth[monthKey] || 0) + Math.abs(mov.amount)
      }
    }

    // Formatear datos para la gráfica
    return months.map((month) => ({
      month: format(month, 'MMMM', { locale: es }),
      monthShort: format(month, 'MMM', { locale: es }),
      amount: spendByMonth[format(month, 'yyyy-MM')] || 0
    }))
  }, [movements, months])


  return (
    <Card className={`h-full w-full border-none ${transparent ? 'bg-transparent shadow-none' : 'bg-orange-800'} text-white`}>
      <CardHeader className={transparent ? 'px-2 py-2' : ''}>
        <CardTitle>Gasto Mensual</CardTitle>
        <CardDescription className="text-white">Últimos 12 meses</CardDescription>
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
              dataKey="monthShort"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tickFormatter={(value) => `$${(value / 1000).toLocaleString()}k`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelKey="month"
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  className="gap-2"
                />
              }
            />
            <Line
              dataKey="amount"
              type="monotone"
              stroke="var(--color-amount)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
})

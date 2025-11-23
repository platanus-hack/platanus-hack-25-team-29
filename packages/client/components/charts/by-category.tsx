"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Movement } from "@/lib/types"
import { groupTransfersByDescription } from "@/lib/groupByDescription"
import { memo, useMemo } from "react"


export const ByCategory = memo(function ByCategory({ movements, transparent = false }: { movements: Movement[], transparent?: boolean }) {
  // Memoize expensive grouping and filtering operations
  const groupedTransfers = useMemo(() => {
    const grouped = groupTransfersByDescription(movements)
    return grouped
      .filter(group => group.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)
  }, [movements])

  const chartData = useMemo(() =>
    groupedTransfers.map(group => ({
      category: group.description,
      amount: group.totalAmount,
      fill: "white",
    })),
    [groupedTransfers]
  )

  const chartConfig = useMemo(() => ({
    amount: {
      label: "Gasto",
    },
    ...groupedTransfers.reduce((acc, group) => {
      acc[group.description] = {
        label: group.description,
        color: "white",
      }
      return acc
    }, {} as Record<string, { label: string; color: string }>),
  } satisfies ChartConfig), [groupedTransfers])
  return (
    <Card className={`h-full w-full border-none ${transparent ? 'bg-transparent shadow-none' : 'bg-amber-500'} text-white`}>
      <CardHeader className={transparent ? 'px-2 py-2' : ''}>
        <CardTitle>Gastos por Categoría</CardTitle>
      </CardHeader>
      <CardContent className={`text-white ${transparent ? 'px-2 py-2' : 'pt-2'}`}>
        <ChartContainer config={chartConfig} className="[&_.recharts-cartesian-axis-tick_text]:fill-background h-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={120}
              tick={({ x, y, payload }) => {
                const category = payload.value as string
                const maxLen = 12
                const displayText =
                  category.length > maxLen
                    ? category.slice(0, maxLen - 1) + "…"
                    : category
                return (
                  <text
                    x={x}
                    y={y}
                    width={100}
                    fontSize={12}
                    fill="white"
                    textAnchor="end"
                    alignmentBaseline="middle"
                  >
                    {displayText}
                  </text>
                )
              }}
            />
            <XAxis dataKey="amount" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => `: $${value.toLocaleString()}`}
                  className="gap-2"
                  labelClassName="gap-2"
                />
              }
            />
            <Bar dataKey="amount" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
})

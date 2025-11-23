"use client"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "../ui/table"
import { Movement } from "@/lib/types"
import { getMonthlyFixedExpenses } from "@/lib/filterFixes"
import { ScrollArea } from "../ui/scroll-area"



export function FixedExpenses({ movements }: { movements: Movement[] }) {
  const fixedExpenses = getMonthlyFixedExpenses({movements, getFixes: true})
  return (
    <Card className="bg-green-100 border-green-300 text-green-800 shadow-none sm:shadow-md w-full">
      <CardHeader className="-mb-4">
        <CardTitle></CardTitle>
      </CardHeader>
      <CardContent className="">
        <ScrollArea className="sm:h-70">
          <Table className="text-base bg-green-100 text-green-800 rounded-lg">
            <TableHeader>
              <TableRow>
                <TableHead className="text-green-800 font-semibold">Gastos Fijos</TableHead>
                <TableHead className="text-green-800 font-semibold">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fixedExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="max-w-[220px] truncate">{expense.description}</TableCell>
                  <TableCell className="text-right pr-4" >$ {(expense.amount * -1).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="font-bold text-right pr-4">$ {fixedExpenses.reduce((acc, expense) => acc - expense.amount, 0).toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
"use client"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "../ui/table"
import { Movement } from "@/lib/types"
import { getMonthlyFixedExpenses } from "@/lib/filterFixes"
import { ScrollArea } from "../ui/scroll-area"



export function FixedExpenses({ movements }: { movements: Movement[] }) {
  const fixedExpenses = getMonthlyFixedExpenses({movements, getFixes: true})
  return (
    <Card>
      <CardHeader>
        <CardTitle>Costos Fijos</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-60">
          <Table className="">
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Monto</TableHead>
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
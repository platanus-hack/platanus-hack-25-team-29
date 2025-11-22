import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface Movement {
    amount: number;
    currency: string;
}

interface SummaryStatsProps {
    movements: Movement[];
}

export function SummaryStats({ movements }: SummaryStatsProps) {
    const formatCurrency = (amount: number, currency: string = 'CLP') => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const totalIncome = movements
        .filter(m => m.amount > 0)
        .reduce((sum, m) => sum + m.amount, 0);

    const totalExpenses = Math.abs(
        movements
            .filter(m => m.amount < 0)
            .reduce((sum, m) => sum + m.amount, 0)
    );

    const netChange = movements.reduce((sum, m) => sum + m.amount, 0);

    const currency = movements[0]?.currency || 'CLP';

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-900">
                        Total Income
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalIncome, currency)}
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                        From {movements.filter(m => m.amount > 0).length} transactions
                    </p>
                </CardContent>
            </Card>

            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-900">
                        Total Expenses
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(totalExpenses, currency)}
                    </div>
                    <p className="text-xs text-red-700 mt-1">
                        From {movements.filter(m => m.amount < 0).length} transactions
                    </p>
                </CardContent>
            </Card>

            <Card className={`border-${netChange >= 0 ? 'blue' : 'orange'}-200 bg-gradient-to-br from-${netChange >= 0 ? 'blue' : 'orange'}-50 to-white`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium text-${netChange >= 0 ? 'blue' : 'orange'}-900`}>
                        Net Change
                    </CardTitle>
                    <DollarSign className={`h-4 w-4 text-${netChange >= 0 ? 'blue' : 'orange'}-600`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${netChange >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {netChange >= 0 ? '+' : ''}
                        {formatCurrency(netChange, currency)}
                    </div>
                    <p className={`text-xs text-${netChange >= 0 ? 'blue' : 'orange'}-700 mt-1`}>
                        {netChange >= 0 ? 'Positive balance' : 'Negative balance'}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}


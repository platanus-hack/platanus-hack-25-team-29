import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Movement {
    id: string;
    account_id: string;
    description: string;
    amount: number;
    currency: string;
    movement_type: string;
    status: string;
    pending: boolean;
    post_date: string;
    transaction_date: string;
    comment?: string;
    reference_id?: string;
}

interface MovementTableProps {
    movements: Movement[];
}

export function MovementTable({ movements }: MovementTableProps) {
    const formatCurrency = (amount: number, currency: string = 'CLP') => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getMovementIcon = (amount: number) => {
        if (amount > 0) {
            return <ArrowUpRight className="h-4 w-4 text-green-600" />;
        } else {
            return <ArrowDownLeft className="h-4 w-4 text-red-600" />;
        }
    };

    const getStatusBadge = (status: string, pending: boolean) => {
        if (pending) {
            return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
        }

        switch (status?.toLowerCase()) {
            case 'completed':
            case 'posted':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
            case 'failed':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
            default:
                return <Badge variant="outline">{status || 'Unknown'}</Badge>;
        }
    };

    return (
        <div className="overflow-x-auto rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {movements.map((movement) => (
                        <TableRow key={movement.id} className="hover:bg-muted/30">
                            <TableCell className="py-4">
                                {getMovementIcon(movement.amount)}
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="space-y-1">
                                    <p className="font-medium text-sm">{movement.description}</p>
                                    {movement.comment && (
                                        <p className="text-xs text-muted-foreground">{movement.comment}</p>
                                    )}
                                    {movement.reference_id && (
                                        <p className="text-xs text-muted-foreground font-mono">
                                            Ref: {movement.reference_id}
                                        </p>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="text-sm space-y-1">
                                    <p className="font-medium">{formatDate(movement.post_date)}</p>
                                    {movement.transaction_date && movement.transaction_date !== movement.post_date && (
                                        <p className="text-xs text-muted-foreground">
                                            Txn: {formatDate(movement.transaction_date)}
                                        </p>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="py-4">
                                {getStatusBadge(movement.status, movement.pending)}
                            </TableCell>
                            <TableCell className="text-right py-4">
                                <span className={`font-semibold text-sm ${movement.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {movement.amount > 0 ? '+' : ''}
                                    {formatCurrency(movement.amount, movement.currency)}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}


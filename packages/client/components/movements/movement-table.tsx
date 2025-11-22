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

interface Account {
    id: string;
    name: string;
    account_number: string;
    currency: string;
}

interface MovementTableProps {
    movements: Movement[];
    accounts?: Account[];
}

export function MovementTable({ movements, accounts = [] }: MovementTableProps) {
    const getAccountName = (accountId: string) => {
        const account = accounts.find(acc => acc.id === accountId);
        return account?.name || 'Unknown Bank';
    };
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
        <div className="w-full overflow-x-auto rounded-lg border">
            <Table className="min-w-full">
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead className="font-semibold min-w-[200px] max-w-[300px]">Description</TableHead>
                        <TableHead className="font-semibold min-w-[120px] max-w-[180px]">Bank</TableHead>
                        <TableHead className="font-semibold w-[110px]">Date</TableHead>
                        <TableHead className="font-semibold w-[100px] hidden md:table-cell">Status</TableHead>
                        <TableHead className="text-right font-semibold min-w-[120px]">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {movements.map((movement) => (
                        <TableRow key={movement.id} className="hover:bg-muted/30">
                            <TableCell className="py-4">
                                {getMovementIcon(movement.amount)}
                            </TableCell>
                            <TableCell className="py-4 max-w-[300px]">
                                <div className="space-y-1">
                                    <p className="font-medium text-sm truncate" title={movement.description}>
                                        {movement.description}
                                    </p>
                                    {movement.comment && (
                                        <p className="text-xs text-muted-foreground truncate" title={movement.comment}>
                                            {movement.comment}
                                        </p>
                                    )}
                                    {movement.reference_id && (
                                        <p className="text-xs text-muted-foreground font-mono truncate" title={movement.reference_id}>
                                            Ref: {movement.reference_id}
                                        </p>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="py-4 max-w-[180px]">
                                <p className="font-medium text-sm truncate" title={getAccountName(movement.account_id)}>
                                    {getAccountName(movement.account_id)}
                                </p>
                            </TableCell>
                            <TableCell className="py-4">
                                <p className="font-medium text-sm whitespace-nowrap">{formatDate(movement.post_date)}</p>
                            </TableCell>
                            <TableCell className="py-4 hidden md:table-cell">
                                {getStatusBadge(movement.status, movement.pending)}
                            </TableCell>
                            <TableCell className="text-right py-4">
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`font-semibold text-sm whitespace-nowrap ${movement.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {movement.amount > 0 ? '+' : ''}
                                        {formatCurrency(movement.amount, movement.currency)}
                                    </span>
                                    <div className="md:hidden">
                                        {getStatusBadge(movement.status, movement.pending)}
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Wallet } from 'lucide-react';

interface Account {
    id: string;
    name: string;
    account_number: string;
    balance_available: number;
    balance_current: number;
    currency: string;
    account_type: string;
}

interface AccountFilterProps {
    accounts: Account[];
    selectedAccount: string;
    onAccountSelect: (accountId: string) => void;
}

export function AccountFilter({ accounts, selectedAccount, onAccountSelect }: AccountFilterProps) {
    const formatCurrency = (amount: number, currency: string = 'CLP') => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (accounts.length === 0) return null;

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <CardTitle>Filter by Account</CardTitle>
                </div>
                <CardDescription>
                    View movements from specific accounts
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant={selectedAccount === 'all' ? 'default' : 'outline'}
                        onClick={() => onAccountSelect('all')}
                        className="gap-2"
                    >
                        <Building2 className="h-4 w-4" />
                        All Accounts
                    </Button>
                    {accounts.map((account) => (
                        <Button
                            key={account.id}
                            variant={selectedAccount === account.id ? 'default' : 'outline'}
                            onClick={() => onAccountSelect(account.id)}
                            className="gap-2"
                        >
                            <Wallet className="h-4 w-4" />
                            <div className="flex flex-col items-start">
                                <span className="font-medium">{account.name}</span>
                                <span className="text-xs opacity-70">
                                    {account.account_number} · {formatCurrency(account.balance_available, account.currency)}
                                </span>
                            </div>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}


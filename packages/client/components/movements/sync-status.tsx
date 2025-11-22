import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface SyncResponse {
    success: boolean;
    accounts_synced: number;
    movements_synced: number;
    user_id: string;
    token: string;
}

interface SyncStatusProps {
    syncResult?: SyncResponse | null;
    error?: string | null;
}

export function SyncStatus({ syncResult, error }: SyncStatusProps) {
    if (!syncResult && !error) return null;

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <CardTitle className="text-red-900">Error</CardTitle>
                    </div>
                    <CardDescription className="text-red-700 mt-2">
                        {error}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (syncResult) {
        return (
            <Card className="border-green-200 bg-green-50 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-green-900">Sync Successful</CardTitle>
                    </div>
                    <CardDescription className="text-green-700 mt-1">
                        Your financial data has been successfully synced from Fintoc
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Accounts</p>
                            <p className="text-3xl font-bold text-green-900">{syncResult.accounts_synced}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Movements</p>
                            <p className="text-3xl font-bold text-green-900">{syncResult.movements_synced}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-green-700 font-medium uppercase tracking-wide">User ID</p>
                            <p className="text-xs font-mono text-green-900 truncate">{syncResult.user_id}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Token</p>
                            <p className="text-xs font-mono text-green-900 truncate">{syncResult.token}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
}


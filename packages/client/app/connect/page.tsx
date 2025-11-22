"use client";

import { useState, useEffect } from "react";
import FintocWidget from "@/components/FintocWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, RefreshCw, AlertCircle, Building2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE_URL = 'https://platanus-grupo29-681510028004.us-central1.run.app';

interface BankAccount {
    id: string;
    name: string;
    institution_name?: string;
    holder_name?: string;
}

export default function ConnectBankPage() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [syncResult, setSyncResult] = useState<{ accounts_synced: number; movements_synced: number } | null>(null);
    const [isCheckingConnection, setIsCheckingConnection] = useState(true);
    const [hasExistingConnection, setHasExistingConnection] = useState(false);
    const [existingAccounts, setExistingAccounts] = useState<BankAccount[]>([]);
    const [showConnectNew, setShowConnectNew] = useState(false);

    // Check if user already has a bank connection
    useEffect(() => {
        checkExistingConnection();
    }, []);

    const checkExistingConnection = async () => {
        try {
            setIsCheckingConnection(true);

            const response = await fetch(`${API_BASE_URL}/fintoc/accounts`);

            if (response.ok) {
                const data = await response.json();
                const accounts = Array.isArray(data) ? data : (data.accounts || []);

                if (accounts.length > 0) {
                    setHasExistingConnection(true);
                    setExistingAccounts(accounts);
                    console.log('✓ Found existing bank connection:', accounts.length, 'accounts');
                } else {
                    setHasExistingConnection(false);
                }
            } else {
                setHasExistingConnection(false);
            }
        } catch (error) {
            console.error('Error checking existing connection:', error);
            setHasExistingConnection(false);
        } finally {
            setIsCheckingConnection(false);
        }
    };

    // Format account display name
    const formatAccountName = (account: BankAccount) => {
        const parts = [];

        if (account.institution_name) {
            parts.push(account.institution_name);
        }

        if (account.name) {
            parts.push(account.name);
        }

        if (account.holder_name) {
            parts.push(account.holder_name);
        }

        return parts.length > 0 ? parts.join(' - ') : 'Unknown Account';
    };

    const handleBankConnected = async () => {
        try {
            setIsSyncing(true);
            setSyncError(null);

            console.log('🔄 Auto-syncing data after bank connection...');

            const response = await fetch(`${API_BASE_URL}/fintoc/sync`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                console.error('Sync error:', errorData);

                const errorMessage =
                    errorData.detail?.message ||
                    errorData.detail ||
                    errorData.message ||
                    `Sync failed with status ${response.status}`;

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('✅ Sync successful:', data);
            setSyncResult(data);
            setSyncSuccess(true);
            setShowConnectNew(false);

            // Refresh connection status
            await checkExistingConnection();

        } catch (err: any) {
            console.error('❌ Sync error:', err);
            setSyncError(err.message || 'Failed to sync data');
        } finally {
            setIsSyncing(false);
        }
    };

    if (isCheckingConnection) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
                <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <p>Checking connection status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-16 px-4 sm:px-16 bg-white dark:bg-black">
                <div className="flex flex-col items-center gap-8 text-center w-full">
                    <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
                        {hasExistingConnection && !showConnectNew ? 'Bank Connection Status' : 'Connect Bank Account'}
                    </h1>
                    <p className="max-w-md text-base sm:text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                        {hasExistingConnection && !showConnectNew
                            ? 'Manage your connected bank accounts and sync your financial data.'
                            : 'Connect your bank account securely using Fintoc to enable financial insights and personalized recommendations.'
                        }
                    </p>

                    {/* Existing Connection Info */}
                    {hasExistingConnection && !showConnectNew && (
                        <Card className="w-full max-w-md border-green-200 bg-green-50">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <CardTitle className="text-green-900">Bank Connected</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-green-700 text-left mb-4">
                                    You have {existingAccounts.length} bank account{existingAccounts.length !== 1 ? 's' : ''} connected:
                                </CardDescription>
                                <div className="space-y-2">
                                    {existingAccounts.map((account) => (
                                        <div key={account.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-green-200">
                                            <Building2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                            <span className="text-sm font-medium text-green-900 truncate" title={formatAccountName(account)}>
                                                {formatAccountName(account)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex flex-col gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowConnectNew(true)}
                                        className="w-full"
                                    >
                                        Connect Another Account
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Info about connecting additional accounts */}
                    {hasExistingConnection && showConnectNew && (
                        <Card className="w-full max-w-md border-blue-200 bg-blue-50">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-left">
                                        <p className="font-medium text-blue-900">Adding New Account</p>
                                        <p className="text-sm text-blue-700 mt-1">
                                            You already have {existingAccounts.length} account{existingAccounts.length !== 1 ? 's' : ''} connected.
                                            Connecting a new account will add it to your existing connections.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Widget - show if no connection OR if user wants to add new */}
                    {(!hasExistingConnection || showConnectNew) && (
                        <div className="mt-4 w-full max-w-md">
                            <FintocWidget
                                onSuccess={handleBankConnected}
                                onError={(error) => setSyncError(error)}
                            />
                            {showConnectNew && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowConnectNew(false)}
                                    className="w-full mt-4"
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Syncing Status */}
                    {isSyncing && (
                        <Card className="w-full max-w-md border-blue-200 bg-blue-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                                    <div className="text-left">
                                        <p className="font-medium text-blue-900">Syncing your data...</p>
                                        <p className="text-sm text-blue-700">Please wait while we fetch your transactions</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Success Status */}
                    {syncSuccess && syncResult && (
                        <Card className="w-full max-w-md border-green-200 bg-green-50">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <CardTitle className="text-green-900">Successfully Connected!</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-green-700">
                                    Your bank account has been connected and data synced successfully.
                                </CardDescription>
                                <div className="mt-4 space-y-2 text-sm text-green-800">
                                    <p>✓ Accounts synced: <strong>{syncResult.accounts_synced}</strong></p>
                                    <p>✓ Movements synced: <strong>{syncResult.movements_synced}</strong></p>
                                </div>
                                <p className="mt-4 text-sm text-green-700">
                                    You can now view your transactions in the Movements page.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Error Status */}
                    {syncError && !isSyncing && (
                        <Card className="w-full max-w-md border-red-200 bg-red-50">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-left">
                                        <p className="font-medium text-red-900">Sync Error</p>
                                        <p className="text-sm text-red-700 mt-1">{syncError}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}

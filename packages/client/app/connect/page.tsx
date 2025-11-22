"use client";

import { useState } from "react";
import FintocWidget from "@/components/FintocWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";

const API_BASE_URL = 'https://platanus-grupo29-681510028004.us-central1.run.app';

export default function ConnectBankPage() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [syncResult, setSyncResult] = useState<{ accounts_synced: number; movements_synced: number } | null>(null);

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
            
        } catch (err: any) {
            console.error('❌ Sync error:', err);
            setSyncError(err.message || 'Failed to sync data');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-16 px-4 sm:px-16 bg-white dark:bg-black">
                <div className="flex flex-col items-center gap-8 text-center w-full">
                    <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
                        Connect Bank Account
                    </h1>
                    <p className="max-w-md text-base sm:text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                        Connect your bank account securely using Fintoc to enable financial insights and personalized recommendations.
                    </p>
                    
                    <div className="mt-4 w-full max-w-md">
                        <FintocWidget 
                            onSuccess={handleBankConnected}
                            onError={(error) => setSyncError(error)}
                        />
                    </div>

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

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wallet, ArrowLeftRight } from 'lucide-react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { MovementTable } from '@/components/movements/movement-table';
import { SummaryStats } from '@/components/movements/summary-stats';
import { SyncStatus } from '@/components/movements/sync-status';
import { AccountFilter } from '@/components/movements/account-filter';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const API_BASE_URL = 'https://platanus-grupo29-681510028004.us-central1.run.app';

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
    balance_available: number;
    balance_current: number;
    currency: string;
    account_type: string;
}

interface SyncResponse {
    success: boolean;
    accounts_synced: number;
    movements_synced: number;
    user_id: string;
    token: string;
}

export default function MovementsPage() {
    const [movements, setMovements] = useState<Movement[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    
    // Sync data from Fintoc
    const handleSync = async () => {
        try {
            setIsSyncing(true);
            setError(null);
            setSyncResult(null);

            console.log('Starting sync to:', `${API_BASE_URL}/fintoc/sync`);

            const response = await fetch(`${API_BASE_URL}/fintoc/sync`, {
                method: 'POST',
            });

            console.log('Sync response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                console.error('Sync error data:', errorData);

                if (errorData.detail?.error === 'NO_BANK_CONNECTED') {
                    throw new Error('No hay cuenta bancaria conectada. Por favor conecta tu cuenta bancaria primero.');
                }

                // Handle different error formats
                const errorMessage =
                    errorData.detail?.message ||
                    errorData.detail ||
                    errorData.message ||
                    `Sincronización fallida con estado ${response.status}`;

                throw new Error(errorMessage);
            }

            const data: SyncResponse = await response.json();
            console.log('Sync successful:', data);
            setSyncResult(data);

            // After successful sync, fetch the data
            await fetchMovements();
            await fetchAccounts();

        } catch (err: any) {
            console.error('Sync error:', err);
            setError(err.message || 'Error al sincronizar datos desde Fintoc');
        } finally {
            setIsSyncing(false);
        }
    };

    // Fetch movements from the database
    const fetchMovements = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/fintoc/movements`);

            if (!response.ok) {
                throw new Error('Error al obtener movimientos');
            }

            const data = await response.json();
            setMovements(Array.isArray(data) ? data : data.movements || []);
        } catch (err: any) {
            console.error('Fetch error:', err);
            // Don't show error if endpoint doesn't exist yet
            if (err.message !== 'Error al obtener movimientos') {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch accounts from the database
    const fetchAccounts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/fintoc/accounts`);

            if (!response.ok) {
                throw new Error('Error al obtener cuentas');
            }

            const data = await response.json();
            setAccounts(Array.isArray(data) ? data : data.accounts || []);
        } catch (err: any) {
            console.error('Fetch accounts error:', err);
        }
    };

    // Fetch on initial load
    useEffect(() => {
        fetchMovements();
        fetchAccounts();
    }, []);

    // Filter movements by selected account
    const filteredMovements = selectedAccount === 'all'
        ? movements
        : movements.filter(m => m.account_id === selectedAccount);

    // Pagination calculations
    const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedMovements = filteredMovements.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedAccount]);

    const generatePageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('ellipsis');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('ellipsis');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('ellipsis');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('ellipsis');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="container mx-auto p-6 pb-28 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted/50">
                        <ArrowLeftRight className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Movimientos
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Visualiza y administra las transacciones de tu cuenta bancaria
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Actualizando...' : 'Actualizar'}
                    </Button>
                </div>
            </div>

            {/* Sync Status */}
            <SyncStatus syncResult={syncResult} error={error} />

            {/* Account Filter */}
            <AccountFilter
                accounts={accounts}
                selectedAccount={selectedAccount}
                onAccountSelect={setSelectedAccount}
            />

            {/* Movements Table */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Transacciones</CardTitle>
                    <CardDescription className="text-base">
                        {filteredMovements.length} movimiento{filteredMovements.length !== 1 ? 's' : ''} encontrado{filteredMovements.length !== 1 ? 's' : ''}
                        {filteredMovements.length > itemsPerPage && (
                            <span> • Mostrando {startIndex + 1}-{Math.min(endIndex, filteredMovements.length)} de {filteredMovements.length}</span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-20 w-full" />
                            ))}
                        </div>
                    ) : filteredMovements.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Wallet className="h-16 w-16" />
                                </EmptyMedia>
                                <EmptyTitle>No se encontraron transacciones</EmptyTitle>
                                <EmptyDescription>
                                    No se encontraron transacciones. Haz click en <span className="font-bold">Refrescar</span> para actualizar tus transacciones desde tu cuenta bancaria.
                                </EmptyDescription>
                            </EmptyHeader>
                            <EmptyContent>
                                <Button
                                    variant="outline"
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    className="gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                    {isSyncing ? 'Actualizando...' : 'Actualizar'}
                                </Button>
                            </EmptyContent>
                        </Empty>
                    ) : (
                        <div className="space-y-4">
                            <MovementTable movements={paginatedMovements} accounts={accounts} />

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                                    <p className="text-sm text-muted-foreground">
                                        Página {currentPage} de {totalPages}
                                    </p>
                                    <Pagination>
                                        <PaginationContent className="flex-wrap justify-center">
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                                                    }}
                                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                />
                                            </PaginationItem>

                                            <div className="hidden sm:contents">
                                                {generatePageNumbers().map((page, index) => (
                                                    <PaginationItem key={index}>
                                                        {page === 'ellipsis' ? (
                                                            <PaginationEllipsis />
                                                        ) : (
                                                            <PaginationLink
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setCurrentPage(page as number);
                                                                }}
                                                                isActive={currentPage === page}
                                                                className="cursor-pointer"
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        )}
                                                    </PaginationItem>
                                                ))}
                                            </div>

                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                                    }}
                                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Statistics */}
            {filteredMovements.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Resumen Financiero</h2>
                    <SummaryStats movements={filteredMovements} />
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FintocWidget from "@/components/FintocWidget";
import {
  Plus,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Movement } from "@/lib/types";

const API_BASE_URL = 'https://platanus-grupo29-681510028004.us-central1.run.app';

// --- Types ---
interface BankAccount {
    id: string;
    name: string;
    institution_name?: string;
    holder_name?: string;
    account_type?: string;
    balance_available?: number;  // Real field from Fintoc API
    balance_current?: number;    // Real field from Fintoc API
    balance_limit?: number;      // Real field from Fintoc API
    currency?: string;
    last4?: string;
    account_number?: string;     // For extracting last4 digits
}

// --- Dummy Data for Visualization ---
// This mimics the data structure you'll eventually get, populated for the UI design
const DUMMY_ACCOUNTS: BankAccount[] = [
    { 
        id: "1", 
        name: "Main Checking", 
        institution_name: "Banco de Chile", 
        holder_name: "Ashik", 
        type: "checking", 
        balance: 2250.00, 
        currency: "USD",
        last4: "4521" 
    },
    { 
        id: "2", 
        name: "Savings Goal", 
        institution_name: "Santander", 
        holder_name: "Ashik", 
        type: "savings", 
        balance: 450.00, 
        currency: "USD",
        last4: "8832" 
    }
];

const formatCurrency = (amount: number) => {
    const numberString = new Intl.NumberFormat('es-CL', {
        style: 'decimal',
    }).format(amount);

    return <span className="font-display">${numberString}</span>;
};

export default function ConnectBankPage() {
    // --- State Management ---
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ accounts_synced: number; movements_synced: number } | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [hasExistingConnection, setHasExistingConnection] = useState(false);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

    // Movements state for income/expenses calculation
    const [movements, setMovements] = useState<Movement[]>([]);
    const [isLoadingMovements, setIsLoadingMovements] = useState(true);

    // --- Effects ---
    useEffect(() => {
        checkExistingConnection();
        fetchMovements();
    }, []);

    const checkExistingConnection = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/fintoc/accounts`);

            if (response.ok) {
                const data = await response.json();
                const fetchedAccounts = Array.isArray(data) ? data : (data.accounts || []);

                if (fetchedAccounts.length > 0) {
                    setHasExistingConnection(true);
                    // Use real data from API - extract last4 from account_number
                    setAccounts(fetchedAccounts.map((acc: any) => ({
                        ...acc,
                        last4: acc.account_number?.slice(-4) || '0000'
                    })));
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
            // Artificial delay to show off the skeleton loader (remove in prod)
            setTimeout(() => setIsLoading(false), 1000); 
        }
    };

    const fetchMovements = async () => {
        try {
            setIsLoadingMovements(true);
            const response = await fetch(`${API_BASE_URL}/fintoc/movements`);

            if (response.ok) {
                const data = await response.json();
                const fetchedMovements = Array.isArray(data) ? data : (data.movements || []);
                setMovements(fetchedMovements);
            } else {
                setMovements([]);
            }
        } catch (error) {
            console.error('Error fetching movements:', error);
            setMovements([]);
        } finally {
            setIsLoadingMovements(false);
        }
    };

    const handleBankConnected = async () => {
        try {
            setIsConnectModalOpen(false);
            setIsSyncing(true);
            setSyncError(null);

            const response = await fetch(`${API_BASE_URL}/fintoc/sync`, { method: 'POST' });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errorData.detail?.message || 'Sync failed');
            }

            const data = await response.json();
            setSyncResult(data);

            // Refresh data
            await checkExistingConnection();
            await fetchMovements(); // Also refresh movements after sync

        } catch (err: any) {
            setSyncError(err.message || 'Failed to sync data');
        } finally {
            setIsSyncing(false);
        }
    };

    // --- UI Helpers ---
    const totalBalance = accounts.reduce((acc, curr) => acc + (curr.balance_available || 0), 0);

    // Calculate 30-day balance change
    const get30DaysAgo = () => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    };

    const thirtyDaysAgo = get30DaysAgo();

    // Get movements from last 30 days
    const last30DaysMovements = movements.filter(m => m.post_date >= thirtyDaysAgo);

    // Calculate monthly income and expenses (for display cards)
    const getCurrentMonthRange = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const startDate = `${year}-${month}-01`;

        // Get last day of current month
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
        const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

        return { startDate, endDate };
    };

    const { startDate, endDate } = getCurrentMonthRange();

    const monthlyIncome = movements
        .filter(m => m.post_date >= startDate && m.post_date <= endDate && m.amount > 0)
        .reduce((sum, m) => sum + m.amount, 0);

    const monthlyExpenses = Math.abs(
        movements
            .filter(m => m.post_date >= startDate && m.post_date <= endDate && m.amount < 0)
            .reduce((sum, m) => sum + m.amount, 0)
    );

    // Calculate 30-day balance change percentage
    const last30DaysNetChange = last30DaysMovements.reduce((sum, m) => sum + m.amount, 0);
    const balance30DaysAgo = totalBalance - last30DaysNetChange;
    const balanceChangePercent = balance30DaysAgo !== 0
        ? (last30DaysNetChange / balance30DaysAgo) * 100
        : 0;

    return (
        <div className="min-h-screen bg-[#F2F4F6] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans pb-20">
            
            {/* Mobile Header */}
            <header className="bg-[#F2F4F6]/90 backdrop-blur-md px-6 py-6 mb-6 flex items-center justify-center">
                <h2 className="text-xl font-semibold tracking-wide">
                    Cuentas Bancarias
                </h2>
            </header>

            <main className="max-w-md mx-auto px-6 pt-2 space-y-8">
                {/* Section 1: Total Balance Card (Hero) */}
                <section>
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-lg font-medium text-zinc-400 dark:text-zinc-200 font-display">
                            Saldo Total
                        </h3>
                    </div>

                    {isLoading ? (
                        <div className="h-48 w-full bg-white dark:bg-zinc-900 rounded-4xl animate-pulse shadow-sm" />
                    ) : (
                        <div className="relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="w-full flex gap-3 items-center">
                                    <h1 className="text-4xl font-medium text-zinc-900 dark:text-white tracking-tight font-display">
                                        {hasExistingConnection ? formatCurrency(totalBalance) : '$0.00'}
                                    </h1>
                                    {/* 30-Day Balance Change Badge */}
                                    {isLoadingMovements ? (
                                        <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
                                    ) : hasExistingConnection && balance30DaysAgo !== 0 ? (
                                        <span className={cn(
                                            "text-xs px-2 py-[6px] h-fit rounded-full font-medium flex items-center gap-1 tracking-wide",
                                            balanceChangePercent > 0
                                                ? "bg-emerald-600 text-white"
                                                : balanceChangePercent < 0
                                                ? "bg-red-600 text-white"
                                                : "bg-zinc-400 text-white"
                                        )}>
                                            {balanceChangePercent > 0 ? '+' : ''}{balanceChangePercent.toFixed(2)}%
                                        </span>
                                    ) : null}
                                </div>
                                
                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    {/* Monthly Income Card */}
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Ingresos del Mes</span>
                                        </div>
                                        {isLoadingMovements ? (
                                            <div className="h-7 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                                        ) : (
                                            <p className="text-lg font-medium text-zinc-800 dark:text-zinc-100">
                                                {formatCurrency(monthlyIncome)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Monthly Expenses Card */}
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ArrowDownCircle className="h-4 w-4 text-red-500" />
                                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Egresos del Mes</span>
                                        </div>
                                        {isLoadingMovements ? (
                                            <div className="h-7 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                                        ) : (
                                            <p className="text-lg font-medium text-zinc-800 dark:text-zinc-100">
                                                {formatCurrency(monthlyExpenses)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Background decorative blob */}
                            <div className="absolute -top-20 -right-20 h-64 w-64 bg-teal-50 dark:bg-teal-900/10 rounded-full blur-3xl z-0" />
                        </div>
                    )}
                </section>

                {/* Section 2: Connected Banks List */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Bancos Conectados</h3>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setIsConnectModalOpen(true)}
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                        >
                            <Plus className="size-4" /> Agregar nuevo
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                             [1, 2].map((i) => (
                                <div key={i} className="h-24 w-full bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
                            ))
                        ) : hasExistingConnection ? (
                            <div className="grid gap-4">
                                {accounts.map((account, idx) => (
                                    <BankCard key={account.id || idx} account={account} index={idx} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState onConnect={() => setIsConnectModalOpen(true)} />
                        )}
                    </div>
                </section>

                {/* Sync Status Toasts/Indicators */}
                <AnimatePresence>
                    {isSyncing && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-6 left-6 right-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                                <div>
                                    <p className="font-bold text-sm tracking-wide">Sincronizando datos...</p>
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Obteniendo transacciones</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {syncResult && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-6 left-6 right-6 bg-emerald-500 text-white p-4 rounded-2xl shadow-xl z-50"
                            onClick={() => setSyncResult(null)} // Dismiss on click
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-full">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm tracking-wide">¡Sincronización exitosa!</p>
                                    <p className="text-xs text-emerald-100">
                                        {syncResult.movements_synced} movimientos cargados
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                     
                     {syncError && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-6 left-6 right-6 bg-red-500 text-white p-4 rounded-2xl shadow-xl z-50"
                            onClick={() => setSyncError(null)}
                        >
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5" />
                                <p className="font-bold text-sm">{syncError}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>

            {/* Connect Modal / Overlay */}
            <AnimatePresence>
                {isConnectModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
                    >
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-10 shadow-2xl"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                            </div>

                            <div className="text-center mb-8">
                                <div className="h-16 w-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Conecta tus bancos</h2>
                                <p className="text-zinc-500 mt-2">
                                    Conecta tu cuenta bancaria con Fintoc para obtener información financiera y recomendaciones personalizadas.
                                </p>
                            </div>

                            <div className="min-h-[200px] flex flex-col justify-center">
                                <FintocWidget
                                    onSuccess={handleBankConnected}
                                    onError={(error) => setSyncError(error)}
                                />
                            </div>

                            <Button 
                                variant="outline" 
                                className="w-full mt-4 h-12 rounded-xl border-zinc-200 hover:bg-zinc-50 font-medium"
                                onClick={() => setIsConnectModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            
                            <div className="flex justify-center items-center gap-2 mt-6 text-xs text-zinc-400">
                                <ShieldCheck className="h-3 w-3" />
                                <span>Seguridad de datos con Fintoc</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Sub-Components ---

function BankCard({ account, index }: { account: BankAccount, index: number }) {
    // Visual styling variants
    const variants = [
        "bg-zinc-900 text-white", // Dark Card
        "bg-teal-600 text-white", // Teal Card
        "bg-white text-zinc-900 border border-zinc-200", // White Card
    ];

    const styleClass = variants[index % variants.length];
    const isDark = index % 3 !== 2; 

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
        >
            <div className={cn("relative rounded-[1.5rem] p-5 shadow-sm overflow-hidden h-44 flex flex-col justify-between group", styleClass)}>
                {/* Top Row */}
                <div className="flex justify-between items-start">
                    <div>
                        <p className={cn("text-xs font-medium opacity-80 uppercase tracking-wider", isDark ? "text-white/70" : "text-zinc-500")}>
                            {account.institution_name || "Cuenta Bancaria"}
                        </p>
                        <p className="text-sm font-semibold mt-0.5 ">{account.name}</p>
                    </div>
                    <CreditCard className={cn("h-6 w-6 opacity-50", isDark ? "text-white" : "text-zinc-900")} />
                </div>

                {/* Middle Pattern (Decorative) */}
                <div className="absolute right-[-20px] bottom-[-20px] h-32 w-32 rounded-full border-20 border-white/5" />
                <div className="absolute left-[-20px] bottom-[40px] h-20 w-20 rounded-full border-10 border-white/5" />

                {/* Bottom Row */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold font-display tracking-wider">
                           **** {account.last4 || "0000"}
                        </span>
                    </div>
                    <div className="flex justify-between items-end">
                        <p className={cn("text-xs opacity-70", isDark ? "text-white" : "text-zinc-500")}>
                            {account.holder_name}
                        </p>
                        <p className="text-xl font-bold">
                            {formatCurrency(account.balance_available || 0)}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function EmptyState({ onConnect }: { onConnect: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-white dark:bg-zinc-900/50 rounded-[2rem] border border-dashed border-zinc-300 dark:border-zinc-700">
            <div className="h-14 w-14 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-7 w-7 text-zinc-400" />
            </div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Sin cuentas conectadas</h4>
            <p className="text-sm text-zinc-500 max-w-[200px] mt-1 mb-6">
                Conecta tus cuentas bancarias y sus movimientos
            </p>
            <Button onClick={onConnect} className="rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900">
                Conectar
            </Button>
        </div>
    );
}

"use client";

import FintocWidget from "@/components/FintocWidget";

export default function ConnectBankPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
                <div className="flex flex-col items-center gap-8 text-center">
                    <h1 className="text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
                        Connect Bank Account
                    </h1>
                    <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                        Connect your bank account securely using Fintoc to enable financial insights and personalized recommendations.
                    </p>
                    <div className="mt-4">
                        <FintocWidget />
                    </div>
                </div>
            </main>
        </div>
    );
}


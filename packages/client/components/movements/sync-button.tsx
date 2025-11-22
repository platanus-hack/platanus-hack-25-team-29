import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface SyncButtonProps {
  onSync: () => void;
  isSyncing: boolean;
  disabled?: boolean;
}

export function SyncButton({ onSync, isSyncing, disabled }: SyncButtonProps) {
  return (
    <Button 
      onClick={onSync} 
      disabled={isSyncing || disabled}
      size="lg"
      className="gap-2 shadow-md hover:shadow-lg transition-all"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing Data...' : 'Sync Data'}
    </Button>
  );
}


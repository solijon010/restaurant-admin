import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { branchService, BranchResponse } from '@/services/branchService';

const STORAGE_KEY = 'rms_selected_branch';

interface BranchContextType {
  branches: BranchResponse[];
  branchesLoading: boolean;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
}

const BranchContext = createContext<BranchContextType>({
  branches: [],
  branchesLoading: false,
  selectedBranchId: '',
  setSelectedBranchId: () => {},
});

function toArray(raw: unknown): BranchResponse[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    for (const k of ['data', 'items']) {
      if (Array.isArray(obj[k])) return obj[k] as BranchResponse[];
    }
  }
  return [];
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranchId, setSelectedBranchIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const { data: branchesRaw, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches-my'],
    queryFn: () => branchService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const branches = toArray(branchesRaw);

  // Auto-select first branch if none selected or saved one doesn't exist
  useEffect(() => {
    if (branches.length > 0) {
      const exists = branches.some(b => b.id === selectedBranchId);
      if (!selectedBranchId || !exists) {
        const first = branches[0].id;
        setSelectedBranchIdState(first);
        localStorage.setItem(STORAGE_KEY, first);
      }
    }
  }, [branches, selectedBranchId]);

  const setSelectedBranchId = useCallback((id: string) => {
    setSelectedBranchIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  }, []);

  return (
    <BranchContext.Provider value={{ branches, branchesLoading, selectedBranchId, setSelectedBranchId }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  return useContext(BranchContext);
}

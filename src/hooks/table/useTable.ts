"use client";

import { useState, useEffect, useCallback } from 'react';
import { TableState } from '@/types/table';

interface UseTableProps {
  id: string; // Unique ID for persistence
  initialLimit?: number;
  initialDensity?: 'compact' | 'default' | 'spacious';
}

export function useTable({ 
  id, 
  initialLimit = 10, 
  initialDensity = 'default' 
}: UseTableProps) {
  const storageKey = `table-state-${id}`;

  const [state, setState] = useState<TableState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            selectedIds: [], // Don't persist selection
          };
        } catch (e) {
          console.error('Error parsing table state from localStorage', e);
        }
      }
    }
    return {
      page: 1,
      limit: initialLimit,
      search: '',
      filters: {},
      selectedIds: [],
      density: initialDensity,
    };
  });

  // Persist state to localStorage (except selection)
  useEffect(() => {
    const persistableState = { ...state };
    // @ts-expect-error - we want to remove this property before persisting
    delete persistableState.selectedIds;
    localStorage.setItem(storageKey, JSON.stringify(persistableState));
  }, [state, storageKey]);

  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setState(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setState(prev => ({ ...prev, search, page: 1 }));
  }, []);

  const setFilters = useCallback((filters: Record<string, unknown>) => {
    setState(prev => ({ ...prev, filters, page: 1 }));
  }, []);

  const setSort = useCallback((sortBy: string, sortOrder?: 'asc' | 'desc') => {
    setState(prev => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder || (prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc')
    }));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedIds: prev.selectedIds.includes(id)
        ? prev.selectedIds.filter(i => i !== id)
        : [...prev.selectedIds, id]
    }));
  }, []);

  const toggleSelectAll = useCallback((ids: string[]) => {
    setState(prev => {
      const allSelected = ids.every(id => prev.selectedIds.includes(id));
      if (allSelected) {
        return {
          ...prev,
          selectedIds: prev.selectedIds.filter(id => !ids.includes(id))
        };
      } else {
        const newSelected = [...new Set([...prev.selectedIds, ...ids])];
        return {
          ...prev,
          selectedIds: newSelected
        };
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedIds: [] }));
  }, []);

  const setDensity = useCallback((density: 'compact' | 'default' | 'spacious') => {
    setState(prev => ({ ...prev, density }));
  }, []);

  return {
    ...state,
    setPage,
    setLimit,
    setSearch,
    setFilters,
    setSort,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    setDensity,
  };
}

export interface TableState {
  page: number;
  limit: number;
  search: string;
  filters: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  selectedIds: string[];
  density: 'compact' | 'default' | 'spacious';
}

export interface TablePaginationData {
  total: number;
  pageCount: number;
  page: number;
  limit: number;
}

export interface TableAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

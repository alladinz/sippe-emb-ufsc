import type { ProgramaStatus } from '../types/programaEnsino';

export const PROGRAMA_STATUS_LABEL: Record<ProgramaStatus, string> = {
  draft: 'Rascunho',
  pending_chefe: 'Aguardando Revisão da Chefia',
  submitted: 'Em Aprovação pelas Coordenações',
  approved: 'Aprovado',
  rejected: 'Devolvido',
  archived: 'Arquivado',
};

export const PROGRAMA_STATUS_COLORS: Record<ProgramaStatus, { bg: string; text: string; border: string; dot: string }> = {
  draft: {
    bg: 'bg-gray-100', text: 'text-gray-600',
    border: 'border-gray-200', dot: 'bg-gray-400'
  },
  pending_chefe: {
    bg: 'bg-purple-50', text: 'text-purple-700',
    border: 'border-purple-200', dot: 'bg-purple-400'
  },
  submitted: {
    bg: 'bg-yellow-50', text: 'text-yellow-700',
    border: 'border-yellow-200', dot: 'bg-yellow-400'
  },
  approved: {
    bg: 'bg-green-50', text: 'text-green-700',
    border: 'border-green-200', dot: 'bg-green-500'
  },
  rejected: {
    bg: 'bg-red-50', text: 'text-red-700',
    border: 'border-red-200', dot: 'bg-red-500'
  },
  archived: {
    bg: 'bg-blue-50', text: 'text-blue-700',
    border: 'border-blue-200', dot: 'bg-blue-500'
  },
};

export function getProgramaStatusBadge(status: ProgramaStatus) {
  return {
    label: PROGRAMA_STATUS_LABEL[status],
    colors: PROGRAMA_STATUS_COLORS[status],
  };
}

export function isProgramaEditable(
  status: ProgramaStatus,
  papel?: string
): boolean {
  if (status === 'draft') return true;
  // Chefe can edit pending_chefe before forwarding
  if (status === 'pending_chefe' && papel === 'chefe') return true;
  return false;
}

export function canSubmitPrograma(status: ProgramaStatus): boolean {
  return status === 'draft';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canArchivePrograma(status: ProgramaStatus): boolean {
  return false;
}

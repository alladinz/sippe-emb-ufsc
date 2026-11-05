"use client";

import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';
import { ProgramaPDF } from './ProgramaPDF';
import { toastError, toastSuccess } from '../../lib/swal';
import type { ProgramaEnsino } from '../../types/programaEnsino';

interface DownloadProgramaButtonProps {
  programa:   ProgramaEnsino;
  className?: string;
  children?:  React.ReactNode;
  variant?:   'primary' | 'outline';
}

export function DownloadProgramaButton({
  programa,
  className,
  children,
  variant = 'outline',
}: DownloadProgramaButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      let logoBlob: Blob | null = null;
      try {
        const response = await fetch('/brasao_UFSC.jpg');
        if (response.ok) {
          logoBlob = await response.blob();
        }
      } catch (e) {
        console.warn('Não foi possível carregar o brasão binário:', e);
      }

      const blob = await pdf(
        <ProgramaPDF programa={programa} logoBlob={logoBlob} />
      ).toBlob();

      const codigo = programa.codigo_disciplina ?? 'PROG';
      const nome = programa.nome_disciplina
        ?.replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30) ?? 'Programa';
      const filename = `ProgramaEnsino_${codigo}_${nome}.pdf`;

      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      toastSuccess('Programa de Ensino exportado em PDF.');

    } catch (error) {
      console.error('PDF generation error:', error);
      toastError(
        'Erro ao gerar o PDF. Tente novamente.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const primaryClass = `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors`;

  const outlineClass = `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors`;

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={className ?? (variant === 'primary' ? primaryClass : outlineClass)}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-[18px] h-[18px] animate-spin shrink-0 text-slate-500" />
          <span>Gerando PDF...</span>
        </>
      ) : children ? (
        children
      ) : (
        <>
          <Download className="w-[18px] h-[18px] shrink-0" />
          <span>Baixar PDF</span>
        </>
      )}
    </button>
  );
}

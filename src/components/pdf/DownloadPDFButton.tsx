"use client";

import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { PlanoPDF } from './PlanoPDF';
import { toastError, toastSuccess } from '@/lib/swal';

interface Course {
  id: string;
  name: string;
  code: string;
  workload: number | null;
  credits: number | null;
  classIdentifier: string | null;
}

interface Bibliography {
  id: string;
  author: string;
  title: string;
  year: number | null;
  publisher: string | null;
  isbn: string | null;
  type: string;
}

interface PlanoData {
  campus: string | null;
  center: string | null;
  courseName: string | null;
  semester: string | null;
  universityAcronym: string | null;
  organization?: { name: string };
  user?: { name: string };
  prerequisites: string | null;
  syllabus: string | null;
  objectives: string | null;
  programContent: string | null;
  methodology: string | null;
  evaluation: string | null;
  evaluationFormula: string | null;
  finalEvaluationRules: string | null;
  finalConsiderations: string | null;
  updatedAt: string | Date;
  courses: Course[];
  bibliography: Bibliography[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  weeklySchedule: any;
}

interface DownloadPDFButtonProps {
  plano: PlanoData;
  fileName?: string;
  className?: string;
  children?: React.ReactNode;
}

export function DownloadPDFButton({
  plano,
  fileName,
  className,
  children,
}: DownloadPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      // 1. Carrega a imagem como BLOB (Abordagem sugerida no Reddit/Docs)
      // Usamos o JPEG que criamos por ser mais leve e compatível
      let logoBlob: Blob | null = null;
      try {
        const response = await fetch('/brasao.jpg');
        if (response.ok) {
          logoBlob = await response.blob();
        }
      } catch (e) {
        console.warn('Não foi possível carregar o brasão binário:', e);
      }

      // 2. Gera o PDF passando o Blob diretamente
      const blob = await pdf(
        <PlanoPDF plano={plano} logoBlob={logoBlob} />
      ).toBlob();

      // Build filename
      const firstCourse = plano.courses?.[0];
      const codigo = firstCourse?.code ?? 'PLANO';
      const turma  = firstCourse?.classIdentifier ?? '';
      const sem    = plano.semester ?? '';
      
      const name   = fileName ??
        `PlanoEnsino_${codigo}_Turma${turma}_${sem}.pdf`
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_.-]/g, '');

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Release blob URL after download starts
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      toastSuccess('PDF gerado com sucesso.');

    } catch (error) {
      console.error('PDF generation error:', error);
      toastError(
        'Erro ao gerar o PDF. Tente novamente.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={className ?? `flex items-center gap-2
        px-4 py-2 text-sm font-medium rounded-lg
        border border-gray-200 text-gray-700
        hover:bg-gray-50 hover:border-gray-300
        disabled:opacity-60 disabled:cursor-not-allowed
        transition-colors duration-150`}
    >
      {isGenerating ? (
        <>
          <svg className="animate-spin w-4 h-4 text-gray-500"
            fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12"
              r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0
                 0 5.373 0 12h4z"/>
          </svg>
          Gerando PDF...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none"
            viewBox="0 0 24 24" stroke="currentColor"
            strokeWidth={1.8}>
            <path strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2
                 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2
                 0 01-2 2H5a2 2 0 01-2-2z"/>
          </svg>
          {children ?? 'Baixar PDF'}
        </>
      )}
    </button>
  );
}

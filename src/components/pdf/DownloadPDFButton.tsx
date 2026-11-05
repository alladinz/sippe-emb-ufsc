"use client";

import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';
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
        const response = await fetch('/brasao_UFSC.jpg');
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
        px-3 py-1.5 text-xs font-bold rounded-lg
        border border-slate-200 text-slate-700 bg-white
        hover:bg-slate-50
        disabled:opacity-60 disabled:cursor-not-allowed
        transition-colors duration-150`}
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

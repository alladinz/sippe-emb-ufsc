"use client";

import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { ProgramaPDF } from '@/components/pdf/ProgramaPDF';
import { DownloadProgramaButton } from '@/components/pdf/DownloadProgramaButton';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import type { ProgramaEnsino } from '@/types/programaEnsino';

interface ViewerClientProps {
  programa: ProgramaEnsino;
}

export function ProgramaEnsinoViewerClient({ programa }: ViewerClientProps) {
  const router = useRouter();

  const handleOpenPdf = async () => {
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(<ProgramaPDF programa={programa} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Top action bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/programas-ensino/${programa.id}`)}
            className="text-slate-600 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Edição
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-sm font-semibold text-slate-800">
              {programa.codigo_disciplina} - {programa.nome_disciplina}
            </h1>
            <p className="text-xs text-slate-500">Visualização do Documento PDF</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleOpenPdf} className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Nova Aba
          </Button>
          <DownloadProgramaButton programa={programa} variant="primary" />
        </div>
      </div>

      {/* PDF Viewer container */}
      <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-hidden">
        <div className="w-full h-full max-w-5xl mx-auto rounded-lg shadow-xl overflow-hidden bg-white border border-slate-200">
          <PDFViewer 
            width="100%" 
            height="100%" 
            className="border-none bg-slate-100"
            showToolbar={false}
          >
            <ProgramaPDF programa={programa} />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}

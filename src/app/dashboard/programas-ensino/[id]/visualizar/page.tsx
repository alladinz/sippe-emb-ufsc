import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';

import { getProgramaById } from '@/services/programaEnsinoService';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DownloadProgramaButton } from '@/components/pdf/DownloadProgramaButton';
import { getProgramaStatusBadge } from '@/utils/programaStatus';
import { tiptapToPlainText } from '@/components/pdf/pdfHelpers';
import { parseBoldMarkers } from '@/utils/bibliografiaUtils';
import { formatCursosVinculados } from '@/utils/courseUtils';

export const metadata: Metadata = {
  title: 'Visualizar Programa de Ensino | SIPPE',
};

function formatText(text?: string | null): string {
  if (!text) return "Não informado.";
  // Convert markdown **bold** to HTML <strong>
  // Prevent arbitrary HTML if any exists
  const safeText = text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  return safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function ViewerRichContent({
  content
}: { content?: string | null }) {
  if (!content || !content.trim()) {
    return (
      <p className="text-sm text-gray-400 italic">
        Não preenchido
      </p>
    );
  }

  // Detect content type
  const trimmed = content.trim();

  // Case 1: Tiptap JSON object
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const plainText = tiptapToPlainText(parsed);
      return (
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {plainText || (
            <span className="text-gray-400 italic">
              Não preenchido
            </span>
          )}
        </p>
      );
    } catch {
      // JSON parse failed — treat as plain text
    }
  }

  // Case 2: HTML string from rich text editor
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return (
      <div
        className="prose prose-sm max-w-none text-gray-800 leading-relaxed viewer-rich-content"
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }

  // Case 3: Plain text
  return (
    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
      {trimmed}
    </p>
  );
}

export default async function ProgramaEnsinoVisualizarPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const session = await auth.api.getSession();

  if (!session) {
    redirect("/login");
  }

  const programa = await getProgramaById(id);
  if (!programa) {
    notFound();
  }

  const statusInfo = getProgramaStatusBadge(programa.status);

  const basicas = (programa.bibliografia ?? [])
    .filter((b) => b.tipo === 'basica')
    .sort((a, b) => a.ordem - b.ordem);

  const complementares = (programa.bibliografia ?? [])
    .filter((b) => b.tipo === 'complementar')
    .sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 print-container">
      <div className="flex items-center justify-between no-print">
        <Link href={`/dashboard/programas-ensino/${id}`}>
          <button className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-slate-50 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para edição
          </button>
        </Link>
        <div className="flex items-center gap-4">
          <Badge className={cn(statusInfo.colors.bg, statusInfo.colors.text, statusInfo.colors.border, "border")}>
            {statusInfo.label}
          </Badge>
          <DownloadProgramaButton
            programa={programa}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar PDF
          </DownloadProgramaButton>
        </div>
      </div>

      <div className="bg-white p-12 shadow-lg border rounded-sm min-h-[1100px] font-serif text-slate-900 print:shadow-none print:border-0 print:p-0">
        
        {/* Header with Logo */}
        <header className="relative flex flex-col items-center mb-12 border-b pb-8">
          <div className="absolute left-0 top-0">
            <Image 
              src="/brasao_UFSC.svg" 
              alt="Brasão UFSC" 
              width={80} 
              height={80}
              className="object-contain"
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-sm font-bold uppercase">Universidade Federal de Santa Catarina</h1>
            <p className="text-xs font-semibold uppercase">CAMPUS Joinville</p>
            <p className="text-xs uppercase">Centro Tecnológico de Joinville - CTJ</p>
            <p className="text-xs font-bold mt-4 uppercase">PROGRAMA DE ENSINO</p>
          </div>
        </header>

        <section className="space-y-10">
          
          {/* I. IDENTIFICAÇÃO */}
          <div>
            <h4 className="font-bold mb-4 uppercase">I. IDENTIFICAÇÃO DA DISCIPLINA</h4>
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-xs border p-4 rounded-sm bg-slate-50/30">
              <p><span className="font-bold">Nome:</span> {programa.nome_disciplina}</p>
              <p><span className="font-bold">Código:</span> {programa.codigo_disciplina}</p>
              <p><span className="font-bold">Carga horária teórica:</span> {programa.carga_horaria_teorica || '-'} horas</p>
              <p><span className="font-bold">Carga horária prática:</span> {programa.carga_horaria_pratica || '-'} horas</p>
              <p><span className="font-bold">Carga horária de extensão:</span> {programa.carga_horaria_extensao || '-'} horas</p>
              <p><span className="font-bold">Carga horária total:</span> {programa.carga_horaria_total || '-'} horas</p>
              <p><span className="font-bold">Créditos teóricos:</span> {programa.creditos_teoricos || '-'}</p>
              <p><span className="font-bold">Créditos práticos:</span> {programa.creditos_praticos || '-'}</p>
              <p><span className="font-bold">Créditos de extensão:</span> {programa.creditos_extensao || '-'}</p>
              <p className="col-span-2 mt-2"><span className="font-bold">Cursos Vinculados:</span> {formatCursosVinculados(programa.cursos_vinculados)}</p>
            </div>
          </div>

          {/* II. EMENTA */}
          <div>
            <h4 className="font-bold mb-3 uppercase">II. EMENTA</h4>
            <div 
              className="text-xs whitespace-pre-wrap leading-relaxed text-justify prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatText(programa.ementa) }}
            />
          </div>

          {/* III. OBJETIVOS */}
          <div>
            <h4 className="font-bold mb-3 uppercase">III. OBJETIVOS</h4>
            <div className="text-xs text-justify">
              <ViewerRichContent content={programa.objetivos} />
            </div>
          </div>

          {/* IV. CONTEÚDO PROGRAMÁTICO */}
          <div>
            <h4 className="font-bold mb-3 uppercase">IV. CONTEÚDO PROGRAMÁTICO</h4>
            <div className="text-xs pl-4 border-l-2 border-slate-100">
              <ViewerRichContent content={programa.conteudo_programatico} />
            </div>
          </div>

          {/* V. CRITÉRIOS DE AVALIAÇÃO */}
          <div>
            <h4 className="font-bold mb-3 uppercase">V. CRITÉRIOS INSTITUCIONAIS DE AVALIAÇÃO</h4>
            <div className="text-xs text-justify">
              <ViewerRichContent content={programa.criterios_avaliacao} />
            </div>
          </div>

          {/* VI. BIBLIOGRAFIA */}
          {(basicas.length > 0 || complementares.length > 0) && (
            <div>
              <h4 className="font-bold mb-3 uppercase">VI. REFERÊNCIAS BIBLIOGRÁFICAS</h4>
              
              {basicas.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-xs font-bold mb-2">Bibliografia Básica</h5>
                  <ul className="space-y-4">
                    {basicas.map((item) => (
                      <li key={item.id} className="text-xs text-justify">
                        {parseBoldMarkers(item.referencia).map((seg, segI) =>
                          seg.isBold ? <strong key={segI} className="font-semibold">{seg.text}</strong> : <span key={segI}>{seg.text}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {complementares.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold mb-2">Bibliografia Complementar</h5>
                  <ul className="space-y-4">
                    {complementares.map((item) => (
                      <li key={item.id} className="text-xs text-justify">
                        {parseBoldMarkers(item.referencia).map((seg, segI) =>
                          seg.isBold ? <strong key={segI} className="font-semibold">{seg.text}</strong> : <span key={segI}>{seg.text}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </section>
      </div>
    </div>
  );
}

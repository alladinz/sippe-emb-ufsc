import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { programasEnsino } from '@/db/schema_programas';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DownloadProgramaButton } from '@/components/pdf/DownloadProgramaButton';
import type { ProgramaEnsino } from '@/types/programaEnsino';
import { getProgramaStatusBadge } from '@/utils/programaStatus';

export const metadata: Metadata = {
  title: 'Visualizar Programa de Ensino | SIPPE',
};

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

  const programaRow = await db.select().from(programasEnsino).where(eq(programasEnsino.id, id)).limit(1);
  if (!programaRow || programaRow.length === 0) {
    notFound();
  }

  const programa = programaRow[0] as unknown as ProgramaEnsino;
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
              <p><span className="font-bold">Carga horária total:</span> {programa.carga_horaria_total || '-'} horas</p>
              <p><span className="font-bold">Créditos teóricos:</span> {programa.creditos_teoricos || '-'}</p>
              <p><span className="font-bold">Créditos práticos:</span> {programa.creditos_praticos || '-'}</p>
              <p className="col-span-2 mt-2"><span className="font-bold">Cursos Vinculados:</span> {programa.cursos_vinculados?.length ? programa.cursos_vinculados.join(', ') : '-'}</p>
            </div>
          </div>

          {/* II. EMENTA */}
          <div>
            <h4 className="font-bold mb-3 uppercase">II. EMENTA</h4>
            <div 
              className="text-xs leading-relaxed text-justify prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: programa.ementa || "Não informada." }}
            />
          </div>

          {/* III. OBJETIVOS */}
          <div>
            <h4 className="font-bold mb-3 uppercase">III. OBJETIVOS</h4>
            <div 
              className="text-xs leading-relaxed text-justify prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: programa.objetivos || "Não informados." }}
            />
          </div>

          {/* IV. CONTEÚDO PROGRAMÁTICO */}
          <div>
            <h4 className="font-bold mb-3 uppercase">IV. CONTEÚDO PROGRAMÁTICO</h4>
            <div 
              className="text-xs whitespace-pre-wrap leading-relaxed pl-4 border-l-2 border-slate-100 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: programa.conteudo_programatico || "Não informado." }}
            />
          </div>

          {/* V. CRITÉRIOS DE AVALIAÇÃO */}
          <div>
            <h4 className="font-bold mb-3 uppercase">V. CRITÉRIOS INSTITUCIONAIS DE AVALIAÇÃO</h4>
            <div 
              className="text-xs leading-relaxed text-justify prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: programa.criterios_avaliacao || "Não informados." }}
            />
          </div>

          {/* VI. BIBLIOGRAFIA */}
          {(basicas.length > 0 || complementares.length > 0) && (
            <div>
              <h4 className="font-bold mb-3 uppercase">VI. REFERÊNCIAS BIBLIOGRÁFICAS</h4>
              
              {basicas.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-xs font-bold mb-2">Bibliografia Básica</h5>
                  <ul className="space-y-2">
                    {basicas.map((item, i) => (
                      <li key={item.id} className="text-xs flex gap-2">
                        <span className="w-6 shrink-0">[{i + 1}]</span>
                        <span>{item.referencia}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {complementares.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold mb-2">Bibliografia Complementar</h5>
                  <ul className="space-y-2">
                    {complementares.map((item, i) => (
                      <li key={item.id} className="text-xs flex gap-2">
                        <span className="w-6 shrink-0">[{i + 1}]</span>
                        <span>{item.referencia}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ASSINATURAS */}
          <div className="pt-24 pb-8 grid grid-cols-2 gap-12">
            <div className="text-center">
              <div className="border-t border-slate-800 pt-2 text-xs font-bold">Chefe de Departamento</div>
              {programa.criador?.nome && (
                <div className="text-xs mt-1">{programa.criador.nome}</div>
              )}
            </div>
            <div className="text-center">
              <div className="border-t border-slate-800 pt-2 text-xs font-bold">Coordenação de Curso</div>
              {programa.curso_aprovacao && (
                <div className="text-xs mt-1">{programa.curso_aprovacao}</div>
              )}
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}

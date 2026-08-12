import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { programasEnsino } from '@/db/schema_programas';
import { ProgramaEnsinoViewerClient } from './_components/ProgramaEnsinoViewerClient';
import type { ProgramaEnsino } from '@/types/programaEnsino';

export const metadata: Metadata = {
  title: 'Visualizar Programa de Ensino | SIPPE',
};

export default async function ProgramaEnsinoVisualizarPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const programaRow = await db.select().from(programasEnsino).where(eq(programasEnsino.id, id)).limit(1);
  if (!programaRow || programaRow.length === 0) {
    notFound();
  }

  const programa = programaRow[0] as unknown as ProgramaEnsino;

  return <ProgramaEnsinoViewerClient programa={programa} />;
}

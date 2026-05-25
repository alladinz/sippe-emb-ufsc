import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#0f172a',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 20,
    position: 'relative',
  },
  logo: {
    width: 60,
    height: 60,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  headerText: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    marginBottom: 2,
  },
  planTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  identificationBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 10,
    flexDirection: 'column',
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
  },
  content: {
    fontSize: 10,
    textAlign: 'justify',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
  },
  tableColHeader: {
    backgroundColor: '#f8fafc',
    borderRightColor: '#e2e8f0',
    borderRightWidth: 1,
    padding: 5,
  },
  tableCol: {
    borderRightColor: '#e2e8f0',
    borderRightWidth: 1,
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 8,
    textAlign: 'justify',
  },
  formulaBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 4,
    textAlign: 'center',
    marginTop: 10,
  },
  formulaTitle: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 4,
  },
  formulaText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 50,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
});

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

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
  title: string;
  type: string;
}

interface WeeklySchedule {
  week: number;
  class1?: { number: number; content: string | null };
  class2?: { number: number; content: string | null };
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
  updatedAt: string | Date;
  courses: Course[];
  bibliography: Bibliography[];
  weeklySchedule: WeeklySchedule[];
}

interface PlanoPDFProps {
  plano: PlanoData;
}

export const PlanoPDF = ({ plano }: PlanoPDFProps) => {
  if (!plano) {
    return (
      <Document title="Plano de Ensino">
        <Page size="A4" style={styles.page}>
          <Text>Dados do plano não disponíveis.</Text>
        </Page>
      </Document>
    );
  }

  const hasMoreThanOneDay = Array.isArray(plano.weeklySchedule) && plano.weeklySchedule.length > 0 && !!plano.weeklySchedule[0].class2;

  return (
    <Document title={`Plano de Ensino - ${plano.semester || ''}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* @ts-expect-error - Image in @react-pdf doesn't have alt but accessibility rules expect it */}
          <Image
            src="/brasao_UFSC.svg"
            style={styles.logo}
            alt="Brasão UFSC"
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>UNIVERSIDADE FEDERAL DE SANTA CATARINA</Text>
            <Text style={styles.subtitle}>{plano.campus || 'JOINVILLE'}</Text>
            <Text style={styles.subtitle}>{plano.center || 'CENTRO TECNOLÓGICO DE JOINVILLE'}</Text>
            <Text style={styles.subtitle}>{plano.courseName || plano.organization?.name || ''}</Text>
            <Text style={styles.planTitle}>PLANO DE ENSINO - {plano.semester || ''}</Text>
            <Text style={styles.subtitle}>{plano.universityAcronym || 'UFSC'}</Text>
          </View>
        </View>

        {/* I. IDENTIFICAÇÃO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I. IDENTIFICAÇÃO DA DISCIPLINA</Text>
          <View style={styles.identificationBox}>
            {plano.courses?.map((course, index) => (
              <View key={course.id || index} style={{ marginBottom: 5 }}>
                <View style={styles.row}>
                  <Text style={styles.label}>Nome: </Text>
                  <Text>{course.name}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Código: </Text>
                  <Text>{course.code}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Carga horária: </Text>
                  <Text>{course.workload ? `${course.workload} horas` : '-'}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Créditos: </Text>
                  <Text>{course.credits || '-'}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Turma(s): </Text>
                  <Text>{course.classIdentifier || '-'}</Text>
                </View>
              </View>
            ))}
            <View style={styles.row}>
              <Text style={styles.label}>Professor(es): </Text>
              <Text>{plano.user?.name || ''}</Text>
            </View>
          </View>
        </View>

        {/* II. PRÉ-REQUISITOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>II. PRÉ-REQUISITOS</Text>
          <Text style={styles.content}>
            {plano.prerequisites || 'Não há pré-requisitos cadastrados.'}
          </Text>
        </View>

        {/* III. EMENTA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>III. EMENTA</Text>
          <Text style={styles.content}>
            {stripHtml(plano.syllabus) || 'Não informada.'}
          </Text>
        </View>

        {/* IV. OBJETIVOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IV. OBJETIVOS</Text>
          <Text style={styles.content}>
            {stripHtml(plano.objectives) || 'Não informados.'}
          </Text>
        </View>

        {/* V. CONTEÚDO PROGRAMÁTICO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>V. CONTEÚDO PROGRAMÁTICO</Text>
          <Text style={styles.content}>
            {stripHtml(plano.programContent) || 'Não informado.'}
          </Text>
        </View>

        {/* VI. METODOLOGIA DE ENSINO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VI. METODOLOGIA DE ENSINO / DESENVOLVIMENTO DO PROGRAMA</Text>
          <Text style={styles.content}>
            {stripHtml(plano.methodology) || 'Não informada.'}
          </Text>
        </View>

        {/* VII. METODOLOGIA DE AVALIAÇÃO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VII. METODOLOGIA DE AVALIAÇÃO</Text>
          <Text style={styles.content}>{plano.evaluation || 'Não informada.'}</Text>
          {plano.evaluationFormula && (
            <View style={styles.formulaBox}>
              <Text style={styles.formulaTitle}>Fórmula de Cálculo</Text>
              <Text style={styles.formulaText}>{plano.evaluationFormula}</Text>
            </View>
          )}
        </View>

        {/* VIII. AVALIAÇÃO FINAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VIII. AVALIAÇÃO FINAL</Text>
          <Text style={styles.content}>
            {plano.finalEvaluationRules ? plano.finalEvaluationRules.replace(/\*\*/g, '') : 'Conforme resoluções vigentes da Universidade.'}
          </Text>
        </View>

        {/* IX. CRONOGRAMA */}
        <View style={styles.section} break>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>IX. CRONOGRAMA DE AULAS</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableColHeader, { width: '10%' }]}>
                <Text style={styles.tableCellHeader}>Semana</Text>
              </View>
              <View style={[styles.tableColHeader, { width: '10%' }]}>
                <Text style={styles.tableCellHeader}>Aula</Text>
              </View>
              <View style={[styles.tableColHeader, { flex: 1 }]}>
                <Text style={[styles.tableCellHeader, { textAlign: 'left' }]}>Conteúdo</Text>
              </View>
              {hasMoreThanOneDay && (
                <>
                  <View style={[styles.tableColHeader, { width: '10%' }]}>
                    <Text style={styles.tableCellHeader}>Aula</Text>
                  </View>
                  <View style={[styles.tableColHeader, { flex: 1 }]}>
                    <Text style={[styles.tableCellHeader, { textAlign: 'left' }]}>Conteúdo</Text>
                  </View>
                </>
              )}
            </View>
            {Array.isArray(plano.weeklySchedule) && plano.weeklySchedule.length > 0 ? (
              plano.weeklySchedule.map((week, idx) => (
                <View key={idx} style={styles.tableRow} wrap={false}>
                  <View style={[styles.tableCol, { width: '10%', backgroundColor: '#f8fafc' }]}>
                    <Text style={[styles.tableCell, { textAlign: 'center' }]}>{week.week}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '10%' }]}>
                    <Text style={[styles.tableCell, { textAlign: 'center' }]}>{week.class1?.number || ''}</Text>
                  </View>
                  <View style={[styles.tableCol, { flex: 1 }]}>
                    <Text style={[styles.tableCell, { fontStyle: 'italic' }]}>{week.class1?.content || '-'}</Text>
                  </View>
                  {hasMoreThanOneDay && (
                    <>
                      <View style={[styles.tableCol, { width: '10%' }]}>
                        <Text style={[styles.tableCell, { textAlign: 'center' }]}>{week.class2?.number || ''}</Text>
                      </View>
                      <View style={[styles.tableCol, { flex: 1 }]}>
                        <Text style={[styles.tableCell, { fontStyle: 'italic' }]}>{week.class2?.content || '-'}</Text>
                      </View>
                    </>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <View style={[styles.tableCol, { flex: 1, padding: 20 }]}>
                  <Text style={[styles.tableCell, { textAlign: 'center', color: '#94a3b8' }]}>Cronograma não detalhado.</Text>
                </View>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 7, color: '#64748b', fontStyle: 'italic', marginTop: 5 }}>
            * O cronograma está sujeito a alterações conforme o andamento da disciplina.
          </Text>
        </View>

        {/* X & XI. BIBLIOGRAFIA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>X. BIBLIOGRAFIA BÁSICA</Text>
          {plano.bibliography?.filter(b => b.type === 'basic').length > 0 ? (
            plano.bibliography
              .filter(b => b.type === 'basic')
              .map((b, i) => (
                <Text key={b.id || i} style={[styles.content, { marginLeft: 10, marginBottom: 2 }]}>
                  {i + 1}. {b.title}
                </Text>
              ))
          ) : (
            <Text style={[styles.content, { fontStyle: 'italic', color: '#94a3b8' }]}>Nenhuma informada.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>XI. BIBLIOGRAFIA COMPLEMENTAR</Text>
          {plano.bibliography?.filter(b => b.type === 'complementary').length > 0 ? (
            plano.bibliography
              .filter(b => b.type === 'complementary')
              .map((b, i) => (
                <Text key={b.id || i} style={[styles.content, { marginLeft: 10, marginBottom: 2 }]}>
                  {i + 1}. {b.title}
                </Text>
              ))
          ) : (
            <Text style={[styles.content, { fontStyle: 'italic', color: '#94a3b8' }]}>Nenhuma informada.</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Atualizado em: {new Date(plano.updatedAt).toLocaleDateString('pt-BR')} às {new Date(plano.updatedAt).toLocaleTimeString('pt-BR')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

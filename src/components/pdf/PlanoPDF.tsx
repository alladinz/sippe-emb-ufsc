import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#000000',
  },
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 15,
  },
  headerLine: {
    fontSize: 9,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  headerLineBold: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  identificationGrid: {
    borderWidth: 1,
    borderColor: '#000000',
    padding: 8,
    flexDirection: 'column',
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  gridCell: {
    flex: 1,
    flexDirection: 'row',
  },
  label: {
    fontFamily: 'Helvetica-Bold',
    marginRight: 4,
  },
  text: {
    fontSize: 10,
  },
  paragraph: {
    fontSize: 10,
    textAlign: 'justify',
    marginBottom: 8,
  },
  formulaBox: {
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'dashed',
    padding: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  formulaTitle: {
    fontSize: 8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  formulaText: {
    fontSize: 11,
    fontFamily: 'Courier-Bold',
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

  return (
    <Document title={`Plano de Ensino - ${plano.semester || ''}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerLine}>Universidade Federal de Santa Catarina</Text>
          <Text style={styles.headerLine}>{String(plano.campus || 'JOINVILLE')}</Text>
          <Text style={styles.headerLine}>{String(plano.center || 'CENTRO TECNOLÓGICO DE JOINVILLE')}</Text>
          <Text style={styles.headerLine}>{String(plano.courseName || plano.organization?.name || '')}</Text>
          <Text style={styles.headerLineBold}>PLANO DE ENSINO - {String(plano.semester || '')}</Text>
          <Text style={styles.headerLineBold}>{String(plano.universityAcronym || 'UFSC')}</Text>
        </View>

        {/* I. IDENTIFICAÇÃO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I. IDENTIFICAÇÃO DA DISCIPLINA</Text>
          <View style={styles.identificationGrid}>
            {plano.courses?.map((course, index) => (
              <View key={course.id || index}>
                <View style={styles.gridRow}>
                  <View style={styles.gridCell}>
                    <Text style={styles.label}>Nome:</Text>
                    <Text style={styles.text}>{String(course.name || '-')}</Text>
                  </View>
                  <View style={[styles.gridCell, { flex: 0.4 }]}>
                    <Text style={styles.label}>Código:</Text>
                    <Text style={styles.text}>{String(course.code || '-')}</Text>
                  </View>
                </View>
                <View style={styles.gridRow}>
                  <View style={styles.gridCell}>
                    <Text style={styles.label}>Carga horária:</Text>
                    <Text style={styles.text}>{course.workload ? `${course.workload} horas` : '-'}</Text>
                  </View>
                  <View style={[styles.gridCell, { flex: 0.4 }]}>
                    <Text style={styles.label}>Créditos:</Text>
                    <Text style={styles.text}>{String(course.credits || '-')}</Text>
                  </View>
                </View>
                <View style={styles.gridRow}>
                  <View style={styles.gridCell}>
                    <Text style={styles.label}>Turma(s):</Text>
                    <Text style={styles.text}>{String(course.classIdentifier || '-')}</Text>
                  </View>
                </View>
              </View>
            ))}
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.label}>Professor(es):</Text>
                <Text style={styles.text}>{String(plano.user?.name || '')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* II. PRÉ-REQUISITOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>II. PRÉ-REQUISITOS</Text>
          <Text style={styles.paragraph}>
            {String(plano.prerequisites || 'Não há pré-requisitos cadastrados.')}
          </Text>
        </View>

        {/* III. EMENTA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>III. EMENTA</Text>
          <Text style={styles.paragraph}>
            {String(stripHtml(plano.syllabus) || 'Não informada.')}
          </Text>
        </View>

        {/* IV. OBJETIVOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IV. OBJETIVOS</Text>
          <Text style={styles.paragraph}>
            {String(stripHtml(plano.objectives) || 'Não informados.')}
          </Text>
        </View>

        {/* V. CONTEÚDO PROGRAMÁTICO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>V. CONTEÚDO PROGRAMÁTICO</Text>
          <Text style={styles.paragraph}>
            {String(stripHtml(plano.programContent) || 'Não informado.')}
          </Text>
        </View>

        {/* VI. METODOLOGIA DE ENSINO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VI. METODOLOGIA DE ENSINO / DESENVOLVIMENTO DO PROGRAMA</Text>
          <Text style={styles.paragraph}>
            {String(stripHtml(plano.methodology) || 'Não informada.')}
          </Text>
        </View>

        {/* VII. METODOLOGIA DE AVALIAÇÃO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VII. METODOLOGIA DE AVALIAÇÃO</Text>
          <Text style={styles.paragraph}>{String(plano.evaluation || 'Não informada.')}</Text>
          {plano.evaluationFormula && (
            <View style={styles.formulaBox}>
              <Text style={styles.formulaTitle}>Fórmula de Cálculo da Média</Text>
              <Text style={styles.formulaText}>{String(plano.evaluationFormula)}</Text>
            </View>
          )}
        </View>

        {/* VIII. AVALIAÇÃO FINAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VIII. AVALIAÇÃO FINAL</Text>
          <Text style={styles.paragraph}>
            {plano.finalEvaluationRules ? String(plano.finalEvaluationRules).replace(/\*\*/g, '') : 'Conforme resoluções vigentes da Universidade.'}
          </Text>
          {plano.finalConsiderations && (
            <Text style={styles.paragraph}>
              {String(stripHtml(plano.finalConsiderations))}
            </Text>
          )}
        </View>

        <View>
            <Text style={{ marginTop: 20, color: 'gray', fontSize: 8 }}>
                Fim do teste de restauração parcial (Seções II - VIII).
            </Text>
        </View>
      </Page>
    </Document>
  );
};

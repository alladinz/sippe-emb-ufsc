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
    fontFamily: 'Times-Roman',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 15,
  },
  logo: {
    width: 72,
    height: 100,
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLine: {
    fontSize: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  headerLineBold: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  identificationGrid: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
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
    fontFamily: 'Times-Bold',
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
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#000000',
    borderBottomWidth: 1,
  },
  tableColHeader: {
    backgroundColor: '#f1f1f1',
    borderRightColor: '#000000',
    borderRightWidth: 1,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCol: {
    borderRightColor: '#000000',
    borderRightWidth: 1,
    padding: 4,
  },
  tableCellHeader: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 8,
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
  },
  tableCellItalic: {
    fontSize: 8,
    fontFamily: 'Times-Italic',
    textAlign: 'justify',
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
  list: {
    marginLeft: 15,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  listBullet: {
    width: 20,
    fontSize: 10,
  },
  listContent: {
    flex: 1,
    fontSize: 10,
    textAlign: 'justify',
  },
  footer: {
    marginTop: 30,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
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
  logoBlob: Blob | null;
}

export const PlanoPDF = ({ plano, logoBlob }: PlanoPDFProps) => {
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

  const renderBibliography = (item: Bibliography) => {
    const parts = [
      item.author,
      item.title,
      item.publisher,
      item.year,
      item.isbn ? `ISBN: ${item.isbn}` : null
    ].filter(Boolean);
    return parts.join(', ') + '.';
  };

  const formatDate = (date: string | Date) => {
    try {
      if (!date) return '';
      return new Date(date).toLocaleDateString('pt-BR') + ' às ' + new Date(date).toLocaleTimeString('pt-BR');
    } catch {
      return '';
    }
  };

  const renderTextWithBold = (text: string) => {
    if (!text) return null;
    const parts = String(text).split('**');
    return (
      <Text>
        {parts.map((part, i) => (
          <Text key={i} style={i % 2 === 1 ? { fontFamily: 'Times-Bold' } : {}}>
            {part}
          </Text>
        ))}
      </Text>
    );
  };

  return (
    <Document title={`Plano de Ensino - ${plano.semester || ''}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {logoBlob ? (
            /* eslint-disable-next-line jsx-a11y/alt-text */
            <Image
              cache
              src={logoBlob}
              style={styles.logo}
            />
          ) : (
             <View style={styles.logo} />
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerLineBold}>Universidade Federal de Santa Catarina</Text>
            <Text style={styles.headerLine}>CAMPUS JOINVILLE</Text>
            <Text style={styles.headerLine}>{String(plano.center || 'CENTRO TECNOLÓGICO DE JOINVILLE - CTJ')}</Text>
            <Text style={styles.headerLine}>{String(plano.courseName || plano.organization?.name || '')}</Text>
            <Text style={styles.headerLine}>SEMESTRE - {String(plano.semester || '')}</Text>
          </View>
        </View>

        {/* I. IDENTIFICAÇÃO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I. IDENTIFICAÇÃO DA DISCIPLINA</Text>
          <View style={styles.identificationGrid}>
            {plano.courses?.map((course, index) => (
              <View key={course.id || index} style={{ marginBottom: 5 }}>
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
          <View style={styles.paragraph}>
            {renderTextWithBold(plano.finalEvaluationRules || 'Conforme resoluções vigentes da Universidade.')}
          </View>
          {plano.finalConsiderations && (
            <Text style={styles.paragraph}>
              {String(stripHtml(plano.finalConsiderations))}
            </Text>
          )}
        </View>

        {/* IX. CRONOGRAMA */}
        <View style={styles.section} break>
          <Text style={styles.sectionTitle}>IX. CRONOGRAMA DE AULAS</Text>
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              plano.weeklySchedule.map((week: any, idx: number) => (
                <View key={idx} style={styles.tableRow} wrap={false}>
                  <View style={[styles.tableCol, { width: '10%', backgroundColor: '#f9f9f9', alignItems: 'center' }]}>
                    <Text style={styles.tableCellBold}>{String(week.week)}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '10%', alignItems: 'center' }]}>
                    <Text style={styles.tableCell}>{String(week.class1?.number || '')}</Text>
                  </View>
                  <View style={[styles.tableCol, { flex: 1 }]}>
                    <Text style={styles.tableCellItalic}>{String(week.class1?.content || '-')}</Text>
                  </View>
                  {hasMoreThanOneDay && (
                    <>
                      <View style={[styles.tableCol, { width: '10%', alignItems: 'center' }]}>
                        <Text style={styles.tableCell}>{String(week.class2?.number || '')}</Text>
                      </View>
                      <View style={[styles.tableCol, { flex: 1 }]}>
                        <Text style={styles.tableCellItalic}>{String(week.class2?.content || '-')}</Text>
                      </View>
                    </>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <View style={[styles.tableCol, { flex: 1, padding: 10 }]}>
                  <Text style={[styles.tableCell, { textAlign: 'center' }]}>Cronograma não detalhado.</Text>
                </View>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 7, color: '#333333', fontFamily: 'Times-Italic', marginTop: 5 }}>
            * O cronograma está sujeito a alterações conforme o andamento da disciplina.
          </Text>
        </View>

        {/* X. BIBLIOGRAFIA BÁSICA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>X. BIBLIOGRAFIA BÁSICA</Text>
          {plano.bibliography?.filter(b => b.type === 'basic').length > 0 ? (
            plano.bibliography.filter(b => b.type === 'basic').map((b, i) => (
              <View key={b.id || i} style={styles.listItem}>
                <Text style={styles.listBullet}>{i + 1}.</Text>
                <Text style={styles.listContent}>{String(renderBibliography(b))}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.paragraph, { fontFamily: 'Times-Italic' }]}>Nenhuma informada.</Text>
          )}
        </View>

        {/* XI. BIBLIOGRAFIA COMPLEMENTAR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>XI. BIBLIOGRAFIA COMPLEMENTAR</Text>
          {plano.bibliography?.filter(b => b.type === 'complementary').length > 0 ? (
            plano.bibliography.filter(b => b.type === 'complementary').map((b, i) => (
              <View key={b.id || i} style={styles.listItem}>
                <Text style={styles.listBullet}>{i + 1}.</Text>
                <Text style={styles.listContent}>{String(renderBibliography(b))}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.paragraph, { fontFamily: 'Times-Italic' }]}>Nenhuma informada.</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Atualizado em: {formatDate(plano.updatedAt)}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

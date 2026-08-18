import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { resolveContent, parseBoldMarkers } from './pdfHelpers';
import type { ProgramaEnsino } from '../../types/programaEnsino';

// Exact same styles as PlanoPDF to ensure identical format
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#000000',
    // Global constraint to prevent horizontal overflow in nested items
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    borderBottomWidth: 1.5,
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
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    borderRadius: 4,
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
  bibSection: {
    marginBottom: 8,
  },
  bibTypeLabel: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    marginBottom: 4,
  },
  bibItem: {
    marginBottom: 4,
    flexDirection: 'row',
    width: 470, // explicitly restrict width to avoid right overflow
  },
  bibNumber: {
    width: 25,
    fontSize: 10,
  },
  bibText: {
    flex: 1,
    fontSize: 10,
    textAlign: 'justify',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  signatureItem: {
    flex: 1,
    alignItems: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    width: '80%',
    paddingTop: 5,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
  },
  signatureName: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: '#e5e5e5',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
  },
});

export interface ProgramaPDFProps {
  programa: ProgramaEnsino;
  logoBlob?: Blob | null;
}

export function ProgramaPDF({ programa, logoBlob }: ProgramaPDFProps) {
  if (!programa) {
    return (
      <Document title="Programa de Ensino">
        <Page size="A4" style={styles.page}>
          <Text>Dados do programa não disponíveis.</Text>
        </Page>
      </Document>
    );
  }

  const basicas = (programa.bibliografia ?? [])
    .filter((b) => b.tipo === 'basica')
    .sort((a, b) => a.ordem - b.ordem);

  const complementares = (programa.bibliografia ?? [])
    .filter((b) => b.tipo === 'complementar')
    .sort((a, b) => a.ordem - b.ordem);

  const renderTextWithBold = (text: string) => {
    if (!text) return null;
    const parts = String(text).split('**');
    return (
      <Text style={styles.paragraph}>
        {parts.map((part, i) => (
          <Text key={i} style={{ fontFamily: i % 2 === 1 ? 'Times-Bold' : 'Times-Roman' }}>
            {part}
          </Text>
        ))}
      </Text>
    );
  };

  return (
    <Document
      title={`Programa de Ensino - ${programa.codigo_disciplina ?? ''}`}
      subject="Programa de Ensino UFSC CTJ"
      author="SIPPE"
      creator="SIPPE"
    >
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
            <Text style={styles.headerLine}>CENTRO TECNOLÓGICO DE JOINVILLE - CTJ</Text>
            <Text style={styles.headerLine}>PROGRAMA DE ENSINO</Text>
          </View>
        </View>

        {/* I. IDENTIFICAÇÃO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I. IDENTIFICAÇÃO DA DISCIPLINA</Text>
          <View style={styles.identificationGrid}>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.label}>Nome:</Text>
                <Text style={styles.text}>{String(programa.nome_disciplina || '-')}</Text>
              </View>
              <View style={[styles.gridCell, { flex: 0.6 }]}>
                <Text style={styles.label}>Código:</Text>
                <Text style={styles.text}>{String(programa.codigo_disciplina || '-')}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.label}>Carga horária teórica:</Text>
                <Text style={styles.text}>{programa.carga_horaria_teorica ? `${programa.carga_horaria_teorica} horas` : '-'}</Text>
              </View>
              <View style={[styles.gridCell, { flex: 0.6 }]}>
                <Text style={styles.label}>Carga horária prática:</Text>
                <Text style={styles.text}>{programa.carga_horaria_pratica ? `${programa.carga_horaria_pratica} horas` : '-'}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.label}>Carga horária total:</Text>
                <Text style={styles.text}>{programa.carga_horaria_total ? `${programa.carga_horaria_total} horas` : '-'}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.label}>Créditos teóricos:</Text>
                <Text style={styles.text}>{String(programa.creditos_teoricos || '-')}</Text>
              </View>
              <View style={[styles.gridCell, { flex: 0.6 }]}>
                <Text style={styles.label}>Créditos práticos:</Text>
                <Text style={styles.text}>{String(programa.creditos_praticos || '-')}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={[styles.gridCell, { flexDirection: 'column', width: 470 }]}>
                <Text style={[styles.label, { marginBottom: 2 }]}>Cursos Vinculados:</Text>
                <Text style={[styles.text, { lineHeight: 1.4, flexWrap: 'wrap' }]}>
                  {programa.cursos_vinculados?.length ? programa.cursos_vinculados.join(', ') : '-'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* II. EMENTA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>II. EMENTA</Text>
          {renderTextWithBold(String(resolveContent(programa.ementa) || 'Não informada.'))}
        </View>

        {/* III. OBJETIVOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>III. OBJETIVOS</Text>
          {renderTextWithBold(String(resolveContent(programa.objetivos) || 'Não informados.'))}
        </View>

        {/* IV. CONTEÚDO PROGRAMÁTICO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IV. CONTEÚDO PROGRAMÁTICO</Text>
          {renderTextWithBold(String(resolveContent(programa.conteudo_programatico) || 'Não informado.'))}
        </View>

        {/* V. CRITÉRIOS DE AVALIAÇÃO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>V. CRITÉRIOS INSTITUCIONAIS DE AVALIAÇÃO</Text>
          {renderTextWithBold(String(resolveContent(programa.criterios_avaliacao) || 'Não informados.'))}
        </View>

        {/* VI. BIBLIOGRAFIA */}
        {(basicas.length > 0 || complementares.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>VI. REFERÊNCIAS BIBLIOGRÁFICAS</Text>
            
            {basicas.length > 0 && (
              <View style={styles.bibSection}>
                <Text style={styles.bibTypeLabel}>Bibliografia Básica</Text>
                {basicas.map((item, i) => {
                  const segments = parseBoldMarkers(item.referencia);
                  return (
                    <View key={item.id} style={styles.bibItem} wrap={false}>
                      <Text style={styles.bibNumber}>[{i + 1}]</Text>
                      <Text style={styles.bibText}>
                        {segments.map((seg, si) =>
                          seg.isBold ? (
                            <Text key={si} style={{ fontFamily: 'Times-Bold' }}>
                              {seg.text}
                            </Text>
                          ) : (
                            <Text key={si}>{seg.text}</Text>
                          )
                        )}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {complementares.length > 0 && (
              <View style={styles.bibSection}>
                <Text style={styles.bibTypeLabel}>Bibliografia Complementar</Text>
                {complementares.map((item, i) => {
                  const segments = parseBoldMarkers(item.referencia);
                  return (
                    <View key={item.id} style={styles.bibItem} wrap={false}>
                      <Text style={styles.bibNumber}>[{i + 1}]</Text>
                      <Text style={styles.bibText}>
                        {segments.map((seg, si) =>
                          seg.isBold ? (
                            <Text key={si} style={{ fontFamily: 'Times-Bold' }}>
                              {seg.text}
                            </Text>
                          ) : (
                            <Text key={si}>{seg.text}</Text>
                          )
                        )}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* SIGNATURE BLOCK */}
        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signatureItem}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>Chefe de Departamento</Text>
              {programa.criador?.nome && (
                <Text style={styles.signatureName}>{programa.criador.nome}</Text>
              )}
            </View>
          </View>
          <View style={styles.signatureItem}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>Coordenação de Curso</Text>
              {programa.curso_aprovacao && (
                <Text style={styles.signatureName}>{programa.curso_aprovacao}</Text>
              )}
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
}

import React from 'react';
import {
  Document, Page, Text, View,
  StyleSheet, Image,
} from '@react-pdf/renderer';
import { BRASAO_UFSC } from '@/assets/brasaoUFSC';
import { PDF_COLORS, PDF_FONT_FAMILY, PDF_FONT_BOLD, PDF_PAGE_PADDING } from './pdfTheme';
import { resolveContent, formatDateBR } from './pdfHelpers';
import type { ProgramaEnsino } from '../../types/programaEnsino';

const C = PDF_COLORS;

const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 10,
    color: C.grayDark,
    paddingTop:        PDF_PAGE_PADDING.top,
    paddingBottom:     PDF_PAGE_PADDING.bottom,
    paddingHorizontal: PDF_PAGE_PADDING.horizontal,
    backgroundColor:   C.white,
  },

  // ── Document type banner ─────────────────────────────
  docTypeBanner: {
    backgroundColor: C.ufscBlue,
    marginHorizontal: -PDF_PAGE_PADDING.horizontal,
    marginTop:        -PDF_PAGE_PADDING.top,
    paddingHorizontal: PDF_PAGE_PADDING.horizontal,
    paddingTop:   PDF_PAGE_PADDING.top,
    paddingBottom: 18,
    marginBottom:  20,
  },
  docTypeBannerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  docTypeLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  brasao: {
    width:     44,
    height:    50,
    objectFit: 'contain',
  },
  institutionBlock: {
    flex: 1,
  },
  institutionName: {
    fontSize:    11,
    fontFamily:  PDF_FONT_BOLD,
    color:       C.white,
    lineHeight:  1.3,
  },
  institutionSub: {
    fontSize: 8.5,
    color:    '#AECDE8',
    marginTop: 2,
  },
  docTypeRight: {
    alignItems: 'flex-end',
  },
  docTypeLabel: {
    fontSize:        13,
    fontFamily:      PDF_FONT_BOLD,
    color:           C.white,
    letterSpacing:   1,
    textTransform:   'uppercase',
  },
  docTypeSub: {
    fontSize:  8,
    color:     '#7EC8E3',
    marginTop: 3,
    textAlign: 'right',
  },
  semesterPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius:     4,
    paddingHorizontal: 8,
    paddingVertical:   3,
    marginTop:         6,
  },
  semesterPillText: {
    fontSize:   8.5,
    color:      C.white,
    fontFamily: PDF_FONT_BOLD,
  },

  // ── Identification card ──────────────────────────────
  idCard: {
    backgroundColor:  C.offWhite,
    borderRadius:     6,
    padding:          12,
    marginBottom:     16,
    borderWidth:      0.5,
    borderColor:      C.grayLight,
    flexDirection:    'row',
    flexWrap:         'wrap',
    gap:              8,
  },
  idCell: {
    width:        '48%',
    marginBottom: 4,
  },
  idCellFull: {
    width:        '100%',
    marginBottom: 4,
  },
  idLabel: {
    fontSize:        7.5,
    color:           C.grayMid,
    textTransform:   'uppercase',
    letterSpacing:   0.5,
    marginBottom:    2,
  },
  idValue: {
    fontSize:   10,
    fontFamily: PDF_FONT_BOLD,
    color:      C.grayDark,
  },
  idValueSmall: {
    fontSize: 9,
    color:    C.grayDark,
  },

  // ── Course chips ─────────────────────────────────────
  chipsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           4,
    marginTop:     3,
  },
  chip: {
    backgroundColor:  '#E6F0FB',
    borderRadius:     3,
    paddingHorizontal: 5,
    paddingVertical:   2,
  },
  chipText: {
    fontSize: 7.5,
    color:    C.ufscBlue,
    fontFamily: PDF_FONT_BOLD,
  },

  // ── Workload table ───────────────────────────────────
  workloadTable: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  16,
  },
  workloadCell: {
    flex:             1,
    backgroundColor:  C.offWhite,
    borderRadius:     6,
    padding:          10,
    alignItems:       'center',
    borderWidth:      0.5,
    borderColor:      C.grayLight,
  },
  workloadValue: {
    fontSize:   18,
    fontFamily: PDF_FONT_BOLD,
    color:      C.ufscBlue,
  },
  workloadUnit: {
    fontSize:  8,
    color:     C.grayMid,
    marginTop: 2,
  },
  workloadLabel: {
    fontSize:  8,
    color:     C.grayDark,
    marginTop: 4,
    textAlign: 'center',
  },

  // ── Section ──────────────────────────────────────────
  section: {
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection:    'row',
    alignItems:       'center',
    marginBottom:     7,
    paddingBottom:    5,
    borderBottomWidth: 1,
    borderBottomColor: C.grayLight,
  },
  sectionAccent: {
    width:           3,
    height:          14,
    backgroundColor: C.ufscBlue,
    marginRight:     8,
    borderRadius:    2,
  },
  sectionNumber: {
    fontSize:   8,
    fontFamily: PDF_FONT_BOLD,
    color:      C.grayMid,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize:   11,
    fontFamily: PDF_FONT_BOLD,
    color:      C.ufscBlue,
  },
  sectionContent: {
    fontSize:   10,
    color:      C.grayDark,
    lineHeight: 1.65,
    textAlign:  'justify',
  },
  sectionEmpty: {
    fontSize:   10,
    color:      C.grayMid,
    fontStyle:  'italic',
  },

  // ── Bibliography ─────────────────────────────────────
  bibSection: {
    marginBottom: 8,
  },
  bibTypeLabel: {
    fontSize:      8,
    fontFamily:    PDF_FONT_BOLD,
    color:         C.grayMid,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom:  5,
  },
  bibTypeLabelBasica: {
    color: C.ufscBlue,
  },
  bibItem: {
    marginBottom:    5,
    paddingLeft:     10,
    borderLeftWidth: 2,
    borderLeftColor: C.grayLight,
  },
  bibItemBasica: {
    borderLeftColor: C.ufscBlue,
  },
  bibText: {
    fontSize:   9.5,
    color:      C.grayDark,
    lineHeight: 1.5,
  },
  bibNumber: {
    fontSize:   8,
    color:      C.grayMid,
    marginBottom: 1,
  },

  // ── Signature block ───────────────────────────────────
  signatureRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    gap:            30,
    marginTop:      28,
  },
  signatureItem: {
    flex: 1,
  },
  signatureLine: {
    borderTopWidth: 0.5,
    borderTopColor: C.grayDark,
    paddingTop:     5,
  },
  signatureLabel: {
    fontSize:  8.5,
    color:     C.grayMid,
    textAlign: 'center',
  },
  signatureName: {
    fontSize:   9,
    color:      C.grayDark,
    textAlign:  'center',
    fontFamily: PDF_FONT_BOLD,
    marginTop:  2,
  },

  // ── Approval stamp ───────────────────────────────────
  approvedStamp: {
    position:        'absolute',
    top:             45,
    right:           45,
    borderWidth:     2,
    borderColor:     '#10B981',
    borderRadius:    4,
    paddingVertical:   6,
    paddingHorizontal: 12,
    transform:       'rotate(-15deg)', // String based transform for react-pdf
  },
  approvedStampText: {
    fontSize:        14,
    fontFamily:      PDF_FONT_BOLD,
    color:           '#10B981',
    letterSpacing:   2,
    textTransform:   'uppercase',
  },

  // ── Footer ────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom:   22,
    left:     PDF_PAGE_PADDING.horizontal,
    right:    PDF_PAGE_PADDING.horizontal,
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    borderTopWidth: 0.5,
    borderTopColor: C.grayLight,
    paddingTop:     7,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  footerText: {
    fontSize: 7.5,
    color:    C.grayMid,
  },
  footerBold: {
    fontFamily: PDF_FONT_BOLD,
    color:      C.ufscBlue,
  },
});

function PdfSection({
  number, title, content
}: {
  number: string;
  title:  string;
  content?: string | null;
}) {
  const text = resolveContent(content);
  return (
    <View style={styles.section} wrap={false}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionNumber}>
          {number}
        </Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {text ? (
        <Text style={styles.sectionContent}>{text}</Text>
      ) : (
        <Text style={styles.sectionEmpty}>
          Não preenchido
        </Text>
      )}
    </View>
  );
}

function IdCell({
  label, value, full = false
}: {
  label: string; value?: string | null; full?: boolean;
}) {
  return (
    <View style={full ? styles.idCellFull : styles.idCell}>
      <Text style={styles.idLabel}>{label}</Text>
      <Text style={styles.idValue}>{value ?? '—'}</Text>
    </View>
  );
}

function WorkloadCell({
  value, unit, label
}: {
  value: number | string | null;
  unit:  string;
  label: string;
}) {
  return (
    <View style={styles.workloadCell}>
      <Text style={styles.workloadValue}>
        {value ?? '—'}
      </Text>
      <Text style={styles.workloadUnit}>{unit}</Text>
      <Text style={styles.workloadLabel}>{label}</Text>
    </View>
  );
}

export interface ProgramaPDFProps {
  programa: ProgramaEnsino;
}

export function ProgramaPDF({ programa }: ProgramaPDFProps) {

  const geradoEm = formatDateBR(new Date());
  const isApproved = programa.status === 'approved' || programa.status === 'archived';

  const basicas = (programa.bibliografia ?? [])
    .filter(b => b.tipo === 'basica')
    .sort((a, b) => a.ordem - b.ordem);

  const complementares = (programa.bibliografia ?? [])
    .filter(b => b.tipo === 'complementar')
    .sort((a, b) => a.ordem - b.ordem);

  return (
    <Document
      title={
        `Programa de Ensino — ` +
        `${programa.codigo_disciplina ?? ''} ` +
        `${programa.nome_disciplina ?? ''}`
      }
      subject="Programa de Ensino UFSC CTJ"
      author="SIPPE — Sistema para Programas e Planos de Ensino"
      creator="SIPPE UFSC CTJ"
      producer="@react-pdf/renderer"
      keywords={`programa ensino UFSC CTJ ${programa.codigo_disciplina ?? ''}`}
    >
      <Page size="A4" style={styles.page}>

        {/* ── DOCUMENT TYPE BANNER (full-width header) ── */}
        <View style={styles.docTypeBanner}>
          <View style={styles.docTypeBannerRow}>

            {/* Left: brasão + institution */}
            <View style={styles.docTypeLeft}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image
                src={BRASAO_UFSC}
                style={styles.brasao}
              />
              <View style={styles.institutionBlock}>
                <Text style={styles.institutionName}>
                  Universidade Federal de Santa Catarina
                </Text>
                <Text style={styles.institutionSub}>
                  Centro Tecnológico de Joinville · CTJ
                </Text>
                <Text style={styles.institutionSub}>
                  Departamento Acadêmico
                </Text>
              </View>
            </View>

            {/* Right: document type */}
            <View style={styles.docTypeRight}>
              <Text style={styles.docTypeLabel}>
                Programa de Ensino
              </Text>
              <Text style={styles.docTypeSub}>
                SIPPE · Gestão Acadêmica
              </Text>
              <View style={styles.semesterPill}>
                <Text style={styles.semesterPillText}>
                  Vigência: Permanente
                </Text>
              </View>
            </View>

          </View>
        </View>

        {/* ── APPROVED STAMP (diagonal) ── */}
        {isApproved && (
          <View style={styles.approvedStamp}>
            <Text style={styles.approvedStampText}>
              Aprovado
            </Text>
          </View>
        )}

        {/* ── SECTION 1: IDENTIFICAÇÃO ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionNumber}>1</Text>
            <Text style={styles.sectionTitle}>
              Identificação da Disciplina
            </Text>
          </View>

          <View style={styles.idCard}>
            <IdCell
              full
              label="Nome da Disciplina"
              value={programa.nome_disciplina}
            />
            <IdCell
              label="Código"
              value={programa.codigo_disciplina}
            />
            <IdCell
              label="Situação"
              value={
                programa.status === 'approved' ? 'Aprovado' :
                programa.status === 'archived' ? 'Arquivado' : 'Em elaboração'
              }
            />
            {/* Cursos vinculados as chips */}
            <View style={styles.idCellFull}>
              <Text style={styles.idLabel}>
                Graduações / PPC
              </Text>
              <View style={styles.chipsRow}>
                {(programa.cursos_vinculados ?? []).length > 0
                  ? (programa.cursos_vinculados ?? []).map((curso, i) => (
                      <View key={i} style={styles.chip}>
                        <Text style={styles.chipText}>
                          {curso}
                        </Text>
                      </View>
                    ))
                  : <Text style={styles.idValueSmall}>—</Text>
                }
              </View>
            </View>
          </View>
        </View>

        {/* ── SECTION 2: CARGA HORÁRIA ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionNumber}>2</Text>
            <Text style={styles.sectionTitle}>
              Carga Horária e Créditos
            </Text>
          </View>
          <View style={styles.workloadTable}>
            <WorkloadCell
              value={programa.carga_horaria_teorica ?? 0}
              unit="horas"
              label="C.H. Teórica"
            />
            <WorkloadCell
              value={programa.carga_horaria_pratica ?? 0}
              unit="horas"
              label="C.H. Prática"
            />
            <WorkloadCell
              value={programa.carga_horaria_total ?? 0}
              unit="horas"
              label="C.H. Total"
            />
            <WorkloadCell
              value={programa.creditos_teoricos ?? 0}
              unit="créditos"
              label="Créditos Teóricos"
            />
            <WorkloadCell
              value={programa.creditos_praticos ?? 0}
              unit="créditos"
              label="Créditos Práticos"
            />
          </View>
        </View>

        {/* ── SECTIONS 3–6: TEXT CONTENT ── */}
        <PdfSection
          number="3"
          title="Ementa"
          content={programa.ementa}
        />
        <PdfSection
          number="4"
          title="Objetivos"
          content={programa.objetivos}
        />
        <PdfSection
          number="5"
          title="Conteúdo Programático"
          content={programa.conteudo_programatico}
        />
        <PdfSection
          number="6"
          title="Critérios Institucionais de Avaliação"
          content={programa.criterios_avaliacao}
        />

        {/* ── SECTION 7 & 8: BIBLIOGRAPHY ── */}
        {(basicas.length > 0 || complementares.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionNumber}>
                7–8
              </Text>
              <Text style={styles.sectionTitle}>
                Referências Bibliográficas
              </Text>
            </View>

            {basicas.length > 0 && (
              <View style={styles.bibSection}>
                <Text style={[
                  styles.bibTypeLabel,
                  styles.bibTypeLabelBasica,
                ]}>
                  Bibliografia Básica
                </Text>
                {basicas.map((item, i) => (
                  <View
                    key={item.id}
                    style={[
                      styles.bibItem,
                      styles.bibItemBasica,
                    ]}
                    wrap={false}
                  >
                    <Text style={styles.bibNumber}>
                      [{i + 1}]
                    </Text>
                    <Text style={styles.bibText}>
                      {item.referencia}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {complementares.length > 0 && (
              <View style={styles.bibSection}>
                <Text style={styles.bibTypeLabel}>
                  Bibliografia Complementar
                </Text>
                {complementares.map((item, i) => (
                  <View
                    key={item.id}
                    style={styles.bibItem}
                    wrap={false}
                  >
                    <Text style={styles.bibNumber}>
                      [{i + 1}]
                    </Text>
                    <Text style={styles.bibText}>
                      {item.referencia}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── SIGNATURE BLOCK ── */}
        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signatureItem}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>
                Chefe de Departamento
              </Text>
              {programa.criador?.nome && (
                <Text style={styles.signatureName}>
                  {programa.criador.nome}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.signatureItem}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>
                Coordenação de Curso
              </Text>
              {programa.curso_aprovacao && (
                <Text style={styles.signatureName}>
                  {programa.curso_aprovacao}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.signatureItem}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>
                Data de Aprovação
              </Text>
              <Text style={styles.signatureName}>
                {formatDateBR(programa.aprovado_em)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── FOOTER (fixed on every page) ── */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <Text style={styles.footerText}>
              <Text style={styles.footerBold}>
                SIPPE
              </Text>
              {' '}· UFSC CTJ · Programa de Ensino
            </Text>
          </View>
          <Text style={styles.footerText}>
            Gerado em {geradoEm}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>

      </Page>
    </Document>
  );
}

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
    fontSize: 12,
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: 'bold',
  },
});

interface PlanoPDFProps {
  plano: any;
}

export const PlanoPDF = ({ plano }: PlanoPDFProps) => {
  return (
    <Document title="Teste de Geração">
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.title}>Plano de Ensino - Teste</Text>
          <Text>Disciplina: {plano?.courseName || 'N/A'}</Text>
          <Text>Semestre: {plano?.semester || 'N/A'}</Text>
          <Text style={{ marginTop: 20 }}>
            Se você está vendo este texto, o motor de geração de PDF está funcionando corretamente.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

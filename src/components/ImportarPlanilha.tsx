"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Table, RefreshCcw, FileText, CheckCircle, AlertTriangle, 
  Info, ChevronDown, ChevronUp, Upload, UserCheck, 
  MailWarning, ExternalLink, Layout
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MySwal, confirmDialog, swalLoading, toastSuccess, toastError } from "@/lib/swal";
import { useRouter } from "next/navigation";

interface ImportResult {
  totalLinhasLidas:      number;
  totalLinhasValidas:    number;
  totalLinhasIgnoradas:  number;
  professoresNovos:      number;
  professoresExistentes: number;
  disciplinasCriadas:    number;
  disciplinasAtualizadas:number;
  turmasCriadas:         number;
  turmasAtualizadas:     number;
  planosCriados:         number;
  planosJaExistentes:    number;
  pendentesEmail:        { 
    nome: string; 
    turma: string; 
    disciplina: string;
    codigo: string;
  }[];
  erros: { 
    row: number; 
    professor: string;
    disciplina: string;
    turma: string;
    message: string; 
  }[];
  validationReport?: { invalid: { row: number; issues: string[] }[] };
}

interface PreviewData {
  totalLinhas: number;
  linhasValidas: number;
  linhasIgnoradas: number;
  planosPorCriar: number;
  professoresNovos: number;
  disciplinas: {
    codigo: string;
    nome: string;
    turmas: { turma: string; professor: string; vagas: number }[];
  }[];
}

function DisciplineTreeItem({ disc }: { disc: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border rounded mb-2 overflow-hidden bg-white shadow-sm">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono bg-white">{disc.codigo}</Badge>
          <span className="text-sm font-bold text-slate-700 text-left">{disc.nome}</span>
          <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200 ml-2 shrink-0">{disc.turmas.length} turmas</Badge>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>
      {expanded && (
        <div className="p-0 border-t">
          <table className="w-full text-[11px]">
            <tbody className="divide-y">
              {disc.turmas.map((t: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-2 px-4 font-bold text-slate-600 w-24">Turma {t.turma}</td>
                  <td className="p-2 text-slate-500 italic flex items-center gap-2">
                    <UserCheck className="w-3 h-3 text-blue-400" /> {t.professor}
                  </td>
                  <td className="p-2 px-4 text-slate-400 text-right">{t.vagas} vagas</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ImportarPlanilha() {
  const [state, setState] = useState<"IDLE" | "PREVIEW" | "RESULT">("IDLE");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("sippe_last_sync");
    if (saved) setLastSync(saved);
  }, []);

  const handlePreview = async () => {
    swalLoading("Carregando dados da planilha...");
    try {
      const response = await fetch("/api/admin/importar-planilha/preview");
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }
      const data = await response.json();
      setPreviewData(data);
      setState("PREVIEW");
      MySwal.close();
    } catch (error: any) {
      MySwal.close();
      handleApiError(error);
    }
  };

  const handleSyncFull = async () => {
    const confirmed = await confirmDialog(
      "Confirmar importação completa?",
      "Isso irá importar disciplinas, turmas, criar contas para professores e gerar rascunhos de planos de ensino (1 por turma). Esta ação não pode ser desfeita.",
      "Importar Tudo",
      "Cancelar",
      false
    );

    if (!confirmed) return;

    swalLoading("Sincronizando e criando planos...");
    try {
      const response = await fetch("/api/admin/importar-planilha/completo", { method: "POST" });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }
      const data = await response.json();
      setImportResult(data);
      
      const now = new Date().toLocaleString("pt-BR");
      localStorage.setItem("sippe_last_sync", now);
      setLastSync(now);
      
      setState("RESULT");
      MySwal.close();
      toastSuccess(`Importação concluída com sucesso.`);
    } catch (error: any) {
      MySwal.close();
      handleApiError(error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmed = await confirmDialog(
      "Importar arquivo XLSX?",
      `Deseja importar os dados do arquivo ${file.name}?`,
      "Importar",
      "Cancelar",
      false
    );

    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    swalLoading("Processando arquivo...");
    const formData = new FormData();
    formData.append("planilha", file);

    try {
      const response = await fetch("/api/admin/importar-xlsx", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();
      setImportResult(data);
      setState("RESULT");
      MySwal.close();
      toastSuccess("Importação de arquivo concluída.");
    } catch (error: any) {
      MySwal.close();
      handleApiError(error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApiError = (error: any) => {
    const msg = error.message || "";
    if (msg.includes("credentials")) {
      toastError("Erro de autenticação com o Google Sheets. Verifique as configurações do servidor.");
    } else if (msg.includes("Planilha não encontrada") || msg.includes("404")) {
      toastError("Planilha não encontrada. Verifique se ela foi compartilhada com a conta de serviço.");
    } else if (msg.includes("semestre ativo")) {
      toastError("Nenhum semestre ativo configurado. Configure um semestre antes de importar.");
    } else if (error.name === "TypeError" && msg.includes("fetch")) {
      toastError("Erro de conexão. Verifique sua internet e tente novamente.");
    } else {
      toastError(msg || "Ocorreu um erro inesperado.");
    }
  };

  if (state === "PREVIEW" && previewData) {
    return (
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Pré-visualização da Importação
          </CardTitle>
          <CardDescription>
            {previewData.linhasValidas} linhas válidas prontas para processamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-white border rounded-xl shadow-sm text-center">
              <span className="block text-xl font-bold text-blue-600">{previewData.planosPorCriar}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Novos Planos</span>
            </div>
            <div className="p-3 bg-white border rounded-xl shadow-sm text-center">
              <span className="block text-xl font-bold text-indigo-600">{previewData.professoresNovos}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Novos Profs</span>
            </div>
            <div className="p-3 bg-white border rounded-xl shadow-sm text-center">
              <span className="block text-xl font-bold text-slate-600">{previewData.disciplinas.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Disciplinas</span>
            </div>
            <div className="p-3 bg-white border rounded-xl shadow-sm text-center">
              <span className="block text-xl font-bold text-amber-500">{previewData.linhasIgnoradas}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Ignoradas</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase px-1 mb-2">Estrutura de Turmas por Disciplina</p>
            <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {previewData.disciplinas.map((disc, idx) => (
                <DisciplineTreeItem key={idx} disc={disc} />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setState("IDLE")}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSyncFull}>
              Confirmar e Gerar Planos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "RESULT" && importResult) {
    const invalidCount = importResult.validationReport?.invalid?.length || 0;
    
    return (
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Importação Concluída
          </CardTitle>
          <CardDescription>
            Relatório de processamento final da planilha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-white border border-green-100 rounded-xl text-center shadow-sm">
              <span className="block text-xl font-bold text-green-600">{importResult.planosCriados}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Planos Criados</span>
              <span className="text-[8px] text-slate-400 block mt-1">(1 por turma)</span>
            </div>
            <div className="p-3 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
              <span className="block text-xl font-bold text-slate-600">{importResult.planosJaExistentes}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Já Existentes</span>
              <span className="text-[8px] text-slate-400 block mt-1">(mantidos)</span>
            </div>
            <div className="p-3 bg-white border border-blue-100 rounded-xl text-center shadow-sm">
              <span className="block text-xl font-bold text-blue-600">{importResult.turmasCriadas + importResult.turmasAtualizadas}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Turmas Proc.</span>
            </div>
            <div className="p-3 bg-white border border-indigo-100 rounded-xl text-center shadow-sm">
              <span className="block text-xl font-bold text-indigo-600">{importResult.professoresNovos}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Novos Profs</span>
            </div>
          </div>

          {importResult.pendentesEmail.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MailWarning className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-bold text-amber-800 uppercase">
                  {importResult.pendentesEmail.length} novos professores aguardam e-mail:
                </p>
              </div>
              <ul className="mt-1 space-y-1 max-h-32 overflow-y-auto pr-2">
                {importResult.pendentesEmail.map((p, i) => (
                  <li key={i} className="text-[10px] text-amber-700 leading-tight flex justify-between">
                    <span>· <strong>{p.nome}</strong> — {p.disciplina}</span>
                    <span className="font-mono text-[9px] bg-amber-100 px-1 rounded">Turma {p.turma}</span>
                  </li>
                ))}
              </ul>
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => router.push('/dashboard/chef?tab=users')}
                className="mt-3 h-auto p-0 text-amber-700 underline underline-offset-2 text-xs font-bold gap-1"
              >
                Ir para Gestão de Usuários <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          )}

          {(importResult.erros.length > 0 || invalidCount > 0) && (
            <div className="border border-red-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <button 
                className="w-full p-3 flex items-center justify-between text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => setShowErrors(!showErrors)}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Conflitos e Avisos ({importResult.erros.length + invalidCount})
                </div>
                {showErrors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showErrors && (
                <div className="p-3 bg-red-50/50 border-t max-h-40 overflow-y-auto space-y-2">
                  {importResult.validationReport?.invalid?.map((err, i) => (
                    <p key={`val-${i}`} className="text-[10px] text-red-700">
                      <strong>Linha {err.row} (Formato):</strong> {err.issues.join(", ")}
                    </p>
                  ))}
                  {importResult.erros.map((err, i) => (
                    <p key={`imp-${i}`} className="text-[10px] text-red-700 font-medium">
                      <strong>Linha {err.row}:</strong> {err.disciplina} T-{err.turma} ({err.professor}) — {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setState("IDLE")} className="w-full max-w-xs shadow-sm">
              Concluir
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Table className="w-5 h-5 text-brand-blue" />
          Gerador de Planos em Lote
        </CardTitle>
        <CardDescription>
          Crie rascunhos de planos de ensino individuais para cada turma da planilha.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastSync && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-2 rounded border border-slate-100 w-fit">
            <Info className="w-3 h-3 text-blue-400" />
            Última importação: {lastSync}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3 p-4 bg-slate-50/50 border rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Layout className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Planilha Google Sheets</span>
            </div>
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    className="flex-1 gap-2 text-xs bg-white"
                    onClick={handlePreview}
                >
                    <FileText className="w-4 h-4" />
                    Pré-visualizar
                </Button>
                <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2 text-xs shadow-md"
                    onClick={handleSyncFull}
                >
                    <RefreshCcw className="w-4 h-4" />
                    Importar Agora
                </Button>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-slate-50/50 border rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Arquivo Local XLSX</span>
            </div>
            <div className="relative">
                <input 
                    type="file" 
                    accept=".xlsx,.xls" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />
                <Button 
                    variant="outline" 
                    className="w-full gap-2 border-dashed border-2 hover:border-blue-400 hover:text-blue-500 transition-all bg-white"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="w-4 h-4" />
                    Upload Planilha Local
                </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

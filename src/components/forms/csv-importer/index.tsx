"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUp, Check } from "lucide-react";

interface CSVImporterProps {
  onImport: (data: { code: string; name: string }[]) => void;
}

export function CSVImporter({ onImport }: CSVImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setHeadersMapping] = useState({
    code: "",
    name: "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.meta.fields) {
            setHeaders(results.meta.fields);
            setParsedData(results.data as Record<string, string>[]);
          }
        },
      });
    }
  };

  const handleImport = () => {
    if (!mapping.code || !mapping.name) return;

    const importedData = parsedData.map((row) => ({
      code: row[mapping.code],
      name: row[mapping.name],
    }));

    onImport(importedData);
    setIsOpen(false);
    reset();
  };

  const reset = () => {
    setFile(null);
    setHeaders([]);
    setHeadersMapping({ code: "", name: "" });
    setParsedData([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 h-9 rounded-lg text-xs font-semibold">
          <FileUp className="w-4 h-4 text-[#023E8A]" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] p-6 rounded-xl border border-slate-200/80 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#102E52] flex items-center gap-2">
            <FileUp className="w-5 h-5 text-[#023E8A]" />
            Importar Disciplinas
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Selecione um arquivo CSV e mapeie as colunas correspondentes ao código e nome da disciplina.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3.5 py-3">
          {!file ? (
            <div 
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="w-8 h-8 mx-auto mb-2 text-[#023E8A]" />
              <p className="text-xs font-semibold text-slate-700">Clique para selecionar o arquivo CSV</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Formato com cabeçalhos de coluna</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv" 
                onChange={handleFileChange} 
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-medium text-slate-800 truncate max-w-[220px]">{file.name}</span>
                  <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs text-slate-500 hover:text-slate-800">Trocar</Button>
              </div>
              
              <div className="space-y-2.5">
                <div className="space-y-1.5">
                  <Label htmlFor="mapping-code" className="text-xs font-semibold text-slate-700">Coluna de Código</Label>
                  <Select 
                    value={mapping.code} 
                    onValueChange={(val) => setHeadersMapping(prev => ({ ...prev, code: val }))}
                  >
                    <SelectTrigger id="mapping-code" className="h-9 rounded-lg border-slate-200 text-xs focus:ring-[#023E8A]">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="mapping-name" className="text-xs font-semibold text-slate-700">Coluna de Nome</Label>
                  <Select 
                    value={mapping.name} 
                    onValueChange={(val) => setHeadersMapping(prev => ({ ...prev, name: val }))}
                  >
                    <SelectTrigger id="mapping-name" className="h-9 rounded-lg border-slate-200 text-xs focus:ring-[#023E8A]">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="h-9 px-4 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg"
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleImport} 
            disabled={!mapping.code || !mapping.name}
            className="h-9 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold px-4 text-xs rounded-lg gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Concluir Importação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

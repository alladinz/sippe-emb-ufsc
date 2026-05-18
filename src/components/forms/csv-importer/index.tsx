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
        <Button variant="outline" size="sm" className="gap-2">
          <FileUp className="w-4 h-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar Disciplinas</DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV e mapeie as colunas correspondentes ao código e nome da disciplina.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {!file ? (
            <div 
                className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-600">Clique para selecionar o arquivo</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv" 
                onChange={handleFileChange} 
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <Button variant="ghost" size="sm" onClick={reset}>Trocar</Button>
              </div>
              
              <div className="space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="mapping-code">Coluna de Código</Label>
                  <Select 
                    value={mapping.code} 
                    onValueChange={(val) => setHeadersMapping(prev => ({ ...prev, code: val }))}
                  >
                    <SelectTrigger id="mapping-code">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="mapping-name">Coluna de Nome</Label>
                  <Select 
                    value={mapping.name} 
                    onValueChange={(val) => setHeadersMapping(prev => ({ ...prev, name: val }))}
                  >
                    <SelectTrigger id="mapping-name">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            onClick={handleImport} 
            disabled={!mapping.code || !mapping.name}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Concluir Importação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

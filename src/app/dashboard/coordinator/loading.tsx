import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableContainer, TableShell } from "@/components/table";
import { Clock } from "lucide-react";

export default function CoordinatorLoading() {
  return (
    <div className="space-y-12 pb-10">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>

      {[
        { title: "Novas Submissões", icon: Clock, iconColor: "text-amber-500", bg: "bg-amber-500" },
        { title: "Em Minha Revisão", icon: Clock, iconColor: "text-brand-blue", bg: "bg-brand-blue" }
      ].map((section, idx) => (
        <div key={idx} className="space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
              <div className={`h-8 w-1 ${section.bg} rounded-full`} />
              <Skeleton className="h-7 w-40" />
          </div>
          <TableShell>
            <TableContainer>
                <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                    <TableHead className="w-[15%]">Professor</TableHead>
                    <TableHead className="w-[20%]">Disciplina</TableHead>
                    <TableHead className="w-[10%]">Turma</TableHead>
                    <TableHead className="w-[10%]">Semestre</TableHead>
                    <TableHead className="w-[15%]">Status</TableHead>
                    <TableHead className="w-[15%]">Data</TableHead>
                    <TableHead className="text-right w-[15%]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2].map((i) => (
                        <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto rounded-sm" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                </Table>
            </TableContainer>
          </TableShell>
        </div>
      ))}

      <div className="space-y-6 opacity-60">
        <div className="flex items-center gap-3 border-b pb-4">
            <div className="h-8 w-1 bg-slate-300 rounded-full" />
            <Skeleton className="h-7 w-32" />
        </div>
        <TableShell>
          <TableContainer>
              <Table>
              <TableHeader className="bg-slate-50/50">
                  <TableRow>
                  <TableHead className="w-[15%]">Professor</TableHead>
                  <TableHead className="w-[20%]">Disciplina</TableHead>
                  <TableHead className="w-[10%]">Turma</TableHead>
                  <TableHead className="w-[10%]">Semestre</TableHead>
                  <TableHead className="w-[15%]">Status</TableHead>
                  <TableHead className="w-[15%]">Data</TableHead>
                  <TableHead className="text-right w-[15%]">Ações</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {[1, 2].map((i) => (
                      <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto rounded-sm" /></TableCell>
                      </TableRow>
                  ))}
              </TableBody>
              </Table>
          </TableContainer>
        </TableShell>
      </div>
    </div>
  );
}

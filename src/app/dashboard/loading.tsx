import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { BookOpen, Clock } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Assigned Courses Section */}
        <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-slate-300" />
                    <Skeleton className="h-7 w-48" />
                </div>
                <Skeleton className="h-8 w-24" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="flex flex-col h-full rounded-md border-slate-200">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Skeleton className="h-5 w-20 rounded-full" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                            <Skeleton className="h-6 w-full mt-2" />
                            <Skeleton className="h-4 w-24 mt-1" />
                        </CardHeader>
                        <CardFooter className="pt-2 mt-auto">
                            <Skeleton className="h-10 w-full rounded-sm" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>

        {/* Status Summary Column */}
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-300" />
                <Skeleton className="h-7 w-24" />
            </div>
            
            <Card className="rounded-md">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-8 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-8 rounded-full" />
                    </div>
                    <div className="h-px bg-slate-100 w-full" />
                    <div className="flex justify-center">
                        <Skeleton className="h-4 w-40" />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

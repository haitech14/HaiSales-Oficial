import { cn } from "@/lib/utils";

type ClientesTableSkeletonProps = {
  rows?: number;
  className?: string;
};

export function ClientesTableSkeleton({ rows = 8, className }: ClientesTableSkeletonProps) {
  return (
    <div className={cn("divide-y divide-slate-100", className)}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-3 py-2">
          <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-4 min-w-[180px] flex-1 animate-pulse rounded bg-slate-100" />
          <div className="hidden h-4 w-28 animate-pulse rounded bg-slate-100 sm:block" />
          <div className="hidden h-4 w-32 animate-pulse rounded bg-slate-100 md:block" />
        </div>
      ))}
    </div>
  );
}

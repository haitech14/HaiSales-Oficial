import { useState } from "react";
import { Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { orgChart } from "@/lib/anuncios/anuncios-mock-data";
import { cn } from "@/lib/utils";

function OrgNode({
  initials,
  title,
  role,
  color,
  className,
}: {
  initials: string;
  title: string;
  role: string;
  color: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm",
          color,
        )}
      >
        {initials}
      </span>
      <p className="mt-1.5 text-center text-xs font-semibold text-slate-800">{title}</p>
      <p className="text-center text-[10px] text-slate-500">{role}</p>
    </div>
  );
}

function OrgChartContent() {
  return (
    <div className="flex flex-col items-center py-2">
      <OrgNode {...orgChart.root} />
      <div className="my-2 h-6 w-px bg-slate-200" aria-hidden="true" />
      <div className="relative w-full max-w-4xl">
        <div className="absolute left-[10%] right-[10%] top-0 h-px bg-slate-200" aria-hidden="true" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {orgChart.departments.map((dept) => (
            <div key={dept.area} className="flex flex-col items-center pt-3">
              <div className="mb-2 h-3 w-px bg-slate-200" aria-hidden="true" />
              <OrgNode
                initials={dept.initials}
                title={dept.title}
                role={dept.role}
                color={dept.color}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnunciosOrgChart() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 gap-2 border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <Network className="h-4 w-4 text-blue-600" />
        Ver organigrama
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl border-slate-200 sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>Organigrama de la empresa</DialogTitle>
          </DialogHeader>
          <OrgChartContent />
        </DialogContent>
      </Dialog>
    </>
  );
}

import { Building2, ChevronDown, Loader2, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  WORKSPACE_EMPRESA_SCOPE,
  workspaceScopeToValue,
  workspaceValueToScope,
} from "@/lib/workspace/workspace-utils";
import { cn } from "@/lib/utils";

type EmpresaSucursalSwitcherProps = {
  collapsed?: boolean;
  className?: string;
};

export function EmpresaSucursalSwitcher({
  collapsed = false,
  className,
}: EmpresaSucursalSwitcherProps) {
  const navigate = useNavigate();
  const {
    scope,
    setScope,
    sedes,
    empresaNombre,
    empresaRuc,
    empresaLogo,
    empresaIniciales,
    subtitle,
    isLoading,
  } = useWorkspace();

  const selectedValue = workspaceScopeToValue(scope);

  const handleScopeChange = (value: string) => {
    const nextScope = workspaceValueToScope(value);
    setScope(nextScope);

    if (nextScope.type === WORKSPACE_EMPRESA_SCOPE) {
      toast.success(`Vista general: ${empresaNombre}`);
      return;
    }

    const sede = sedes.find((item) => item.id === nextScope.sedeId);
    toast.success(sede ? `Sucursal activa: ${sede.nombre}` : "Sucursal actualizada");
  };

  const avatar = (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-[10px] font-bold text-white">
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : empresaLogo ? (
        <img src={empresaLogo} alt="" className="h-full w-full object-cover" />
      ) : (
        empresaIniciales
      )}
    </span>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full rounded-lg border border-white/[0.08] bg-white/[0.04] text-left transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
            collapsed ? "mx-auto flex h-10 w-10 items-center justify-center border-none bg-transparent p-0 hover:bg-white/[0.05]" : "p-2.5",
            className,
          )}
          aria-label="Cambiar empresa o sucursal"
        >
          {collapsed ? (
            avatar
          ) : (
            <div className="flex items-center gap-2.5">
              {avatar}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white">{empresaNombre}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side={collapsed ? "right" : "bottom"}
        className="w-[min(100vw-2rem,300px)] border-white/10 bg-[#111827] p-1.5 text-slate-100"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Empresa
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={selectedValue} onValueChange={handleScopeChange}>
          <DropdownMenuRadioItem
            value={WORKSPACE_EMPRESA_SCOPE}
            className="cursor-pointer rounded-md py-2 pl-8 pr-2 text-sm text-slate-100 focus:bg-white/10 focus:text-white"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{empresaNombre}</p>
              <p className="truncate text-xs text-slate-500">Vista general · RUC {empresaRuc}</p>
            </div>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        {sedes.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-1.5 bg-white/10" />
            <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Sucursales
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={selectedValue} onValueChange={handleScopeChange}>
              {sedes.map((sede) => (
                <DropdownMenuRadioItem
                  key={sede.id}
                  value={`sede:${sede.id}`}
                  className="cursor-pointer rounded-md py-2 pl-8 pr-2 text-sm text-slate-100 focus:bg-white/10 focus:text-white"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {sede.nombre}
                      {sede.esPrincipal && (
                        <span className="ml-1.5 text-[10px] font-normal text-amber-400">Principal</span>
                      )}
                    </p>
                    {sede.direccion.trim() && (
                      <p className="truncate text-xs text-slate-500">{sede.direccion}</p>
                    )}
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}

        {sedes.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-slate-500">
            Agrega sucursales en Configuración para filtrar por local.
          </p>
        )}

        <DropdownMenuSeparator className="my-1.5 bg-white/10" />
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-md text-sm text-slate-200 focus:bg-white/10 focus:text-white"
          onSelect={() => navigate("/app/parametros")}
        >
          <Settings2 className="h-4 w-4 text-slate-400" />
          Gestionar sucursales
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-md text-sm text-slate-200 focus:bg-white/10 focus:text-white"
          onSelect={() => navigate("/app/parametros")}
        >
          <Building2 className="h-4 w-4 text-slate-400" />
          Datos de empresa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

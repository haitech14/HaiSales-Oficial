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
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden",
        empresaLogo
          ? "h-9 w-9 rounded-lg border border-white/15 bg-white p-1 shadow-sm"
          : "h-9 w-9 rounded-lg bg-blue-600 text-[11px] font-bold text-white",
        collapsed && (empresaLogo ? "h-10 w-10 p-1.5" : "h-10 w-10"),
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
      ) : empresaLogo ? (
        <img
          src={empresaLogo}
          alt={`Logo ${empresaNombre}`}
          width={36}
          height={36}
          decoding="async"
          className="h-full w-full object-contain object-center"
        />
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
                <p className="truncate text-[11px] font-semibold leading-tight text-white">
                  {empresaNombre}
                </p>
                <p className="mt-0.5 truncate text-[10px] leading-tight text-slate-400">
                  {scope.type === WORKSPACE_EMPRESA_SCOPE
                    ? `RUC ${empresaRuc}`
                    : subtitle}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side={collapsed ? "right" : "bottom"}
        className="w-[min(100vw-2rem,300px)] border border-slate-200 bg-white p-2 text-slate-800 shadow-lg"
      >
        <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Empresa
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={selectedValue} onValueChange={handleScopeChange}>
          <DropdownMenuRadioItem
            value={WORKSPACE_EMPRESA_SCOPE}
            className="cursor-pointer rounded-lg border border-transparent py-2 pl-8 pr-2 text-sm text-slate-800 focus:bg-slate-50 focus:text-slate-900 data-[state=checked]:border-blue-200 data-[state=checked]:bg-blue-50"
          >
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-slate-900">{empresaNombre}</p>
              <p className="truncate text-[10px] text-slate-500">
                Vista general · RUC {empresaRuc}
              </p>
            </div>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        {sedes.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-2 bg-slate-100" />
            <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Sucursales
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={selectedValue}
              onValueChange={handleScopeChange}
              className="space-y-1.5"
            >
              {sedes.map((sede) => (
                <DropdownMenuRadioItem
                  key={sede.id}
                  value={`sede:${sede.id}`}
                  className={cn(
                    "cursor-pointer rounded-lg border border-slate-200 bg-slate-50/80 py-2.5 pl-8 pr-2.5 text-sm text-slate-800",
                    "focus:bg-blue-50 focus:text-slate-900",
                    "data-[state=checked]:border-blue-300 data-[state=checked]:bg-blue-50 data-[state=checked]:shadow-sm",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[12px] font-semibold text-slate-900">
                        {sede.nombre}
                      </p>
                      {sede.esPrincipal && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">
                          Principal
                        </span>
                      )}
                    </div>
                    {sede.direccion.trim() ? (
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">{sede.direccion}</p>
                    ) : (
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">Sin dirección</p>
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

        <DropdownMenuSeparator className="my-2 bg-slate-100" />
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-md text-sm text-slate-700 focus:bg-slate-50 focus:text-slate-900"
          onSelect={() => navigate("/app/parametros")}
        >
          <Settings2 className="h-4 w-4 text-slate-400" />
          Gestionar sucursales
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-md text-sm text-slate-700 focus:bg-slate-50 focus:text-slate-900"
          onSelect={() => navigate("/app/parametros")}
        >
          <Building2 className="h-4 w-4 text-slate-400" />
          Datos de empresa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

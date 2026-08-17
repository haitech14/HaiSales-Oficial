import type { ComponentProps, ReactNode } from "react";
import { memo, useState } from "react";
import { Building2, ChevronDown, MapPin, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { HAISALES_LOGO_SRC } from "@/components/landing/HaiSalesLogo";
import {
  SIDEBAR_AVATAR_SIZE,
  SIDEBAR_DROPDOWN_BG,
  SIDEBAR_DROPDOWN_LABEL,
} from "@/components/layout/sidebar-theme";
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

const MENU_CLASS =
  "z-[120] w-[min(100vw-2rem,300px)] border border-slate-200 bg-white p-2 text-slate-800 shadow-lg " +
  "data-[state=open]:animate-none data-[state=closed]:animate-none";

function formatEmpresaDisplay(name: string): string {
  const upper = (name || "HAITECH S.A.C.").toUpperCase().trim();
  if (upper.length <= 13) return upper;
  return `${upper.slice(0, 11).trim()}…`;
}

function formatSucursalDisplay(name: string): string {
  return (name || "LIMA").toUpperCase().trim();
}

function SidebarDropdownContent({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      sideOffset={6}
      collisionPadding={12}
      className={cn(MENU_CLASS, className)}
      {...props}
    />
  );
}

function ScopeDropdown({
  label,
  value,
  leadingIcon,
  children,
  open,
  onOpenChange,
}: {
  label: string;
  value: string;
  leadingIcon?: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <DropdownMenu modal={false} open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-[filter,transform] duration-75 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 active:scale-[0.99] data-[state=open]:brightness-110"
          style={{ backgroundColor: SIDEBAR_DROPDOWN_BG }}
        >
          <div className="min-w-0 flex-1">
            <p
              className="text-[9px] font-semibold uppercase leading-none tracking-[0.12em]"
              style={{ color: SIDEBAR_DROPDOWN_LABEL }}
            >
              {label}
            </p>
            <div className="mt-1 flex min-w-0 items-center gap-1">
              {leadingIcon}
              <span className="truncate text-[11px] font-bold uppercase leading-tight tracking-wide text-white">
                {value}
              </span>
            </div>
          </div>
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 text-white/85 transition-transform duration-75 group-data-[state=open]:rotate-180"
            strokeWidth={2}
          />
        </button>
      </DropdownMenuTrigger>
      {children}
    </DropdownMenu>
  );
}

const EmpresaMenuContent = memo(function EmpresaMenuContent({
  selectedValue,
  empresaNombre,
  empresaRuc,
  onEmpresaChange,
  onNavigateParametros,
}: {
  selectedValue: string;
  empresaNombre: string;
  empresaRuc: string;
  onEmpresaChange: (value: string) => void;
  onNavigateParametros: () => void;
}) {
  return (
    <SidebarDropdownContent align="start" forceMount>
      <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Empresa
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup value={selectedValue} onValueChange={onEmpresaChange}>
        <DropdownMenuRadioItem
          value={WORKSPACE_EMPRESA_SCOPE}
          className="cursor-pointer rounded-lg py-2 pl-8 pr-2"
        >
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-slate-900">{empresaNombre}</p>
            <p className="truncate text-[10px] text-slate-500">RUC {empresaRuc}</p>
          </div>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="cursor-pointer gap-2" onSelect={onNavigateParametros}>
        <Building2 className="h-4 w-4 text-slate-400" />
        Datos de empresa
      </DropdownMenuItem>
    </SidebarDropdownContent>
  );
});

const SucursalMenuContent = memo(function SucursalMenuContent({
  selectedValue,
  empresaNombre,
  sedes,
  onSucursalChange,
  onNavigateParametros,
}: {
  selectedValue: string;
  empresaNombre: string;
  sedes: Array<{ id: string; nombre: string }>;
  onSucursalChange: (value: string) => void;
  onNavigateParametros: () => void;
}) {
  return (
    <SidebarDropdownContent align="start" forceMount>
      <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Sucursales
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup value={selectedValue} onValueChange={onSucursalChange}>
        <DropdownMenuRadioItem
          value={WORKSPACE_EMPRESA_SCOPE}
          className="cursor-pointer rounded-lg py-2 pl-8 pr-2"
        >
          General · {empresaNombre}
        </DropdownMenuRadioItem>
        {sedes.map((sede) => (
          <DropdownMenuRadioItem
            key={sede.id}
            value={`sede:${sede.id}`}
            className="cursor-pointer rounded-lg py-2 pl-8 pr-2"
          >
            {sede.nombre}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      {sedes.length === 0 ? (
        <p className="px-2 py-1.5 text-xs text-slate-500">Sin sucursales registradas.</p>
      ) : null}
      <DropdownMenuSeparator />
      <DropdownMenuItem className="cursor-pointer gap-2" onSelect={onNavigateParametros}>
        <Settings2 className="h-4 w-4 text-slate-400" />
        Gestionar sucursales
      </DropdownMenuItem>
    </SidebarDropdownContent>
  );
});

export function EmpresaSucursalSwitcher({
  collapsed = false,
  className,
}: EmpresaSucursalSwitcherProps) {
  const navigate = useNavigate();
  const {
    scope,
    setScope,
    sedes,
    activeSede,
    empresaNombre,
    empresaRuc,
    empresaLogo,
    empresaIniciales,
  } = useWorkspace();

  const [empresaOpen, setEmpresaOpen] = useState(false);
  const [sucursalOpen, setSucursalOpen] = useState(false);

  const selectedValue = workspaceScopeToValue(scope);
  const empresaLabel = formatEmpresaDisplay(empresaNombre);
  const sucursalLabel = formatSucursalDisplay(activeSede?.nombre ?? "LIMA");

  const handleEmpresaChange = (value: string) => {
    if (value !== WORKSPACE_EMPRESA_SCOPE) return;
    setScope({ type: WORKSPACE_EMPRESA_SCOPE });
    setEmpresaOpen(false);
  };

  const handleSucursalChange = (value: string) => {
    setScope(workspaceValueToScope(value));
    setSucursalOpen(false);
  };

  const logoSrc = empresaLogo?.trim() || HAISALES_LOGO_SRC;
  const [logoFailed, setLogoFailed] = useState(false);

  const avatar = (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
      style={{ width: SIDEBAR_AVATAR_SIZE, height: SIDEBAR_AVATAR_SIZE }}
    >
      {logoFailed ? (
        <span className="text-xs font-bold leading-none text-[#1845ad]">{empresaIniciales}</span>
      ) : (
        <img
          src={logoSrc}
          alt={`Logo ${empresaNombre}`}
          width={SIDEBAR_AVATAR_SIZE}
          height={SIDEBAR_AVATAR_SIZE}
          decoding="async"
          loading="eager"
          fetchPriority="high"
          className="h-[90%] w-[90%] object-contain object-center"
          onError={() => setLogoFailed(true)}
        />
      )}
    </span>
  );

  if (collapsed) {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn("mx-auto flex justify-center", className)}
            aria-label="Cambiar empresa o sucursal"
          >
            {avatar}
          </button>
        </DropdownMenuTrigger>
        <SidebarDropdownContent align="start" side="right" forceMount>
          <DropdownMenuRadioGroup value={selectedValue} onValueChange={handleSucursalChange}>
            <DropdownMenuRadioItem value={WORKSPACE_EMPRESA_SCOPE}>{empresaNombre}</DropdownMenuRadioItem>
            {sedes.map((sede) => (
              <DropdownMenuRadioItem key={sede.id} value={`sede:${sede.id}`}>
                {sede.nombre}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </SidebarDropdownContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5 px-3 py-1", className)}>
      {avatar}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <ScopeDropdown
          label="Empresa"
          value={empresaLabel}
          open={empresaOpen}
          onOpenChange={setEmpresaOpen}
        >
          <EmpresaMenuContent
            selectedValue={selectedValue}
            empresaNombre={empresaNombre}
            empresaRuc={empresaRuc}
            onEmpresaChange={handleEmpresaChange}
            onNavigateParametros={() => navigate("/app/parametros")}
          />
        </ScopeDropdown>

        <ScopeDropdown
          label="Sucursal"
          value={sucursalLabel}
          open={sucursalOpen}
          onOpenChange={setSucursalOpen}
          leadingIcon={
            <MapPin className="h-3 w-3 shrink-0 text-white" strokeWidth={2.5} fill="white" />
          }
        >
          <SucursalMenuContent
            selectedValue={selectedValue}
            empresaNombre={empresaNombre}
            sedes={sedes}
            onSucursalChange={handleSucursalChange}
            onNavigateParametros={() => navigate("/app/parametros")}
          />
        </ScopeDropdown>
      </div>
    </div>
  );
}

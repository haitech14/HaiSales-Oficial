import { useMemo, useState } from "react";
import {
  ChevronDown,
  Clock,
  Copy,
  Grid3x3,
  Lock,
  Send,
  Shield,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  defaultNuevoUsuarioForm,
  type NuevoUsuarioFormData,
} from "@/lib/nuevo-usuario-types";
import {
  usuarioEstadosIniciales,
  usuarioModulos,
  usuarioOpciones2fa,
  usuarioOpcionesInvitacion,
  usuarioPermisosEspeciales,
  usuarioRoles,
  usuarioSedes,
} from "@/lib/usuarios-mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type NuevoUsuarioModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-slate-600">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function SelectField({
  value,
  onChange,
  placeholder,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20",
          value ? "text-slate-700" : "text-slate-400",
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option} className="text-slate-700">
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

export function NuevoUsuarioModal({ open, onOpenChange }: NuevoUsuarioModalProps) {
  const [form, setForm] = useState<NuevoUsuarioFormData>(defaultNuevoUsuarioForm);

  const updateField = <K extends keyof NuevoUsuarioFormData>(
    key: K,
    value: NuevoUsuarioFormData[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resumen = useMemo(() => {
    const modulosCount = form.modulosHabilitados ? 1 : 0;
    const nivelAcceso = form.rolPrincipal || "Sin asignar";
    const seguridad =
      form.autenticacion2fa === "Obligatorio"
        ? "2FA obligatoria"
        : form.autenticacion2fa === "Opcional"
          ? "2FA opcional"
          : "2FA deshabilitada";
    const estado =
      form.estadoInicial === "Invitado"
        ? "Invitación pendiente"
        : form.estadoInicial === "Activo"
          ? "Acceso activo"
          : "Cuenta inactiva";

    return { modulosCount, nivelAcceso, seguridad, estado };
  }, [form]);

  const handleClose = () => {
    onOpenChange(false);
    setForm(defaultNuevoUsuarioForm);
  };

  const handleCrear = () => {
    toast.success("Usuario creado correctamente.");
    handleClose();
  };

  const handleBorrador = () => {
    toast.success("Borrador de usuario guardado.");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-h-[95vh] max-w-[920px] gap-0 overflow-y-auto border-slate-200 p-0 sm:rounded-xl [&>button:last-child]:hidden">
        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">Nuevo usuario</DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-slate-500">
                Crea un acceso seguro y asigna rol, sede y permisos desde el inicio.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <FieldLabel required>Nombre completo</FieldLabel>
              <input
                type="text"
                value={form.nombreCompleto}
                onChange={(event) => updateField("nombreCompleto", event.target.value)}
                placeholder="Ej. Juan Pérez Rojas"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div>
              <FieldLabel required>Correo electrónico</FieldLabel>
              <input
                type="email"
                value={form.correo}
                onChange={(event) => updateField("correo", event.target.value)}
                placeholder="juan.perez@empresa.com"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div>
              <FieldLabel>Teléfono</FieldLabel>
              <input
                type="text"
                value={form.telefono}
                onChange={(event) => updateField("telefono", event.target.value)}
                placeholder="Ej. 987 654 321"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div>
              <FieldLabel required>Sede / sucursal</FieldLabel>
              <SelectField
                value={form.sede}
                onChange={(value) => updateField("sede", value)}
                placeholder="Seleccionar sede"
                options={usuarioSedes}
              />
            </div>
            <div>
              <FieldLabel>Cargo</FieldLabel>
              <input
                type="text"
                value={form.cargo}
                onChange={(event) => updateField("cargo", event.target.value)}
                placeholder="Ej. Analista de ventas"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div>
              <FieldLabel required>Usuario interno</FieldLabel>
              <input
                type="text"
                value={form.usuarioInterno}
                onChange={(event) => updateField("usuarioInterno", event.target.value)}
                placeholder="Ej. jperez"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Sin espacios. Solo letras, números, punto y guion bajo.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <FieldLabel required>Rol principal</FieldLabel>
              <SelectField
                value={form.rolPrincipal}
                onChange={(value) => updateField("rolPrincipal", value)}
                placeholder="Seleccionar rol"
                options={usuarioRoles}
              />
            </div>
            <div>
              <FieldLabel>Permisos especiales</FieldLabel>
              <SelectField
                value={form.permisosEspeciales}
                onChange={(value) => updateField("permisosEspeciales", value)}
                placeholder="Seleccionar permisos"
                options={usuarioPermisosEspeciales}
              />
            </div>
            <div>
              <FieldLabel>Módulos habilitados</FieldLabel>
              <SelectField
                value={form.modulosHabilitados}
                onChange={(value) => updateField("modulosHabilitados", value)}
                placeholder="Seleccionar módulos"
                options={usuarioModulos}
              />
            </div>
            <div>
              <FieldLabel required>Autenticación 2FA</FieldLabel>
              <SelectField
                value={form.autenticacion2fa}
                onChange={(value) => updateField("autenticacion2fa", value)}
                placeholder="Seleccionar 2FA"
                options={usuarioOpciones2fa}
              />
            </div>
            <div>
              <FieldLabel required>Estado inicial</FieldLabel>
              <SelectField
                value={form.estadoInicial}
                onChange={(value) => updateField("estadoInicial", value)}
                placeholder="Seleccionar estado"
                options={usuarioEstadosIniciales}
              />
            </div>
            <div>
              <FieldLabel required>Enviar invitación</FieldLabel>
              <SelectField
                value={form.enviarInvitacion}
                onChange={(value) => updateField("enviarInvitacion", value)}
                placeholder="Seleccionar opción"
                options={usuarioOpcionesInvitacion}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Grid3x3 className="h-4 w-4 text-blue-600" />
              </span>
              <div>
                <p className="text-[10px] text-slate-400">Módulos asignados</p>
                <p className="text-xs font-semibold text-blue-600">
                  {resumen.modulosCount} módulos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                <Lock className="h-4 w-4 text-orange-600" />
              </span>
              <div>
                <p className="text-[10px] text-slate-400">Nivel de acceso</p>
                <p className="text-xs font-semibold text-orange-600">{resumen.nivelAcceso}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <Shield className="h-4 w-4 text-emerald-600" />
              </span>
              <div>
                <p className="text-[10px] text-slate-400">Seguridad</p>
                <p className="text-xs font-semibold text-emerald-600">{resumen.seguridad}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-4 w-4 text-amber-600" />
              </span>
              <div>
                <p className="text-[10px] text-slate-400">Estado</p>
                <p className="text-xs font-semibold text-amber-600">{resumen.estado}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              className="h-9 justify-start gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => toast.info("Permisos copiados desde plantilla")}
            >
              <Copy className="h-4 w-4 text-slate-500" />
              Copiar permisos
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 justify-start gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => toast.info("Selecciona un rol para asignar")}
            >
              <Users className="h-4 w-4 text-slate-500" />
              Asignar rol
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 justify-start gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => toast.success("Invitación enviada por correo")}
            >
              <Send className="h-4 w-4 text-slate-500" />
              Enviar invitación
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleBorrador}
            className="h-9 border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
          >
            Guardar borrador
          </Button>
          <Button
            type="button"
            onClick={handleCrear}
            className="h-9 gap-2 bg-blue-600 px-4 font-semibold hover:bg-blue-500"
          >
            <UserPlus className="h-4 w-4" />
            Crear usuario
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

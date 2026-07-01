import { useState } from "react";
import {
  Braces,
  Calendar,
  CheckCheck,
  ChevronDown,
  Clock,
  Flag,
  Link2,
  List,
  MessageSquare,
  Target,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChannelIcon } from "@/components/inbox/ChannelIcon";
import {
  campanaAccionesRapidas,
  campanaAsesores,
  campanaAudiencias,
  campanaEtapasCrm,
  campanaEstados,
  campanaHorarios,
  campanaListas,
  campanaObjetivos,
  campanaPlantillas,
  campanaPrioridades,
  campanaVariables,
} from "@/lib/nueva-campana-mock-data";
import {
  defaultNuevaCampanaForm,
  type CampanaPrioridad,
  type NuevaCampanaFormData,
} from "@/lib/nueva-campana-types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type NuevaCampanaWhatsAppModalProps = {
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

function IconSelect({
  value,
  onChange,
  placeholder,
  options,
  icon: Icon,
  iconClassName,
  children,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options?: string[];
  icon?: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {Icon && (
        <Icon
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-slate-400",
            iconClassName,
          )}
        />
      )}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-9 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20",
          Icon ? "pl-9" : "pl-3",
          !value && "text-slate-400",
        )}
      >
        <option value="">{placeholder}</option>
        {options?.map((option) => (
          <option key={option} value={option} className="text-slate-700">
            {option}
          </option>
        ))}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function PrioridadSelect({
  value,
  onChange,
}: {
  value: CampanaPrioridad;
  onChange: (value: CampanaPrioridad) => void;
}) {
  const dotColor =
    value === "Alta" ? "bg-red-500" : value === "Media" ? "bg-orange-500" : "bg-emerald-500";

  return (
    <div className="relative">
      <Flag className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <div className="pointer-events-none absolute left-8 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", dotColor)} />
        <span className="text-sm font-medium text-slate-700">{value}</span>
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as CampanaPrioridad)}
        className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-transparent focus:outline-none focus:ring-2 focus:ring-blue-600/20"
      >
        {campanaPrioridades.map((prioridad) => (
          <option key={prioridad} value={prioridad} className="text-slate-700">
            {prioridad}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function EstadoSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2">
        <ChannelIcon channel="whatsapp" size="sm" className="rounded-full" />
      </div>
      <div className="pointer-events-none absolute left-10 top-1/2 z-10 -translate-y-1/2">
        <span className="text-sm font-semibold text-emerald-600">{value}</span>
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pl-10 pr-8 text-sm text-transparent focus:outline-none focus:ring-2 focus:ring-blue-600/20"
      >
        {campanaEstados.map((estado) => (
          <option key={estado} value={estado} className="text-slate-700">
            {estado}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

export function NuevaCampanaWhatsAppModal({ open, onOpenChange }: NuevaCampanaWhatsAppModalProps) {
  const [form, setForm] = useState<NuevaCampanaFormData>(defaultNuevaCampanaForm);

  const updateField = <K extends keyof NuevaCampanaFormData>(
    key: K,
    value: NuevaCampanaFormData[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handlePlantillaChange = (value: string) => {
    const plantilla = campanaPlantillas.find((item) => item.label === value);
    updateField("plantilla", value);
    if (plantilla) updateField("mensajePreview", plantilla.preview);
  };

  const handleAsesorChange = (value: string) => {
    const asesor = campanaAsesores.find((item) => item.name === value);
    updateField("asesor", value);
    if (asesor) updateField("asesorInitials", asesor.initials);
  };

  const insertVariable = (variable: string) => {
    setForm((current) => ({
      ...current,
      mensajePreview: `${current.mensajePreview}\n${variable}`,
      variablePrincipal: variable,
    }));
  };

  const handleClose = () => {
    onOpenChange(false);
    setForm(defaultNuevaCampanaForm);
  };

  const handleCrear = () => {
    toast.success("Campaña WhatsApp creada correctamente.");
    handleClose();
  };

  const handleBorrador = () => {
    toast.success("Borrador de campaña guardado.");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-h-[95vh] max-w-[920px] gap-0 overflow-y-auto border-slate-200 p-0 sm:rounded-xl [&>button:last-child]:hidden">
        {/* Header */}
        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Nueva campaña WhatsApp
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-slate-500">
                Crea una campaña segmentada y asigna seguimiento comercial automático.
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

        {/* Form */}
        <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <div>
              <FieldLabel required>Nombre de campaña</FieldLabel>
              <input
                type="text"
                value={form.nombre}
                onChange={(event) => updateField("nombre", event.target.value)}
                placeholder="Ej. Promoción junio - Nuevos leads"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div>
              <FieldLabel required>Audiencia / segmento</FieldLabel>
              <IconSelect
                icon={Users}
                value={form.audiencia}
                onChange={(value) => updateField("audiencia", value)}
                placeholder="Selecciona un segmento"
                options={campanaAudiencias}
              />
            </div>
            <div>
              <FieldLabel required>Lista de contactos</FieldLabel>
              <IconSelect
                icon={List}
                value={form.listaContactos}
                onChange={(value) => updateField("listaContactos", value)}
                placeholder="Selecciona una lista"
                options={campanaListas}
              />
            </div>
            <div>
              <FieldLabel required>Plantilla de mensaje</FieldLabel>
              <IconSelect
                icon={MessageSquare}
                value={form.plantilla}
                onChange={handlePlantillaChange}
                placeholder="Selecciona una plantilla"
                options={campanaPlantillas.map((item) => item.label)}
              />
            </div>
            <div>
              <FieldLabel required>Variable principal</FieldLabel>
              <IconSelect
                icon={Braces}
                value={form.variablePrincipal}
                onChange={(value) => updateField("variablePrincipal", value)}
                placeholder="Selecciona una variable"
                options={campanaVariables}
              />
            </div>
            <div>
              <FieldLabel required>Fecha de envío</FieldLabel>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.fechaEnvio}
                    onChange={(event) => updateField("fechaEnvio", event.target.value)}
                    placeholder="Selecciona fecha de envío"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <div className="relative w-28 shrink-0">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="time"
                    value={form.horaEnvio}
                    onChange={(event) => updateField("horaEnvio", event.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div>
              <FieldLabel required>Asesor responsable</FieldLabel>
              <div className="relative">
                <Avatar className="pointer-events-none absolute left-2 top-1/2 z-10 h-6 w-6 -translate-y-1/2">
                  <AvatarFallback className="bg-blue-100 text-[9px] font-semibold text-blue-700">
                    {form.asesorInitials}
                  </AvatarFallback>
                </Avatar>
                <select
                  value={form.asesor}
                  onChange={(event) => handleAsesorChange(event.target.value)}
                  className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-0 pl-10 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  {campanaAsesores.map((asesor) => (
                    <option key={asesor.name} value={asesor.name}>
                      {asesor.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <FieldLabel required>Objetivo</FieldLabel>
              <IconSelect
                icon={Target}
                value={form.objetivo}
                onChange={(value) => updateField("objetivo", value)}
                placeholder="Selecciona el objetivo"
                options={campanaObjetivos}
              />
            </div>
            <div>
              <FieldLabel required>Etapa CRM destino</FieldLabel>
              <IconSelect
                icon={Flag}
                iconClassName="text-slate-300"
                value={form.etapaCrm}
                onChange={(value) => updateField("etapaCrm", value)}
                placeholder="Selecciona la etapa"
                options={campanaEtapasCrm}
              />
            </div>
            <div>
              <FieldLabel required>Prioridad</FieldLabel>
              <PrioridadSelect
                value={form.prioridad}
                onChange={(value) => updateField("prioridad", value)}
              />
            </div>
            <div>
              <FieldLabel required>Horario permitido</FieldLabel>
              <IconSelect
                icon={Clock}
                value={form.horarioPermitido}
                onChange={(value) => updateField("horarioPermitido", value)}
                placeholder="Selecciona horario"
                options={campanaHorarios}
              />
            </div>
            <div>
              <FieldLabel required>Estado inicial</FieldLabel>
              <EstadoSelect
                value={form.estadoInicial}
                onChange={(value) => updateField("estadoInicial", value as NuevaCampanaFormData["estadoInicial"])}
              />
            </div>
          </div>
        </div>

        {/* Preview section */}
        <div className="border-t border-slate-100 px-6 py-5">
          <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/40 p-4 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <ChannelIcon channel="whatsapp" size="sm" className="rounded-full" />
                <span className="text-sm font-semibold text-slate-800">Vista previa del mensaje</span>
              </div>
              <div className="rounded-xl bg-[#e5ddd5] p-4">
                <div className="max-w-sm rounded-lg rounded-tl-none bg-white px-3 py-2.5 shadow-sm">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
                    {form.mensajePreview}
                  </p>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <span className="text-xs text-slate-400">11:30</span>
                    <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-[220px] lg:w-[260px]">
              <p className="mb-3 text-xs font-medium text-slate-500">
                Insertar variable o acción rápida
              </p>
              <div className="space-y-2">
                {campanaAccionesRapidas.map((accion) => {
                  const ActionIcon =
                    accion.id === "nombre"
                      ? Users
                      : accion.id === "enlace"
                        ? Link2
                        : UserPlus;

                  return (
                    <button
                      key={accion.id}
                      type="button"
                      onClick={() => insertVariable(accion.variable)}
                      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <ActionIcon className="h-4 w-4 text-slate-500" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700">{accion.label}</p>
                        <p className="text-xs text-blue-600">{accion.variable}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
            className="h-9 bg-blue-600 px-5 font-semibold hover:bg-blue-500"
          >
            Crear campaña
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

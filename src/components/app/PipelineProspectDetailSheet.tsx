import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  CalendarClock,
  ClipboardList,
  FileText,
  Info,
  Loader2,
  Plus,
  User,
  UserRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { fetchProspectDetail, formatPipelineCurrency } from "@/lib/crm/crm-service";
import {
  buildOwnerInitials,
  formatContactPhone,
  isPlaceholderOwner,
  resolveOwnerName,
} from "@/lib/crm/contact-display-name";
import { isGenericLastMessage } from "@/lib/inbox/empty-conversations-cleanup";
import type { ProspectDetail } from "@/lib/crm-mock-data";
import type { PipelineCard } from "@/lib/pipeline-mock-data";
import { cn } from "@/lib/utils";

type PipelineProspectDetailSheetProps = {
  codigo: string | null;
  preview?: PipelineCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (codigo: string) => void;
  userId?: string;
};

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ChannelBadge({ badge }: { badge?: string }) {
  if (badge === "WhatsApp") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        <WhatsAppGlyph className="h-3.5 w-3.5" />
        WhatsApp
      </span>
    );
  }
  if (badge === "Facebook") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
        Facebook
      </span>
    );
  }
  if (badge === "Instagram") {
    return (
      <span className="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-1 text-[11px] font-semibold text-pink-700">
        Instagram
      </span>
    );
  }
  return null;
}

function whatsAppUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

function WhatsAppLink({ phone }: { phone: string }) {
  const formatted = formatContactPhone(phone) || phone;
  const url = whatsAppUrl(formatted);
  if (!url) return <span>{phone || "—"}</span>;

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="truncate">{formatted}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={`Abrir WhatsApp: ${formatted}`}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition hover:bg-emerald-200"
      >
        <WhatsAppGlyph className="h-3.5 w-3.5" />
        <span className="sr-only">Abrir WhatsApp</span>
      </a>
    </span>
  );
}

function Field({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-slate-400">{label}</dt>
      <dd className={cn("mt-0.5 text-[13px] font-medium text-slate-800", valueClassName)}>{value || "—"}</dd>
    </div>
  );
}

function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-[12px] font-semibold text-blue-600", className)}>
      {children}
    </span>
  );
}

function SectionCard({
  title,
  icon: Icon,
  iconClassName,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg text-white", iconClassName)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function formatMessageTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function RecentMessages({
  messages,
}: {
  messages: Array<{ id: string; direction: "inbound" | "outbound"; body: string; sentAt: string }>;
}) {
  return (
    <div className="space-y-2">
      <dt className="text-[11px] text-slate-400">Últimos mensajes</dt>
      <dd className="space-y-2">
        {messages.map((message) => {
          const outbound = message.direction === "outbound";
          return (
            <div
              key={message.id}
              className={cn("flex", outbound ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[92%] rounded-2xl px-3 py-2 text-[12px] leading-snug",
                  outbound
                    ? "rounded-br-md bg-blue-50 text-slate-800"
                    : "rounded-bl-md bg-emerald-50 text-slate-800",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p className={cn("mt-1 text-[10px]", outbound ? "text-right text-blue-400" : "text-emerald-500")}>
                  {outbound ? "Tú · " : ""}
                  {formatMessageTime(message.sentAt)}
                </p>
              </div>
            </div>
          );
        })}
      </dd>
    </div>
  );
}

function PersonRow({ initials, name }: { initials: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarFallback className="bg-blue-100 text-[9px] font-semibold text-blue-700">{initials}</AvatarFallback>
      </Avatar>
      <span className="truncate text-[13px] font-medium text-slate-800">{name || "—"}</span>
    </div>
  );
}

export function PipelineProspectDetailSheet({
  codigo,
  preview,
  open,
  onOpenChange,
  onEdit,
  userId,
}: PipelineProspectDetailSheetProps) {
  const { displayName, initials: defaultInitials } = useUserProfile();
  const [detail, setDetail] = useState<ProspectDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !codigo) {
      setDetail(null);
      return;
    }
    if (!userId) {
      setDetail(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    void fetchProspectDetail(codigo, userId).then((result) => {
      setDetail(result);
      setLoading(false);
    });
  }, [open, codigo, userId]);

  const rawTitle = (detail?.titulo || preview?.title || "").trim();
  const title = /^oportunidad(\s|$|[—\-:])/i.test(rawTitle)
    ? detail?.clienteNombre || preview?.contactName || preview?.company || "—"
    : rawTitle || "—";
  const phone =
    formatContactPhone(preview?.contactPhone) ||
    formatContactPhone(detail?.cliente?.telefono) ||
    formatContactPhone(detail?.cliente?.celular) ||
    formatContactPhone(detail?.clienteRuc) ||
    formatContactPhone(preview?.intereses) ||
    "—";
  const source = detail?.statusBadge || preview?.statusBadge || "Manual";
  const stage = detail?.pipelineStage || "Prospección";
  const probability = detail?.probabilidad ?? 10;
  const value = detail?.valor ?? preview?.value ?? 0;
  const createdAt = detail?.fechaOportunidad || preview?.dueDate || "—";
  const closeDate = detail?.fechaCierreEstimada ?? "—";
  const description = detail?.subtitulo?.trim() || preview?.lastMessage || "—";
  const recentMessages = detail?.recentMessages ?? [];
  const showGenericDescription =
    recentMessages.length === 0 && !isGenericLastMessage(description === "—" ? "" : description);
  const notes = detail?.cliente?.observaciones?.trim() || "—";
  const rawOwner = detail?.responsable || preview?.owner || "";
  const owner = resolveOwnerName(rawOwner, displayName);
  const ownerInitials = isPlaceholderOwner(rawOwner)
    ? defaultInitials
    : detail?.responsableIniciales || preview?.ownerInitials || buildOwnerInitials(owner);
  const tipoCliente = detail?.cliente?.tipoCliente || preview?.tipoCliente || "—";
  const channelBadge = detail?.statusBadge || preview?.statusBadge;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-slate-900/40"
        className="flex max-h-[min(92vh,860px)] w-full max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl"
      >
        <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-5">
          <DialogTitle className="pr-8 text-left text-[20px] font-bold text-slate-900">
            Detalles de la oportunidad
          </DialogTitle>
          <DialogDescription className="mt-2.5 flex flex-wrap items-center gap-2 text-left">
            <ChannelBadge badge={channelBadge} />
            {codigo ? (
              <span className="text-[13px] text-slate-500">Código {codigo}</span>
            ) : null}
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading && !detail && !preview ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando oportunidad...
            </div>
          ) : (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <SectionCard title="Información general" icon={ClipboardList} iconClassName="bg-blue-500">
                  <dl className="space-y-3">
                    <Field label="Nombre" value={title} />
                    <Field label="Número" value={<WhatsAppLink phone={phone} />} />
                    <Field label="Fuente" value={source} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Etapa actual" value={<Pill>{stage}</Pill>} />
                      <Field label="Probabilidad de éxito" value={<Pill>{probability}%</Pill>} />
                    </div>
                    <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                      <Field
                        label="Valor estimado"
                        value={formatPipelineCurrency(value)}
                        valueClassName="font-bold text-blue-600"
                      />
                      <Field label="Fecha de creación" value={createdAt} />
                      <Field label="Fecha de cierre estimada" value={closeDate} />
                    </div>
                  </dl>
                </SectionCard>

                <SectionCard title="Resumen" icon={FileText} iconClassName="bg-amber-400">
                  <dl className="space-y-3">
                    {recentMessages.length > 0 ? (
                      <RecentMessages messages={recentMessages} />
                    ) : loading ? (
                      <div className="flex items-center gap-2 py-1 text-[12px] text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Cargando mensajes de WhatsApp...
                      </div>
                    ) : (
                      <Field
                        label="Descripción"
                        value={showGenericDescription ? description : "Sin mensajes recientes"}
                      />
                    )}
                    <Field label="Notas internas" value={notes} />
                  </dl>
                </SectionCard>
              </div>

              <div className="space-y-4">
                <SectionCard title="Cliente" icon={User} iconClassName="bg-emerald-500">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <Field label="RUC" value={detail?.clienteRuc || "—"} />
                    <Field label="Tipo" value={tipoCliente} />
                    <Field label="Segmento" value={detail?.cliente?.segmento || "—"} />
                    <Field label="Estado" value={detail?.cliente?.estadoComercial || "Prospecto"} />
                    <Field label="Contacto principal" value={detail?.cliente?.contacto || "—"} />
                    <Field
                      label="Teléfono"
                      value={
                        <WhatsAppLink
                          phone={detail?.cliente?.telefono || detail?.cliente?.celular || phone}
                        />
                      }
                    />
                    <Field label="Email" value={detail?.cliente?.correo || "—"} />
                    <Field
                      label="Ubicación"
                      value={[detail?.cliente?.direccion, detail?.cliente?.ciudad].filter(Boolean).join(" · ") || "—"}
                    />
                  </dl>
                </SectionCard>

                <SectionCard title="Seguimiento" icon={CalendarClock} iconClassName="bg-violet-500">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <Field label="Último contacto" value={createdAt} />
                    <Field label="Próxima acción" value="—" />
                    <div>
                      <dt className="text-[11px] text-slate-400">Responsable</dt>
                      <dd className="mt-0.5">
                        <PersonRow initials={ownerInitials} name={owner} />
                      </dd>
                    </div>
                    <Field label="Cierre estimado" value={closeDate} />
                  </dl>
                </SectionCard>

                <SectionCard title="Responsable" icon={UserRound} iconClassName="bg-blue-500">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <dt className="text-[11px] text-slate-400">Asignado a</dt>
                      <dd className="mt-0.5">
                        <PersonRow initials={ownerInitials} name={owner} />
                      </dd>
                    </div>
                    <Field label="Equipo" value="—" />
                  </dl>
                </SectionCard>

                <SectionCard title="Actividades recientes" icon={Activity} iconClassName="bg-sky-400">
                  <div className="rounded-lg bg-sky-50 px-3 py-3 text-[13px] text-sky-800">
                    <p className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                      Aún no hay actividades registradas para esta oportunidad.
                    </p>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-500"
                    >
                      <Plus className="h-4 w-4" />
                      Registrar actividad
                    </button>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg border-slate-200 px-5 text-slate-700"
            onClick={() => codigo && onEdit?.(codigo)}
            disabled={!codigo}
          >
            Editar
          </Button>
          <Button
            type="button"
            className="h-10 rounded-lg bg-blue-600 px-5 hover:bg-blue-500"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

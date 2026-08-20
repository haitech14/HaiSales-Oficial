import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { formatContactPhone } from "@/lib/crm/contact-display-name";
import { cn } from "@/lib/utils";

function whatsAppUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function digitsFromPhone(value: string) {
  if (!value || value === "—") return "";
  return value.replace(/\D/g, "");
}

type ClientesWhatsAppCellProps = {
  telefono: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
};

export function ClientesWhatsAppCell({ telefono, onSave, className }: ClientesWhatsAppCellProps) {
  const rawDigits = digitsFromPhone(telefono);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(rawDigits);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) setDraft(rawDigits);
  }, [isEditing, rawDigits]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const formatted = formatContactPhone(rawDigits) ?? rawDigits;
  const url = formatted ? whatsAppUrl(formatted) : null;

  const save = async () => {
    const nextDigits = draft.replace(/\D/g, "");
    const nextValue = nextDigits || "—";
    const currentValue = rawDigits || "—";
    if (nextValue === currentValue) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(nextValue);
      setIsEditing(false);
    } catch {
      setDraft(rawDigits);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className={cn("relative min-w-[120px]", className)}>
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="999999999"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => void save()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void save();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setDraft(rawDigits);
              setIsEditing(false);
            }
          }}
          disabled={isSaving}
          className="w-full rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-slate-800 shadow-sm outline-none ring-2 ring-blue-100"
        />
        {isSaving ? (
          <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-blue-500" />
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-[28px] w-full min-w-0 items-center gap-1", className)}>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
          title={`Abrir WhatsApp: ${formatted}`}
          aria-label={`Abrir WhatsApp: ${formatted}`}
        >
          <WhatsAppGlyph className="h-3.5 w-3.5" />
        </a>
      ) : null}
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        title={rawDigits ? "Clic para editar celular" : "Clic para agregar celular"}
        className="group/cell flex min-h-[28px] min-w-0 flex-1 items-center gap-1 rounded px-1 text-left transition hover:bg-blue-50 hover:ring-1 hover:ring-blue-200"
      >
        {rawDigits ? (
          <span className="truncate text-[12px] font-medium text-emerald-700">{formatted}</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[12px] text-slate-400">
            <Plus className="h-3 w-3" />
            Agregar celular
          </span>
        )}
        <Pencil className="h-3 w-3 shrink-0 text-blue-500 opacity-0 transition group-hover/cell:opacity-100" />
      </button>
    </div>
  );
}

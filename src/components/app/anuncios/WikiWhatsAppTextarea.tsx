import { useEffect, useRef, useState, type TextareaHTMLAttributes } from "react";
import { SmilePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WhatsAppFormatToolbar } from "@/components/app/anuncios/WhatsAppFormatToolbar";
import {
  getTextareaSelectionRect,
  insertAtCaret,
  normalizeWhatsAppClipboardText,
  renderWhatsAppText,
  WA_FORMAT,
  WHATSAPP_EMOJIS,
  wrapSelection,
} from "@/lib/anuncios/whatsapp-text";
import { cn } from "@/lib/utils";

type WikiWhatsAppTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  /** Se llama tras pegar (texto ya normalizado) para ajustar alto del bloque, etc. */
  onPasteText?: (nextValue: string) => void;
  placeholder?: string;
  rows?: number;
  showPreview?: boolean;
  singleLine?: boolean;
  hideEmojiPicker?: boolean;
  /** Muestra barra flotante de formato al seleccionar texto */
  showFormatToolbar?: boolean;
  /** El textarea ocupa todo el alto disponible del contenedor */
  fillHeight?: boolean;
  className?: string;
  inputClassName?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "rows">;

export function WhatsAppEmojiPicker({
  onPick,
  className,
}: {
  onPick: (emoji: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700",
            className,
          )}
          aria-label="Insertar emoji WhatsApp"
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[240px] p-2">
        <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Emojis WhatsApp
        </p>
        <div className="grid grid-cols-6 gap-0.5">
          {WHATSAPP_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex h-8 items-center justify-center rounded-md text-base transition hover:bg-slate-100"
              onClick={() => {
                onPick(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function WikiWhatsAppTextarea({
  value,
  onChange,
  onPasteText,
  placeholder,
  rows = 4,
  showPreview = false,
  singleLine = false,
  hideEmojiPicker = false,
  showFormatToolbar = true,
  fillHeight = false,
  className,
  inputClassName,
  ...rest
}: WikiWhatsAppTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [toolbar, setToolbar] = useState<{
    x: number;
    y: number;
    start: number;
    end: number;
  } | null>(null);

  const syncAutoHeight = () => {
    const el = ref.current;
    if (!el || singleLine || fillHeight) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 80)}px`;
  };

  useEffect(() => {
    syncAutoHeight();
  }, [value, singleLine, fillHeight]);

  const updateToolbarFromSelection = () => {
    const el = ref.current;
    if (!el || singleLine || !showFormatToolbar) {
      setToolbar(null);
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start === end || document.activeElement !== el) {
      setToolbar(null);
      return;
    }
    const rect = getTextareaSelectionRect(el, end);
    setToolbar({
      x: rect.left,
      y: rect.top,
      start,
      end,
    });
  };

  const insertEmoji = (emoji: string) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const { next, caret } = insertAtCaret(value, emoji, start, end);
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
      syncAutoHeight();
      setToolbar(null);
    });
  };

  const applyFormat = (next: string, start: number, end: number) => {
    const el = ref.current;
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, end);
      syncAutoHeight();
      updateToolbarFromSelection();
    });
  };

  return (
    <div className={cn(fillHeight ? "flex min-h-0 flex-1 flex-col" : "space-y-1.5", className)}>
      <div className={cn("relative", fillHeight && "min-h-0 flex-1")}>
        <textarea
          ref={ref}
          value={value}
          rows={singleLine ? 1 : rows}
          placeholder={placeholder}
          onChange={(event) => {
            const next = singleLine
              ? event.target.value.replace(/\n/g, " ")
              : event.target.value;
            onChange(next);
            requestAnimationFrame(syncAutoHeight);
            requestAnimationFrame(updateToolbarFromSelection);
          }}
          onSelect={updateToolbarFromSelection}
          onKeyUp={updateToolbarFromSelection}
          onMouseUp={updateToolbarFromSelection}
          onBlur={() => {
            // Retraso breve para permitir click en la barra flotante
            window.setTimeout(() => {
              if (!ref.current) return;
              if (document.activeElement === ref.current) return;
              setToolbar(null);
            }, 150);
          }}
          onPaste={(event) => {
            if (singleLine) return;
            const raw = event.clipboardData.getData("text/plain");
            if (!raw) return;
            event.preventDefault();
            const pasted = normalizeWhatsAppClipboardText(raw);
            const el = ref.current;
            const start = el?.selectionStart ?? value.length;
            const end = el?.selectionEnd ?? value.length;
            const { next, caret } = insertAtCaret(value, pasted, start, end);
            onChange(next);
            onPasteText?.(next);
            requestAnimationFrame(() => {
              if (!el) return;
              el.focus();
              el.setSelectionRange(caret, caret);
              syncAutoHeight();
            });
          }}
          onKeyDown={(event) => {
            if (singleLine && event.key === "Enter") {
              event.preventDefault();
            }
            if ((event.ctrlKey || event.metaKey) && !singleLine) {
              const el = ref.current;
              if (!el) return;
              const start = el.selectionStart ?? 0;
              const end = el.selectionEnd ?? 0;
              if (start === end) return;
              const key = event.key.toLowerCase();
              if (key === "b") {
                event.preventDefault();
                const result = wrapSelection(value, start, end, WA_FORMAT.bold);
                applyFormat(result.next, result.start, result.end);
              }
              if (key === "i") {
                event.preventDefault();
                const result = wrapSelection(value, start, end, WA_FORMAT.italic);
                applyFormat(result.next, result.start, result.end);
              }
              if (key === "u") {
                event.preventDefault();
                const result = wrapSelection(value, start, end, WA_FORMAT.underline);
                applyFormat(result.next, result.start, result.end);
              }
            }
          }}
          className={cn(
            "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/15",
            fillHeight
              ? "absolute inset-0 h-full resize-none overflow-y-auto"
              : "resize-none overflow-hidden",
            !hideEmojiPicker && "pr-9",
            singleLine && "min-h-[36px] resize-none overflow-hidden py-1.5",
            inputClassName,
          )}
          {...rest}
        />
        {!hideEmojiPicker && (
          <div className="absolute right-1 top-1">
            <WhatsAppEmojiPicker onPick={insertEmoji} />
          </div>
        )}
      </div>
      {showPreview && value.trim() && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
          {renderWhatsAppText(value)}
        </div>
      )}

      <WhatsAppFormatToolbar
        visible={Boolean(toolbar)}
        x={toolbar?.x ?? 0}
        y={toolbar?.y ?? 0}
        value={value}
        selectionStart={toolbar?.start ?? 0}
        selectionEnd={toolbar?.end ?? 0}
        onApply={applyFormat}
      />
    </div>
  );
}

export function WikiWhatsAppInput({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  hideEmojiPicker = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  hideEmojiPicker?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const insertEmoji = (emoji: string) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const { next, caret } = insertAtCaret(value, emoji, start, end);
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className={cn("relative flex min-w-0 flex-1 items-center gap-1", className)}>
      <input
        ref={ref}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none",
          inputClassName,
        )}
      />
      {!hideEmojiPicker && <WhatsAppEmojiPicker onPick={insertEmoji} />}
    </div>
  );
}

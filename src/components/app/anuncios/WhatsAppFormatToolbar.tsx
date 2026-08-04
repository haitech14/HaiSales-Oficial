import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Code2,
  AArrowDown,
  AArrowUp,
  Palette,
} from "lucide-react";
import {
  WA_FORMAT,
  WHATSAPP_TEXT_COLORS,
  wrapSelection,
  wrapSelectionColor,
  type FormatWrap,
} from "@/lib/anuncios/whatsapp-text";
import { cn } from "@/lib/utils";

type WhatsAppFormatToolbarProps = {
  visible: boolean;
  x: number;
  y: number;
  value: string;
  selectionStart: number;
  selectionEnd: number;
  onApply: (next: string, start: number, end: number) => void;
};

function ToolBtn({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(event) => {
        // Evita que el textarea pierda la selección
        event.preventDefault();
      }}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15",
        active && "bg-white/20",
      )}
    >
      {children}
    </button>
  );
}

export function WhatsAppFormatToolbar({
  visible,
  x,
  y,
  value,
  selectionStart,
  selectionEnd,
  onApply,
}: WhatsAppFormatToolbarProps) {
  const [colorsOpen, setColorsOpen] = useState(false);

  useEffect(() => {
    if (!visible) setColorsOpen(false);
  }, [visible]);

  if (!visible || typeof document === "undefined") return null;

  const applyWrap = (wrap: FormatWrap) => {
    const result = wrapSelection(value, selectionStart, selectionEnd, wrap);
    onApply(result.next, result.start, result.end);
  };

  const applyColor = (hex: string) => {
    const result = wrapSelectionColor(value, selectionStart, selectionEnd, hex);
    onApply(result.next, result.start, result.end);
    setColorsOpen(false);
  };

  const left = Math.min(Math.max(12, x - 140), window.innerWidth - 300);
  const top = Math.max(12, y - 52);

  return createPortal(
    <div
      role="toolbar"
      data-wa-format-toolbar
      aria-label="Formato de texto WhatsApp"
      className="pointer-events-auto fixed z-[200] flex items-center gap-0.5 rounded-2xl border border-white/10 bg-[#1f2c34] px-1.5 py-1 shadow-xl shadow-black/30"
      style={{ left, top }}
      onMouseDown={(event) => event.preventDefault()}
    >
      <ToolBtn label="Negrita (*texto*)" onClick={() => applyWrap(WA_FORMAT.bold)}>
        <Bold className="h-3.5 w-3.5" strokeWidth={2.4} />
      </ToolBtn>
      <ToolBtn label="Cursiva (_texto_)" onClick={() => applyWrap(WA_FORMAT.italic)}>
        <Italic className="h-3.5 w-3.5" strokeWidth={2.4} />
      </ToolBtn>
      <ToolBtn label="Tachado (~texto~)" onClick={() => applyWrap(WA_FORMAT.strike)}>
        <Strikethrough className="h-3.5 w-3.5" strokeWidth={2.4} />
      </ToolBtn>
      <ToolBtn label="Subrayado (+texto+)" onClick={() => applyWrap(WA_FORMAT.underline)}>
        <Underline className="h-3.5 w-3.5" strokeWidth={2.4} />
      </ToolBtn>
      <ToolBtn label="Mono (`texto`)" onClick={() => applyWrap(WA_FORMAT.mono)}>
        <Code2 className="h-3.5 w-3.5" strokeWidth={2.2} />
      </ToolBtn>

      <span className="mx-0.5 h-5 w-px bg-white/15" />

      <ToolBtn label="Reducir tamaño" onClick={() => applyWrap(WA_FORMAT.small)}>
        <AArrowDown className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn label="Aumentar tamaño" onClick={() => applyWrap(WA_FORMAT.big)}>
        <AArrowUp className="h-3.5 w-3.5" />
      </ToolBtn>

      <span className="mx-0.5 h-5 w-px bg-white/15" />

      <div className="relative">
        <ToolBtn
          label="Color"
          active={colorsOpen}
          onClick={() => setColorsOpen((open) => !open)}
        >
          <Palette className="h-3.5 w-3.5" />
        </ToolBtn>
        {colorsOpen && (
          <div className="absolute left-1/2 top-full z-10 mt-2 flex -translate-x-1/2 gap-1 rounded-xl border border-white/10 bg-[#1f2c34] p-1.5 shadow-lg">
            {WHATSAPP_TEXT_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                title={color.label}
                aria-label={color.label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyColor(color.hex)}
                className="h-6 w-6 rounded-full border border-white/20 transition hover:scale-110"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

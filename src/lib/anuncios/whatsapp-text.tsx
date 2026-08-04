import type { ReactNode } from "react";

/** Emojis frecuentes en mensajes comerciales WhatsApp */
export const WHATSAPP_EMOJIS = [
  "👋",
  "🙋‍♂️",
  "🙋‍♀️",
  "✅",
  "📌",
  "📍",
  "🎁",
  "💥",
  "📅",
  "📮",
  "📦",
  "💰",
  "💳",
  "🖨️",
  "💻",
  "📱",
  "🚚",
  "⭐",
  "🔥",
  "✨",
  "📝",
  "🔗",
  "❗",
  "❓",
  "👍",
  "🙏",
  "😊",
  "🤝",
  "🏢",
  "🛠️",
] as const;

/** Colores rápidos para resaltar (se ven en HaiSales; WhatsApp usa el texto plano) */
export const WHATSAPP_TEXT_COLORS = [
  { id: "rose", hex: "#e11d48", label: "Rojo" },
  { id: "orange", hex: "#ea580c", label: "Naranja" },
  { id: "amber", hex: "#d97706", label: "Ámbar" },
  { id: "green", hex: "#16a34a", label: "Verde" },
  { id: "blue", hex: "#2563eb", label: "Azul" },
  { id: "violet", hex: "#7c3aed", label: "Violeta" },
  { id: "slate", hex: "#334155", label: "Gris" },
] as const;

type Segment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "strike"; value: string }
  | { type: "underline"; value: string }
  | { type: "mono"; value: string }
  | { type: "color"; value: string; color: string }
  | { type: "big"; value: string }
  | { type: "small"; value: string };

/**
 * Tokens WhatsApp + extensiones HaiSales:
 * *negrita*  _cursiva_  ~tachado~  +subrayado+  `mono`
 * {#rrggbb}color{/c}  {+}grande{+}  {-}pequeño{-}
 */
const TOKEN_RE =
  /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|\+[^\+\n]+\+|`[^`\n]+`|\{#[0-9a-fA-F]{3,8}\}[^{]+?\{\/c\}|\{\+\}[^{]+?\{\+\}|\{-\}[^{]+?\{-\})/g;

function parseLine(line: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  const matches = line.matchAll(TOKEN_RE);

  for (const match of matches) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", value: line.slice(lastIndex, index) });
    }
    const token = match[0];
    if (token.startsWith("{#") && token.includes("{/c}")) {
      const close = token.indexOf("}");
      const color = token.slice(2, close);
      const value = token.slice(close + 1, token.length - 4);
      segments.push({ type: "color", value, color: `#${color}` });
    } else if (token.startsWith("{+}") && token.endsWith("{+}")) {
      segments.push({ type: "big", value: token.slice(3, -3) });
    } else if (token.startsWith("{-}") && token.endsWith("{-}")) {
      segments.push({ type: "small", value: token.slice(3, -3) });
    } else if (token.startsWith("*") && token.endsWith("*")) {
      segments.push({ type: "bold", value: token.slice(1, -1) });
    } else if (token.startsWith("_") && token.endsWith("_")) {
      segments.push({ type: "italic", value: token.slice(1, -1) });
    } else if (token.startsWith("~") && token.endsWith("~")) {
      segments.push({ type: "strike", value: token.slice(1, -1) });
    } else if (token.startsWith("+") && token.endsWith("+")) {
      segments.push({ type: "underline", value: token.slice(1, -1) });
    } else if (token.startsWith("`") && token.endsWith("`")) {
      segments.push({ type: "mono", value: token.slice(1, -1) });
    }
    lastIndex = index + token.length;
  }

  if (lastIndex < line.length) {
    segments.push({ type: "text", value: line.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: line }];
}

function renderSegment(segment: Segment, key: string): ReactNode {
  if (segment.type === "bold") {
    return (
      <strong key={key} className="font-semibold">
        {segment.value}
      </strong>
    );
  }
  if (segment.type === "italic") {
    return (
      <em key={key} className="italic">
        {segment.value}
      </em>
    );
  }
  if (segment.type === "strike") {
    return (
      <span key={key} className="line-through">
        {segment.value}
      </span>
    );
  }
  if (segment.type === "underline") {
    return (
      <span key={key} className="underline underline-offset-2">
        {segment.value}
      </span>
    );
  }
  if (segment.type === "mono") {
    return (
      <code key={key} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px]">
        {segment.value}
      </code>
    );
  }
  if (segment.type === "color") {
    return (
      <span key={key} style={{ color: segment.color }} className="font-medium">
        {segment.value}
      </span>
    );
  }
  if (segment.type === "big") {
    return (
      <span key={key} className="text-[15px] font-medium leading-snug">
        {segment.value}
      </span>
    );
  }
  if (segment.type === "small") {
    return (
      <span key={key} className="text-[11px] leading-snug text-slate-600">
        {segment.value}
      </span>
    );
  }
  return <span key={key}>{segment.value}</span>;
}

/** Renderiza formato WhatsApp (+ extensiones HaiSales de color/tamaño/subrayado). */
export function renderWhatsAppText(text: string): ReactNode {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, lineIndex) => (
    <span key={`line-${lineIndex}`}>
      {lineIndex > 0 && <br />}
      {parseLine(line).map((segment, segmentIndex) =>
        renderSegment(segment, `${lineIndex}-${segmentIndex}`),
      )}
    </span>
  ));
}

export function insertAtCaret(
  value: string,
  insertion: string,
  start: number,
  end: number,
): { next: string; caret: number } {
  const next = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
  return { next, caret: start + insertion.length };
}

export type FormatWrap = { left: string; right: string };

export const WA_FORMAT = {
  bold: { left: "*", right: "*" },
  italic: { left: "_", right: "_" },
  strike: { left: "~", right: "~" },
  underline: { left: "+", right: "+" },
  mono: { left: "`", right: "`" },
  big: { left: "{+}", right: "{+}" },
  small: { left: "{-}", right: "{-}" },
} as const satisfies Record<string, FormatWrap>;

/** Envuelve (o quita) el formato alrededor de la selección. */
export function wrapSelection(
  value: string,
  start: number,
  end: number,
  wrap: FormatWrap,
): { next: string; start: number; end: number } {
  const { left, right } = wrap;
  if (start > end) return wrapSelection(value, end, start, wrap);

  const selected = value.slice(start, end);

  if (
    selected.startsWith(left) &&
    selected.endsWith(right) &&
    selected.length >= left.length + right.length
  ) {
    const inner = selected.slice(left.length, selected.length - right.length);
    const next = `${value.slice(0, start)}${inner}${value.slice(end)}`;
    return { next, start, end: start + inner.length };
  }

  if (
    start >= left.length &&
    end + right.length <= value.length &&
    value.slice(start - left.length, start) === left &&
    value.slice(end, end + right.length) === right
  ) {
    const next = `${value.slice(0, start - left.length)}${selected}${value.slice(end + right.length)}`;
    return { next, start: start - left.length, end: end - left.length };
  }

  if (start === end) {
    const next = `${value.slice(0, start)}${left}${right}${value.slice(end)}`;
    const caret = start + left.length;
    return { next, start: caret, end: caret };
  }

  const next = `${value.slice(0, start)}${left}${selected}${right}${value.slice(end)}`;
  return { next, start: start + left.length, end: end + left.length };
}

export function wrapSelectionColor(
  value: string,
  start: number,
  end: number,
  hex: string,
): { next: string; start: number; end: number } {
  const clean = hex.replace(/^#/, "");
  return wrapSelection(value, start, end, {
    left: `{#${clean}}`,
    right: "{/c}",
  });
}

/**
 * Normaliza texto pegado desde WhatsApp/clipboard:
 * conserva líneas en blanco entre párrafos (espaciado útil),
 * unifica saltos de línea y evita rachas absurdas de vacíos.
 */
export function normalizeWhatsAppClipboardText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "\n");
}

/** Coordenadas aprox. del caret/selección en un textarea (para barra flotante). */
export function getTextareaSelectionRect(
  textarea: HTMLTextAreaElement,
  selectionEnd: number,
): { top: number; left: number; bottom: number } {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");
  const properties = [
    "boxSizing",
    "width",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "letterSpacing",
    "textTransform",
    "textAlign",
    "lineHeight",
    "wordSpacing",
    "whiteSpace",
    "wordWrap",
    "wordBreak",
    "overflowWrap",
  ] as const;

  mirror.setAttribute("aria-hidden", "true");
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.overflow = "auto";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";

  for (const prop of properties) {
    mirror.style[prop] = style[prop];
  }
  mirror.style.width = `${textarea.clientWidth}px`;

  const text = textarea.value.slice(0, selectionEnd);
  mirror.textContent = text;
  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const mirrorRect = mirror.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  const textareaRect = textarea.getBoundingClientRect();

  const top =
    textareaRect.top +
    (markerRect.top - mirrorRect.top) -
    textarea.scrollTop +
    parseFloat(style.borderTopWidth || "0");
  const left =
    textareaRect.left +
    (markerRect.left - mirrorRect.left) -
    textarea.scrollLeft +
    parseFloat(style.borderLeftWidth || "0");

  document.body.removeChild(mirror);

  return {
    top,
    left,
    bottom: top + (parseFloat(style.lineHeight) || 20),
  };
}

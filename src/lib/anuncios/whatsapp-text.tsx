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

type Segment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "strike"; value: string };

const TOKEN_RE = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;

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
    if (token.startsWith("*") && token.endsWith("*")) {
      segments.push({ type: "bold", value: token.slice(1, -1) });
    } else if (token.startsWith("_") && token.endsWith("_")) {
      segments.push({ type: "italic", value: token.slice(1, -1) });
    } else if (token.startsWith("~") && token.endsWith("~")) {
      segments.push({ type: "strike", value: token.slice(1, -1) });
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
  return <span key={key}>{segment.value}</span>;
}

/** Renderiza formato WhatsApp: *negrita*, _cursiva_, ~tachado~ y emojis Unicode. */
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

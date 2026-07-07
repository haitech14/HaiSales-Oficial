export async function copyTextToClipboard(text: string): Promise<void> {
  const attemptCopy = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // Continúa con el fallback (p. ej. HTTP por IP sin contexto seguro).
      }
    }

    if (typeof document === "undefined") {
      throw new Error("clipboard unavailable");
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!copied) {
      throw new Error("clipboard unavailable");
    }
  };

  await Promise.race([
    attemptCopy(),
    new Promise<void>((_, reject) => {
      window.setTimeout(() => reject(new Error("clipboard timeout")), 4000);
    }),
  ]);
}

export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      window.setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

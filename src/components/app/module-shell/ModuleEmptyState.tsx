import { cn } from "@/lib/utils";
import { DocumentSearchIcon } from "@/components/app/icons/DocumentSearchIcon";

export const EMPTY_STATE_MASCOT_CHARACTER_SRC = "/illustrations/empty-state-mascot-character.png";

type ModuleEmptyStateProps = {
  /** Texto en una sola línea. */
  message?: string;
  /** Texto en varias filas (tiene prioridad sobre `message`). */
  messageLines?: string[];
  hint?: string;
  className?: string;
  /** Versión reducida para tablas o paneles estrechos. */
  compact?: boolean;
};

function EmptyStateBubbleIcon({ className }: { className?: string }) {
  return <DocumentSearchIcon className={cn("h-11 w-11", className)} />;
}

function EmptyStateDecorations() {
  return (
    <>
      <span
        className="pointer-events-none absolute left-[8%] top-[18%] text-lg font-light text-slate-200"
        aria-hidden="true"
      >
        +
      </span>
      <span
        className="pointer-events-none absolute right-[10%] top-[24%] text-lg font-light text-slate-200"
        aria-hidden="true"
      >
        +
      </span>
      <span
        className="pointer-events-none absolute left-[6%] top-[42%] grid grid-cols-4 gap-1 opacity-40"
        aria-hidden="true"
      >
        {Array.from({ length: 12 }).map((_, index) => (
          <span key={index} className="h-1 w-1 rounded-full bg-slate-300" />
        ))}
      </span>
      <span
        className="pointer-events-none absolute right-[7%] top-[48%] grid grid-cols-4 gap-1 opacity-40"
        aria-hidden="true"
      >
        {Array.from({ length: 12 }).map((_, index) => (
          <span key={index} className="h-1 w-1 rounded-full bg-slate-300" />
        ))}
      </span>
      <span
        className="pointer-events-none absolute bottom-[18%] left-[12%] h-16 w-24 rounded-full bg-blue-100/50 blur-2xl"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-[22%] right-[10%] h-14 w-20 rounded-full bg-blue-100/40 blur-2xl"
        aria-hidden="true"
      />
    </>
  );
}

export function ModuleEmptyState({
  message,
  messageLines,
  hint,
  className,
  compact = false,
}: ModuleEmptyStateProps) {
  const lines =
    messageLines && messageLines.length > 0
      ? messageLines
      : message
        ? [message]
        : ["Sin información para mostrar."];

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden text-center",
        compact ? "px-4 py-8" : "px-6 py-12 sm:py-16",
        className,
      )}
    >
      <EmptyStateDecorations />

      <div
        className={cn(
          "relative z-10 mx-auto w-full",
          compact ? "mb-1 max-w-[min(100%,320px)]" : "mb-2 max-w-[min(100%,440px)]",
        )}
      >
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-[0_10px_32px_rgba(15,23,42,0.12)] sm:px-6 sm:py-5">
          <EmptyStateBubbleIcon
            className={cn("text-slate-500", compact ? "h-9 w-9" : "h-10 w-10")}
          />
          <div
            className={cn(
              "mt-3 font-normal leading-snug text-slate-600",
              compact ? "text-sm" : "text-sm sm:text-[15px]",
            )}
          >
            {lines.map((line, index) => (
              <p key={`${index}-${line}`} className={index > 0 ? "mt-0.5" : undefined}>
                {line}
              </p>
            ))}
          </div>
        </div>
        <div
          className="absolute left-1/2 top-full h-3.5 w-3.5 -translate-x-1/2 -translate-y-2 rotate-45 border-b border-r border-slate-200 bg-white shadow-[3px_3px_6px_rgba(15,23,42,0.06)]"
          aria-hidden="true"
        />
      </div>

      <img
        src={EMPTY_STATE_MASCOT_CHARACTER_SRC}
        alt=""
        className={cn(
          "relative z-10 w-auto max-w-full select-none object-contain object-bottom",
          compact ? "mt-1 h-[190px]" : "mt-3 h-[260px] sm:h-[300px]",
        )}
        decoding="async"
      />

      {hint ? (
        <p className={cn("relative z-10 max-w-sm text-slate-400", compact ? "mt-2 text-xs" : "mt-3 text-xs")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

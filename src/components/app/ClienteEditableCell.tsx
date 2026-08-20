import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Loader2, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ClienteEditableCellProps = {
  value: string;
  onSave: (value: string) => Promise<void>;
  type?: "text" | "select" | "textarea";
  options?: string[];
  displayValue?: ReactNode;
  className?: string;
  inputClassName?: string;
  inputType?: "text" | "date";
  truncate?: boolean;
  nowrap?: boolean;
  compact?: boolean;
  inline?: boolean;
  title?: string;
};

function toDraft(value: string, inputType: "text" | "date") {
  if (value === "—") return "";
  if (inputType !== "date") return value;

  const parts = value.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return value;
}

function fromDraft(value: string, inputType: "text" | "date") {
  const trimmed = value.trim();
  if (trimmed === "") return "—";

  if (inputType === "date" && /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-");
    return `${day}/${month}/${year}`;
  }

  return trimmed;
}

export function ClienteEditableCell({
  value,
  onSave,
  type = "text",
  options = [],
  displayValue,
  className,
  inputClassName,
  inputType = "text",
  truncate = false,
  nowrap = false,
  compact = false,
  inline = false,
  title,
}: ClienteEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(toDraft(value, inputType));
  const [isSaving, setIsSaving] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) setDraft(toDraft(value, inputType));
  }, [isEditing, value, inputType]);

  useEffect(() => {
    if (isEditing && type !== "select") inputRef.current?.focus();
  }, [isEditing, type]);

  useEffect(() => {
    if (isEditing && type === "select") setSelectOpen(true);
  }, [isEditing, type]);

  const cancel = () => {
    setDraft(toDraft(value, inputType));
    setIsEditing(false);
    setSelectOpen(false);
  };

  const save = async (nextRaw?: string) => {
    const nextValue = fromDraft(nextRaw ?? draft, inputType);
    if (nextValue === value) {
      setIsEditing(false);
      setSelectOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(nextValue);
      setIsEditing(false);
      setSelectOpen(false);
    } catch {
      setDraft(toDraft(value, inputType));
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && type !== "textarea") {
      event.preventDefault();
      void save();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  };

  if (isEditing && type === "select") {
    const current = draft || (value !== "—" ? value : options[0] || "");

    return (
      <div className={cn("relative min-w-[120px]", className)}>
        <DropdownMenu open={selectOpen} onOpenChange={(open) => {
          setSelectOpen(open);
          if (!open && !isSaving) cancel();
        }}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isSaving}
              className={cn(
                "flex w-full items-center justify-between gap-1 rounded-md border border-blue-300 bg-white text-left shadow-sm outline-none ring-2 ring-blue-100",
                compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs",
                inputClassName,
              )}
            >
              <span className="truncate font-medium text-slate-800">{current}</span>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-500" /> : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-64 w-[min(240px,90vw)] overflow-y-auto p-1">
            {options.map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => {
                  setDraft(option);
                  void save(option);
                }}
                className={cn(
                  "cursor-pointer rounded-md text-xs",
                  option === current && "bg-blue-50 font-semibold text-blue-700",
                )}
              >
                <span className="flex-1 truncate">{option}</span>
                {option === current ? <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-blue-600" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (isEditing) {
    const controlClass = cn(
      "rounded border border-blue-300 bg-white text-slate-800 shadow-sm outline-none ring-2 ring-blue-100",
      compact ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm",
      inline ? "w-auto max-w-full" : "w-full",
      inputClassName,
    );

    return (
      <div className={cn("relative min-w-[80px]", className)}>
        {type === "textarea" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => void save()}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            rows={2}
            className={cn(controlClass, "resize-none")}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={inputType}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => void save()}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className={controlClass}
          />
        )}
        {isSaving && (
          <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-blue-500" />
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      title={title ?? "Clic para editar"}
      className={cn(
        "group/cell relative items-center gap-0.5 rounded text-left transition",
        inline ? "inline-flex max-w-full" : "flex w-full min-w-0",
        compact ? "px-1 py-0" : "px-1.5 py-1",
        "hover:bg-blue-50 hover:ring-1 hover:ring-blue-200",
        className,
      )}
    >
      <span
        className={cn(
          "text-slate-600 group-hover/cell:text-slate-800",
          !inline && "min-w-0 flex-1",
          truncate && "block truncate",
          nowrap && "whitespace-nowrap",
        )}
        title={truncate || nowrap ? value : undefined}
      >
        {displayValue ?? value}
      </span>
      {type === "select" ? null : (
        <Pencil className="h-3 w-3 shrink-0 text-blue-500 opacity-0 transition group-hover/cell:opacity-100" />
      )}
    </button>
  );
}

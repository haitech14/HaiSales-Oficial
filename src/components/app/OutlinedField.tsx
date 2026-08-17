import { cn } from "@/lib/utils";

type OutlinedFieldProps = {
  label?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function OutlinedField({
  label,
  required,
  children,
  className,
  contentClassName,
}: OutlinedFieldProps) {
  return (
    <div className={cn("relative rounded-[10px] border border-slate-300 bg-white", className)}>
      {label ? (
        <span className="absolute -top-2 left-2.5 z-[1] bg-white px-1 text-[11px] font-medium leading-none text-slate-500">
          {label}
          {required ? <span className="sr-only"> obligatorio</span> : null}
        </span>
      ) : null}
      <div className={cn("flex min-h-[46px] w-full items-center px-3 py-1.5", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

type DocumentSearchIconProps = {
  className?: string;
};

/** Documento con lupa — estado vacío de búsqueda. */
export function DocumentSearchIcon({ className }: DocumentSearchIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" fill="#EFF6FF" />
      <rect x="16" y="12" width="24" height="32" rx="5" fill="white" stroke="#64748B" strokeWidth="2" />
      <path d="M33 12V20C33 21.6569 34.3431 23 36 23H40" stroke="#64748B" strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 12L40 20C40 21.6569 38.6569 23 37 23H33" fill="#E2E8F0" />
      <path d="M21 26H31M21 31H31M21 36H27" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="40" r="9" fill="white" stroke="#2563EB" strokeWidth="2.4" />
      <path d="M46.4 46.4L52 52" stroke="#2563EB" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

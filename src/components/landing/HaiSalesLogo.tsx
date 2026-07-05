import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const HAISALES_LOGO_SRC = "/haisaleslogo.png";
export const HAISALES_ICON_SRC = "/haisaleslogo.png";

interface HaiSalesLogoProps {
  href?: string;
  to?: string;
  className?: string;
  onClick?: () => void;
  /** Muestra solo el ícono cuadrado (sidebar colapsado, header móvil). */
  iconOnly?: boolean;
  imageClassName?: string;
  /** Logo textual del mockup de landing con tagline Odoo. */
  variant?: "default" | "landing";
}

export function HaiSalesLogo({
  href = "#inicio",
  to,
  className,
  onClick,
  iconOnly = false,
  imageClassName,
  variant = "default",
}: HaiSalesLogoProps) {
  const src = iconOnly ? HAISALES_ICON_SRC : HAISALES_LOGO_SRC;
  const alt = iconOnly ? "HaiSales" : "HaiSales — basado en Odoo ERP";

  const content =
    variant === "landing" && !iconOnly ? (
      <>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-blue-500 to-blue-700 shadow-lg shadow-blue-600/30">
          <BarChart3 className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-white">HAISales</span>
          <span className="mt-1 text-[10px] font-normal text-slate-400">basado en Odoo® ERP</span>
        </span>
      </>
    ) : (
      <>
        <img
          src={src}
          alt={alt}
          className={cn(
            iconOnly ? "h-8 w-8 object-cover object-left" : "h-10 w-auto max-w-[240px] object-contain",
            imageClassName,
          )}
          width={iconOnly ? 32 : 200}
          height={36}
          decoding="async"
        />
        <span className="sr-only">HaiSales</span>
      </>
    );

  const wrapperClass = cn(
    "inline-flex shrink-0 items-center",
    variant === "landing" && !iconOnly && "gap-2.5",
    className,
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={wrapperClass}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} onClick={onClick} className={wrapperClass}>
      {content}
    </a>
  );
}

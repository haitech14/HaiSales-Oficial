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
}

export function HaiSalesLogo({
  href = "#inicio",
  to,
  className,
  onClick,
  iconOnly = false,
  imageClassName,
}: HaiSalesLogoProps) {
  const src = iconOnly ? HAISALES_ICON_SRC : HAISALES_LOGO_SRC;
  const alt = iconOnly ? "HaiSales" : "HaiSales — Desarrollado por HAITECH";

  const content = (
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

  const wrapperClass = cn("inline-flex shrink-0 items-center", className);

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

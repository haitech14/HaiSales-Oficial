import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const HAISALES_LOGO_SRC = "/logo.png";
export const HAISALES_LOGO_LIGHT_SRC = "/haisales-logo-claro.png";
export const HAISALES_ICON_SRC = "/logo.png";
export const HAISALES_ICON_LIGHT_SRC = "/haisales-logo-claro.png";

type LogoTheme = "onDark" | "onLight";

interface HaiSalesLogoProps {
  href?: string;
  to?: string;
  className?: string;
  onClick?: () => void;
  /** Muestra solo el ícono (sidebar colapsado, header móvil). */
  iconOnly?: boolean;
  imageClassName?: string;
  /** onDark: haisales-logo-claro.png · onLight: logo.png */
  theme?: LogoTheme;
  /** @deprecated Usa theme para elegir el archivo de logo. */
  variant?: "default" | "landing";
}

function getLogoSrc(theme: LogoTheme, iconOnly: boolean) {
  if (theme === "onDark") {
    return iconOnly ? HAISALES_ICON_LIGHT_SRC : HAISALES_LOGO_LIGHT_SRC;
  }
  return iconOnly ? HAISALES_ICON_SRC : HAISALES_LOGO_SRC;
}

export function HaiSalesLogo({
  href = "#inicio",
  to,
  className,
  onClick,
  iconOnly = false,
  imageClassName,
  theme = "onDark",
  variant: _variant = "default",
}: HaiSalesLogoProps) {
  const content = (
    <img
      src={getLogoSrc(theme, iconOnly)}
      alt="HaiSales"
      className={cn(
        iconOnly
          ? "h-8 w-8 object-contain object-left"
          : "h-10 w-auto max-w-[240px] object-contain object-left",
        imageClassName,
      )}
      width={iconOnly ? 32 : 200}
      height={iconOnly ? 32 : 40}
      decoding="async"
    />
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

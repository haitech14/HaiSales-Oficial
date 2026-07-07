import { Check, Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { HaiSalesLogo } from "./HaiSalesLogo";
const productLinks = [
  { label: "Ventas", href: "#modulos" },
  { label: "CRM", href: "#modulos" },
  { label: "Facturación electrónica", href: "#modulos" },
  { label: "Reportes", href: "#modulos" },
  { label: "Integraciones", href: "#modulos" },
  { label: "Planes", href: "#planes" },
];

const resourceLinks = [
  { label: "Centro de ayuda", href: "#" },
  { label: "Tutoriales", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Guías", href: "#" },
  { label: "Estado del sistema", href: "#" },
];

const companyLinks = [
  { label: "Nosotros", href: "#" },
  { label: "Clientes", href: "#" },
  { label: "Trabaja con nosotros", href: "#" },
  { label: "Partners", href: "#" },
  { label: "Contacto", href: "#contacto" },
];

const legalLinks = [
  { label: "Términos y condiciones", href: "#" },
  { label: "Política de privacidad", href: "#" },
  { label: "Política de cookies", href: "#" },
  { label: "Factura y boletas", href: "#" },
  { label: "Seguridad", href: "#" },
];

const socialLinks = [
  { label: "Facebook", href: "#", icon: Facebook },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "LinkedIn", href: "#", icon: Linkedin },
  { label: "YouTube", href: "#", icon: Youtube },
];

const trustItems = ["14 días gratis", "Sin tarjeta", "Cancelas cuando quieras"];

function FooterLinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer id="contacto" className="bg-[#050d1a]">
      {/* CTA banner */}
      <div className="bg-[#0a1628] px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-12">
          <div>
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[2rem]">
              Empieza hoy y convierte más oportunidades en facturas pagadas
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Únete a más de 3,200 negocios que ya venden mejor con HaiSales.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Crear cuenta gratis
            </Link>
            <div className="flex flex-wrap items-center gap-4">
              {trustItems.map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t border-white/[0.06] px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-8">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <HaiSalesLogo theme="onDark" imageClassName="h-11 w-auto max-w-[220px]" />
            <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-slate-400">
              La plataforma de ventas, CRM y facturación electrónica para negocios de LATAM.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white"
                >
                  <social.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <FooterLinkColumn title="Producto" links={productLinks} />
          <FooterLinkColumn title="Recursos" links={resourceLinks} />
          <FooterLinkColumn title="Empresa" links={companyLinks} />
          <FooterLinkColumn title="Legal" links={legalLinks} />
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/[0.06] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
          <p>© 2024 HaiSales. Todos los derechos reservados.</p>
          <p>Hecho con <span className="text-red-400">♥</span> para los negocios de LATAM.</p>
        </div>
      </div>
    </footer>
  );
}

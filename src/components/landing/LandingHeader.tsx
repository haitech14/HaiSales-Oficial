import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LOGIN_PATH, REGISTER_LOGIN_PATH } from "@/lib/auth-routes";
import { HaiSalesLogo } from "./HaiSalesLogo";

const navLinks = [
  { label: "Inicio", href: "#inicio", active: true },
  { label: "Módulos", href: "#modulos" },
  { label: "Planes", href: "#planes" },
  { label: "Contacto", href: "#contacto" },
];

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#050816]/90 backdrop-blur-xl">
      <div className="mx-auto grid h-[72px] w-full max-w-[90rem] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-10 xl:px-12">
        <HaiSalesLogo variant="landing" theme="onDark" imageClassName="h-11 w-auto max-w-[220px]" />

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`relative text-sm font-medium transition-colors hover:text-white ${
                link.active ? "text-white" : "text-slate-300"
              }`}
            >
              {link.label}
              {link.active && (
                <span className="absolute -bottom-1 left-0 right-0 mx-auto h-px w-full bg-white" />
              )}
            </a>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <Link
            to={LOGIN_PATH}
            className="hidden text-sm font-medium text-slate-300 transition hover:text-white sm:inline-flex"
          >
            Iniciar Sesión
          </Link>
          <Link
            to={REGISTER_LOGIN_PATH}
            className="hidden rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 sm:inline-flex lg:px-5"
          >
            Probar Gratis 14 días
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white lg:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="border-white/10 bg-[#050816] text-white">
              <SheetHeader>
                <SheetTitle className="text-left text-white">
                  <HaiSalesLogo variant="landing" theme="onDark" imageClassName="h-11 w-auto max-w-[220px]" />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-3 py-3 text-base font-medium hover:bg-white/5 ${
                      link.active ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <Link
                to={LOGIN_PATH}
                onClick={() => setMobileOpen(false)}
                className="mt-8 flex rounded-lg border border-white/10 px-4 py-3 text-center text-sm font-medium text-slate-300 hover:bg-white/5"
              >
                Iniciar Sesión
              </Link>
              <Link
                to={REGISTER_LOGIN_PATH}
                onClick={() => setMobileOpen(false)}
                className="mt-3 flex rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold"
              >
                Probar Gratis 14 días
              </Link>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
